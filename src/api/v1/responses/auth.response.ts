import type { Role } from "../../../constants";

export interface RegisterResponse {
  data: {
    userId: string;
    username: string;
    email: string;
    role: Role;
    isVerified: boolean;
    createdAt: string;
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{ message: string }>;
  };
}
