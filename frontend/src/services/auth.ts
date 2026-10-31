import api from "./api";
import type { ApiResponse, User } from "../types";

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
}

export interface AdminSignupPayload extends RegisterPayload {
  admin_signup_key: string;
}

interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export const authApi = {
  login: (payload: LoginPayload) => api.post<ApiResponse<AuthResponse>>("/auth/login", payload).then((r) => r.data.data),

  register: (payload: RegisterPayload) =>
    api.post<ApiResponse<AuthResponse>>("/auth/register", payload).then((r) => r.data.data),

  adminSignup: (payload: AdminSignupPayload) =>
    api.post<ApiResponse<AuthResponse>>("/auth/admin/signup", payload).then((r) => r.data.data),

  me: () => api.get<ApiResponse<{ user: User }>>("/auth/me").then((r) => r.data.data.user),
};
