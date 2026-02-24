 import api from "./axios";
import type {
  LoginRequest,
  SignupRequest,
  AuthResponse,
} from "@/types/auth.types";

export const authApi = {
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/api/auth/signup", data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/api/auth/login", data);
    return response.data;
  },
};