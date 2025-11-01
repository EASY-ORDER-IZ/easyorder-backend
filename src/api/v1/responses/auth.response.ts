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
