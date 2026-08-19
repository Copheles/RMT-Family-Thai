export type Role = "super_admin" | "ygn" | "thai";
export type Branch = "YGN" | "THAI";

export interface AuthUser {
  role: Role;
  username: string;
  branch?: Branch;
  userId?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
}

export interface FieldErrors {
  [field: string]: string;
}

export interface ApiError {
  message: string;
  errors?: FieldErrors;
}
