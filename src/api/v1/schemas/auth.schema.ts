import { z } from "zod";
import { Role } from "../../../constants";

export const registerSchema = z.object({
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(20, "Username must not exceed 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),

  email: z
    .string()
    .email("Invalid email format")
    .max(50, "Email must not exceed 50 characters"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])\S+$/,
      "Password must contain at least one uppercase letter, one number, one special character, and no spaces"
    ),

  role: z.enum([Role.ADMIN, Role.CUSTOMER], {
    message: "Role must be either 'admin' or 'customer'",
  }),
});

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .max(50, "Email must not exceed 50 characters"),

  otpCode: z
    .string()
    .length(6, "OTP code must be exactly 6 characters")
    .regex(/^\d+$/, "OTP code must contain only digits"),
});

export type RegisterSchemaType = z.infer<typeof registerSchema>;
export type VerifyOtpSchemaType = z.infer<typeof verifyOtpSchema>;
