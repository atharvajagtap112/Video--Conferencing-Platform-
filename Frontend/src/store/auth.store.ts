import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/types/auth.types";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Hydrate from localStorage on app load
function loadUserFromStorage(): AuthUser | null {
  try {
    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");
    if (token && userJson) {
      const user = JSON.parse(userJson) as AuthUser;
      return { ...user, token };
    }
  } catch {
    // corrupted data — clear it
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
  return null;
}

const storedUser = loadUserFromStorage();

const initialState: AuthState = {
  user: storedUser,
  isAuthenticated: storedUser !== null,
  isLoading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    loginSuccess(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      // Persist
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          username: action.payload.username,
          displayName: action.payload.displayName,
        })
      );
      console.log("✅ Login successful - Token stored:", action.payload.token.substring(0, 20) + "...");
      console.log("✅ User stored:", action.payload.username);
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
});

export const { setLoading, loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;