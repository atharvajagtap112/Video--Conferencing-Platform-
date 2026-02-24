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
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 globally ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message =
        (error.response?.data as { message?: string })?.message ||
        error.message;

      if (status === 401) {
        // Token expired or invalid — clear auth and redirect
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        toast.error("Session expired. Please log in again.");
      } else if (status === 403) {
        toast.error("You don't have permission to do that.");
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