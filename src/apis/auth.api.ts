import { axiosClient } from "@/lib/axios";
import type { ApiEnvelope } from "@/types/api";
import type { LoginCredentials, LoginResponse, AuthUser } from "@/types/auth";

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const { data } = await axiosClient.post<ApiEnvelope<LoginResponse>>("/auth/login", credentials);
  return data.data;
}

export async function me(): Promise<AuthUser> {
  const { data } = await axiosClient.get<ApiEnvelope<AuthUser>>("/auth/me");
  return data.data;
}

export async function logout(): Promise<void> {
  await axiosClient.post("/auth/logout");
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await axiosClient.patch("/auth/password", payload);
}
