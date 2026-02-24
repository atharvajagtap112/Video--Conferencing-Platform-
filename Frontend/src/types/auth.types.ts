// Mirrors: com.atharva.backend.auth.dto.SignupRequest
export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

// Mirrors: com.atharva.backend.auth.dto.LoginRequest
export interface LoginRequest {
  username: string;
  password: string;
}

// Mirrors: com.atharva.backend.auth.dto.AuthResponse
export interface AuthResponse {
  token: string;
  username: string;
  displayName: string;
}

export interface AuthUser {
  token: string;
  username: string;
  displayName: string;
}