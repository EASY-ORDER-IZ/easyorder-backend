import { z } from "zod";
import { Role } from "../../../constants";
import type { User } from "../../../entities/User";

export const registerResponseDto = z.object({
  userId: z.string(),
  username: z.string(),
  email: z.string(),
  role: z.nativeEnum(Role),
  isVerified: z.boolean(),
  createdAt: z.string(),
  store: z
    .object({
      storeId: z.string(),
      storeName: z.string(),
      createdAt: z.string(),
    })
    .optional(),
});

export type RegisterResponseDto = z.infer<typeof registerResponseDto>;

export function toRegisterResponseDto(
  user: User,
  role: Role
): RegisterResponseDto {
  return {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: role,
    isVerified: user.emailVerified !== null,
    createdAt: user.createdAt.toISOString(),
    ...(user.store && {
      store: {
        storeId: user.store.id,
        storeName: user.store.name,
        createdAt: user.store.createdAt.toISOString(),
      },
    }),
  };
}

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

export interface UserProfileResponse {
  userId: string;
  username: string;
  email: string;
  store: {
    storeId: string | null;
    name: string | null;
  };
  roles: Role[];
  isVerified: boolean;
  createdAt: string;
}
