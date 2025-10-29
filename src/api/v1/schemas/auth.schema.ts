import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const registerSchema = z
  .object({
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
      .max(255, "Email must not exceed 255 characters"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])\S+$/,
        "Password must contain at least one uppercase letter, one number, one special character, and no spaces"
      ),
    confirmPassword: z.string(),
    createStore: z.enum(["yes", "no"], {
      message: "createStore must be 'yes' or 'no'",
    }),
    storeName: z
      .string()
      .min(3, "Store name must be at least 3 characters")
      .max(255, "Store name must not exceed 255 characters")
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .openapi("RegisterRequest");
// ! trim
export const verifyOtpSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email format")
      .max(255, "Email must not exceed 255 characters"),

    otpCode: z
      .string()
      .length(6, "OTP code must be exactly 6 characters")
      .regex(/^\d+$/, "OTP code must contain only digits"),
  })
  .openapi("VerifyOtpRequest");

export const resendOtpSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email format")
      .max(255, "Email must not exceed 255 characters"),
  })
  .openapi("ResendOtpRequest");

export const forgotPasswordSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email format")
      .max(255, "Email must not exceed 255 characters"),
  })
  .openapi("ForgotPasswordRequest");

export type RegisterRequest = z.infer<typeof registerSchema>;
export type VerifyOtpRequest = z.infer<typeof verifyOtpSchema>;
export type ResendOtpRequest = z.infer<typeof resendOtpSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
