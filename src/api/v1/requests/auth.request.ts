import type { Role } from "../../../constants";

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: Role;
}
