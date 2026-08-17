export type UserRole = "editor" | "admin";

export type AuthUser = {
  id: string;
  identifier: string;
  displayName: string;
  role: UserRole;
};

export type LoginData = {
  token: string;
  user: AuthUser;
};