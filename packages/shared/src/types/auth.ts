export type UserRole = "editor" | "admin";

export type AuthUser = {
  id: string;
  identifier: string;
  displayName: string;
  role: UserRole;
};

export type LoginRequest = {
  identifier: string;
  password: string;
};

export type LoginData = {
  token: string;
  user: AuthUser;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type AuthMeData = {
  user: AuthUser;
};