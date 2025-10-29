import type { AccountStatus, Role } from "../../../constants";

export interface mockUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  emailVerified: Date | null;
  accountStatus: AccountStatus;
  createdAt: Date;
  userRoles: { role: Role }[];
}
