import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "@/api/auth.api";
import { useAppDispatch, useAppSelector } from "@/store";
import { loginSuccess, logout as logoutAction, setLoading } from "@/store/auth.store";
import type { LoginRequest, SignupRequest } from "@/types/auth.types";

export function useAuth() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAppSelector(
    (state) => state.auth
  );

  const login = useCallback(
    async (data: LoginRequest) => {
      dispatch(setLoading(true));
      try {
        const response = await authApi.login(data);
        dispatch(loginSuccess(response));
        toast.success(`Welcome back, ${response.displayName}!`);
        navigate("/dashboard");
      } catch {
        dispatch(setLoading(false));
        // Error is handled by axios interceptor
      }
    },
    [dispatch, navigate]
  );

  const signup = useCallback(
    async (data: SignupRequest) => {
      dispatch(setLoading(true));
      try {
        const response = await authApi.signup(data);
        dispatch(loginSuccess(response));
        toast.success(`Account created! Welcome, ${response.displayName}!`);
        navigate("/dashboard");
      } catch {
        dispatch(setLoading(false));
      }
    },
    [dispatch, navigate]
  );

  const logout= useCallback(()=>{
    dispatch(logoutAction());
    toast.success("You have been logged out.");
    navigate("/");
  },[dispatch,navigate] )

  return { user, isAuthenticated, isLoading, login, signup, logout };
}