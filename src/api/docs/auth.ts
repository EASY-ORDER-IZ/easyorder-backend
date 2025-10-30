import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  loginResponseSchema,
  resendOtpSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from "../v1/schemas/auth.schema";

const authPath = "/api/v1/auth";

export const registerAuthDocs = (registry: OpenAPIRegistry): void => {
  registry.register("RegisterRequest", registerSchema);
  registry.register("LoginRequest", loginSchema);
  registry.register("VerifyOtpRequest", verifyOtpSchema);
  registry.register("LoginResponse", loginResponseSchema);

  registry.registerPath({
    path: `${authPath}/register`,
    method: "post",
    summary: "Register a new user",
    tags: ["Auth"],
    description: `Creates a new user account and sends a verification OTP email.`,
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: registerSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "User registered successfully",
        content: {
          "application/json": {
            schema: registerSchema,
          },
        },
      },
      400: {
        description: "Invalid input",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "INVALID_INPUT" },
                    messages: {
                      type: "array",
                      items: { type: "string" },
                      example: [
                        "Password must contain at least 1 uppercase.",
                        "Password must contain at least 1 number.",
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
      409: {
        description: "Email already exists",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "EMAIL_EXISTS" },
                    message: {
                      type: "string",
                      example: "Email already registered.",
                    },
                  },
                },
              },
            },
          },
        },
      },
      500: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "SERVER_ERROR" },
                    message: {
                      type: "string",
                      example: "Something went wrong.",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/auth/login",
    summary: "Login user",
    tags: ["Auth"],
    description: "Authenticates user credentials and returns JWT tokens.",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Login successful",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginResponse" },
          },
        },
      },
      400: {
        description: "Invalid credentials",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "INVALID_CREDENTIALS" },
                    message: {
                      type: "string",
                      example: "Wrong email or password.",
                    },
                  },
                },
              },
            },
          },
        },
      },
      401: {
        description: "Email not verified",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "EMAIL_NOT_VERIFIED" },
                    message: {
                      type: "string",
                      example: "Please verify your email before logging in.",
                    },
                  },
                },
              },
            },
          },
        },
      },
      403: {
        description: "Account locked",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "ACCOUNT_LOCKED" },
                    message: {
                      type: "string",
                      example:
                        "Your account is temporarily locked due to multiple failed attempts.",
                    },
                  },
                },
              },
            },
          },
        },
      },
      429: {
        description: "Too many login attempts",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "TOO_MANY_ATTEMPTS" },
                    message: {
                      type: "string",
                      example: "Too many login attempts. Try again later.",
                    },
                  },
                },
              },
            },
          },
        },
      },
      500: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "SERVER_ERROR" },
                    message: {
                      type: "string",
                      example: "Something went wrong.",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  registry.registerPath({
    path: `${authPath}/verify-otp`,
    method: "post",
    summary: "Verify user OTP",
    tags: ["Auth"],
    description: `Verifies the OTP sent to the user's email during registration.`,
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: verifyOtpSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "OTP verified successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: {
                  type: "object",
                  properties: {
                    userId: { type: "string", example: "uuid" },
                    email: { type: "string", example: "john@example.com" },
                    isVerified: { type: "boolean", example: true },
                    verifiedAt: {
                      type: "string",
                      format: "date-time",
                      example: "2025-10-07T10:35:00.000Z",
                    },
                  },
                },
              },
            },
          },
        },
      },
      400: {
        description: "Invalid or expired OTP",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "INVALID_OTP" },
                    message: {
                      type: "string",
                      example: "OTP is invalid or expired.",
                    },
                  },
                },
              },
            },
          },
        },
      },
      404: {
        description: "User not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "OTP_NOT_FOUND" },
                    message: {
                      type: "string",
                      example: "OTP does not exist or has already been used.",
                    },
                  },
                },
              },
            },
          },
        },
      },
      409: {
        description: "Email already verified",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "ALREADY_VERIFIED" },
                    message: {
                      type: "string",
                      example: "Email is already verified.",
                    },
                  },
                },
              },
            },
          },
        },
      },
      500: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "SERVER_ERROR" },
                    message: {
                      type: "string",
                      example: "Something went wrong.",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  registry.registerPath({
    path: `${authPath}/resend-otp`,
    method: "post",
    summary: "Resend verification OTP",
    tags: ["Auth"],
    description: `Resends a new OTP to the user's email if their account is still pending verification.`,
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: resendOtpSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "OTP resent successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: {
                  type: "object",
                  properties: {
                    email: { type: "string", example: "john@example.com" },
                    expiresInMinutes: { type: "number", example: 10 },
                  },
                },
              },
            },
          },
        },
      },
      400: {
        description: "Bad request — invalid state or already verified",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: {
                      type: "string",
                      enum: [
                        "EMAIL_ALREADY_VERIFIED",
                        "INVALID_ACCOUNT_STATUS",
                      ],
                      example: "EMAIL_ALREADY_VERIFIED",
                    },
                    message: {
                      type: "string",
                      example: "Email is already verified.",
                    },
                  },
                },
              },
            },
          },
        },
      },
      404: {
        description: "User not found with this email",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "USER_NOT_FOUND" },
                    message: {
                      type: "string",
                      example: "User not found with this email.",
                    },
                  },
                },
              },
            },
          },
        },
      },
      500: {
        description: "Failed to send OTP or internal server error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: {
                      type: "string",
                      enum: ["EMAIL_SEND_FAILED", "SERVER_ERROR"],
                      example: "EMAIL_SEND_FAILED",
                    },
                    message: {
                      type: "string",
                      example:
                        "Failed to send OTP email. Please try again later.",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  registry.registerPath({
    path: `${authPath}/logout`,
    method: "post",
    summary: "Logout user",
    tags: ["Auth"],
    description: `Logs out a user by invalidating their refresh token.`,
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: logoutSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Logout successful",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Logout successful",
                    },
                  },
                },
              },
            },
          },
        },
      },
      400: {
        description: "Invalid or missing refresh token",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: {
                      type: "string",
                      enum: ["INVALID_INPUT", "INVALID_TOKEN"],
                      example: "INVALID_INPUT",
                    },
                    message: {
                      type: "string",
                      example: "Refresh token is required.",
                    },
                  },
                },
              },
            },
          },
        },
      },
      401: {
        description: "Expired or unauthorized token",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "TOKEN_EXPIRED" },
                    message: {
                      type: "string",
                      example:
                        "Refresh token has expired. Please log in again.",
                    },
                  },
                },
              },
            },
          },
        },
      },
      404: {
        description: "Refresh token not found in store",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "TOKEN_NOT_FOUND" },
                    message: {
                      type: "string",
                      example:
                        "Refresh token does not exist or already deleted.",
                    },
                  },
                },
              },
            },
          },
        },
      },
      500: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "SERVER_ERROR" },
                    message: {
                      type: "string",
                      example: "Something went wrong.",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  registry.registerPath({
    path: `${authPath}/forgot-password`,
    method: "post",
    summary: "Request password reset OTP",
    tags: ["Auth"],
    description: `Sends a password reset OTP to the user's email if the account exists and is active.`,
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: forgotPasswordSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description:
          "Password reset OTP sent successfully (or silently ignored if user not found)",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: {
                  type: "object",
                  properties: {
                    email: { type: "string", example: "john@example.com" },
                    expiresInMinutes: { type: "number", example: 10 },
                  },
                },
              },
            },
          },
        },
      },
      500: {
        description: "Failed to send OTP or internal server error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: {
                      type: "string",
                      enum: ["EMAIL_SEND_FAILED", "SERVER_ERROR"],
                      example: "EMAIL_SEND_FAILED",
                    },
                    message: {
                      type: "string",
                      example:
                        "Failed to send OTP email. Please try again later.",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  registry.registerPath({
    path: `${authPath}/reset-password`,
    method: "post",
    summary: "Reset user password using OTP",
    tags: ["Auth"],
    description: `Verifies the password reset OTP and updates the user's password if valid.`,
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: resetPasswordSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Password reset successful",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: {
                  type: "object",
                  properties: {
                    email: { type: "string", example: "john@example.com" },
                    message: {
                      type: "string",
                      example: "Password reset successful",
                    },
                    resetAt: {
                      type: "string",
                      format: "date-time",
                      example: "2025-10-29T20:40:00.000Z",
                    },
                  },
                },
              },
            },
          },
        },
      },
      400: {
        description: "Invalid or expired OTP, or account not active",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: {
                      type: "string",
                      enum: [
                        "ACCOUNT_NOT_ACTIVE",
                        "OTP_NOT_FOUND",
                        "OTP_ALREADY_USED",
                        "OTP_EXPIRED",
                        "OTP_MAX_ATTEMPTS",
                        "INVALID_OTP",
                      ],
                      example: "INVALID_OTP",
                    },
                    message: {
                      type: "string",
                      example: "Invalid OTP code. Please check and try again.",
                    },
                  },
                },
              },
            },
          },
        },
      },
      404: {
        description: "User not found with this email",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "USER_NOT_FOUND" },
                    message: {
                      type: "string",
                      example: "User not found with this email.",
                    },
                  },
                },
              },
            },
          },
        },
      },
      500: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "SERVER_ERROR" },
                    message: {
                      type: "string",
                      example: "Something went wrong.",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  registry.registerPath({
    path: `${authPath}/refresh-token`,
    method: "post",
    summary: "Refresh authentication tokens",
    tags: ["Auth"],
    description: `Generates a new access token and refresh token pair using a valid refresh token.`,
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: refreshTokenSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Tokens refreshed successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: {
                  type: "object",
                  properties: {
                    accessToken: {
                      type: "string",
                      example: "new-access-token-jwt",
                    },
                    refreshToken: {
                      type: "string",
                      example: "new-refresh-token-jwt",
                    },
                  },
                },
              },
            },
          },
        },
      },
      400: {
        description: "Invalid or expired refresh token",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: {
                      type: "string",
                      example: "INVALID_TOKEN",
                    },
                    message: {
                      type: "string",
                      example: "Refresh token is invalid or expired.",
                    },
                  },
                },
              },
            },
          },
        },
      },
      403: {
        description: "Account is inactive",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "ACCOUNT_INACTIVE" },
                    message: {
                      type: "string",
                      example: "User account is not active.",
                    },
                  },
                },
              },
            },
          },
        },
      },
      404: {
        description: "User not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "USER_NOT_FOUND" },
                    message: {
                      type: "string",
                      example: "User not found for the provided refresh token.",
                    },
                  },
                },
              },
            },
          },
        },
      },
      500: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "REFRESH_FAILED" },
                    message: {
                      type: "string",
                      example:
                        "An unexpected error occurred during token refresh.",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  registry.registerPath({
    path: `${authPath}/me`,
    method: "get",
    summary: "Get current authenticated user profile",
    tags: ["Auth"],
    description:
      "Returns the profile information of the currently authenticated user. Requires a valid Bearer access token.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Successfully retrieved the authenticated user's profile",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      format: "uuid",
                      example: "9f54dbb2-16ef-4b2e-b8a8-837a3dcbba21",
                    },
                    username: {
                      type: "string",
                      example: "sarat",
                    },
                    email: {
                      type: "string",
                      format: "email",
                      example: "sarat@example.com",
                    },
                    accountStatus: {
                      type: "string",
                      enum: ["PENDING", "ACTIVE", "SUSPENDED"],
                      example: "ACTIVE",
                    },
                    tenant: {
                      type: "object",
                      description:
                        "The tenant (store) associated with the user",
                      properties: {
                        id: {
                          type: "string",
                          format: "uuid",
                          example: "ccf0f6a1-89a4-4b65-a17a-22d4a4f0a1c7",
                        },
                        name: {
                          type: "string",
                          example: "My Electronics Store",
                        },
                      },
                    },
                    roles: {
                      type: "array",
                      description: "List of roles assigned to the user",
                      items: {
                        type: "object",
                        properties: {
                          id: {
                            type: "string",
                            format: "uuid",
                            example: "e1b10f57-6f6d-4c62-b3f4-9e44e9cb3a1f",
                          },
                          role: {
                            type: "string",
                            example: "ADMIN",
                          },
                        },
                      },
                    },
                    createdAt: {
                      type: "string",
                      format: "date-time",
                      example: "2025-10-30T10:00:00Z",
                    },
                  },
                },
              },
            },
          },
        },
      },
      401: {
        description: "Missing or invalid access token",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "AUTH_HEADER_MISSING" },
                    message: {
                      type: "string",
                      example: "Missing or invalid Authorization header",
                    },
                  },
                },
              },
            },
          },
        },
      },
      403: {
        description: "Access denied or insufficient permissions",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "FORBIDDEN_ROLE" },
                    message: {
                      type: "string",
                      example: "Access denied: insufficient permissions",
                    },
                  },
                },
              },
            },
          },
        },
      },
      404: {
        description: "User not found or inactive",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "USER_NOT_FOUND" },
                    message: {
                      type: "string",
                      example: "User not found or inactive.",
                    },
                  },
                },
              },
            },
          },
        },
      },
      500: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "PROFILE_FETCH_FAILED" },
                    message: {
                      type: "string",
                      example:
                        "An unexpected error occurred while fetching user profile.",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
};
