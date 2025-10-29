import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(2, "Username must be at least 2 characters")
      .max(20, "Username must not exceed 20 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      )
      .openapi({
        example: "user_123",
        description: "The username of the new user",
      }),

    email: z
      .string()
      .trim()
      .email("Invalid email format")
      .max(255, "Email must not exceed 255 characters")
      .openapi({
        example: "user@gmail.com",
        description: "The email of the new user",
      }),

    password: z
      .string()
      .trim()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])\S+$/,
        "Password must contain at least one uppercase letter, one number, one special character, and no spaces"
      )
      .openapi({
        example: "str0ngP@ssword",
        description: "The password of the user",
      }),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])\S+$/,
        "Password must contain at least one uppercase letter, one number, one special character, and no spaces"
      )
      .trim()
      .openapi({
        example: "str0ngP@ssword",
        description: "The confirm password of the user",
      }),
    createStore: z
      .enum(["yes", "no"], {
        message: "createStore must be 'yes' or 'no'",
      })
      .openapi({
        example: "yes",
        description: "Indicates whether to create a store for the user",
      }),
    storeName: z
      .string()
      .trim()
      .min(3, "Store name must be at least 3 characters")
      .max(255, "Store name must not exceed 255 characters")
      .optional()
      .openapi({
        example: "My Awesome Store",
        description:
          "The name of the store to be created (required if createStore is 'yes')",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .openapi("RegisterRequest");

export const loginSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email format")
      .max(255, "Email must not exceed 255 characters")
      .openapi({
        example: "email@gmail.com",
        description: "The email of the user",
      }),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])\S+$/,
        "Password must contain at least one uppercase letter, one number, one special character, and no spaces"
      )
      .openapi({
        example: "str0ngP@ssword",
        description: "The password of the user",
      }),
  })
  .openapi("LoginRequest");

export const verifyOtpSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Invalid email format")
      .max(255, "Email must not exceed 255 characters"),

    otpCode: z
      .string()
      .trim()
      .length(6, "OTP code must be exactly 6 characters")
      .regex(/^\d+$/, "OTP code must contain only digits"),
  })
  .openapi("VerifyOtpRequest");

export const loginResponseSchema = z.object({
  data: z.object({
    user: z.object({
      userId: z.string(),
      username: z.string(),
      email: z.string(),
      role: z.enum(["customer", "admin"]),
      isVerified: z.boolean(),
      createdAt: z.string(),
    }),
    tokens: z.object({
      accessToken: z.string(),
      refreshToken: z.string(),
      accessTokenExpiresIn: z.number(),
      refreshTokenExpiresIn: z.number(),
    }),
  }),
});
export const resendOtpSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Invalid email format")
      .max(255, "Email must not exceed 255 characters"),
  })
  .openapi("ResendOtpRequest");

export const logoutSchema = z
  .object({
    refreshToken: z.string().min(1, "Refresh token is required").openapi({
      example: "refresh-token",
      description: "add your refresh token",
    }),
  })
  .openapi("LogoutRequest");

export const forgotPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Invalid email format")
      .max(255, "Email must not exceed 255 characters"),
  })
  .openapi("ForgotPasswordRequest");

export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Invalid email format")
      .max(255, "Email must not exceed 255 characters"),

    otpCode: z
      .string()
      .trim()
      .length(6, "OTP code must be exactly 6 characters")
      .regex(/^\d+$/, "OTP code must contain only digits"),

    newPassword: z
      .string()
      .trim()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])\S+$/,
        "Password must contain at least one uppercase letter, one number, one special character, and no spaces"
      ),
  })
  .openapi("ResetPasswordRequest");

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LogoutRequest = z.infer<typeof logoutSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type VerifyOtpRequest = z.infer<typeof verifyOtpSchema>;
export type loginResponseSchema = z.infer<typeof loginResponseSchema>;
export type ResendOtpRequest = z.infer<typeof resendOtpSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
