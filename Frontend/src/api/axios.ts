import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15_000,
});

// ── Request interceptor: attach JWT from localStorage once ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ Axios: Attaching token to request:", config.url, "Token:", token.substring(0, 20) + "...");
    } else {
      console.warn("⚠️ Axios: No token found in localStorage for request:", config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle errors globally ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message =
        (error.response?.data as { message?: string })?.message ||
        error.message;

      if (status === 401) {
        // Token expired or invalid — clear auth
        // Don't redirect here, let the AuthGuard handle it
        console.error("❌ 401 Unauthorized - Clearing auth");
        console.error("Request URL:", error.config?.url);
        console.error("Response:", error.response?.data);
        
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        
        // Dispatch a custom event that the app can listen to
        window.dispatchEvent(new CustomEvent('auth:logout'));
        
        toast.error("Session expired. Please log in again.");
      } else if (status === 403) {
        console.error("❌ 403 Forbidden - Access denied");
        console.error("Request URL:", error.config?.url);
        
        // If trying to join a closed room, just show a toast (don't clear auth)
        if (error.config?.url?.includes('/join')) {
          console.log("Room is closed or you don't have access");
          toast.error("This meeting has ended or you don't have access.");
        } else {
          // For other 403 errors, clear auth
          console.error("This usually means your token is valid but the user doesn't exist in the database.");
          console.error("Solution: Clear localStorage and signup again.");
          toast.error("Access denied. Please log in again.");
          
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
      } else if (status && status >= 500) {
        toast.error("Server error. Please try again later.");
      } else if (message) {
        toast.error(message);
      }
    }
    return Promise.reject(error);
  }
);

export default api;