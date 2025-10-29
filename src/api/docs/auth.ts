import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  loginResponseSchema,
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
};
