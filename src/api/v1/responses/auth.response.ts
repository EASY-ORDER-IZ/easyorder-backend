import type { Role } from "../../../constants";

export interface RegisterResponse {
  data: {
    userId: string;
    username: string;
    email: string;
    role: Role;
    isVerified: boolean;
    createdAt: string;
    store?: {
      storeId: string;
      storeName: string;
      createdAt: string;
    };
  };
}

export interface VerifyOtpResponse {
  data: {
    userId: string;
    email: string;
    isVerified: boolean;
    verifiedAt: string;
  };
}

export interface ResendOtpResponse {
  data: {
    email: string;
    expiresInMinutes: number;
  };
}

export interface ForgotPasswordResponse {
  data: {
    email: string;
    expiresInMinutes: number;
  };
}

export interface ResetPasswordResponse {
  data: {
    email: string;
    message: string;
    resetAt: string;
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{ message: string }>;
  };
}
