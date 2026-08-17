import type { AuthUser, UserRole } from "../types/auth.js";

export type UserRecord = {
  id: string;
  username: string;
  phone: string | null;
  email: string | null;
  passwordHash: string;
  displayName: string;
  role: UserRole;
};

export function toAuthUser(user: UserRecord): AuthUser {
  return {
    id: user.id,
    identifier: user.username,
    displayName: user.displayName,
    role: user.role,
  };
}