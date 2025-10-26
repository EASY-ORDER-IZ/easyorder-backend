import { AuthController } from "../../src/api/v1/controllers/auth.controller";
import { AuthService } from "../../src/services/auth.service";
import { CustomError } from "../../src/utils/custom-error";

describe("AuthController - login", () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = {
      validatedBody: {
        email: "test@example.com",
        password: "password123",
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    (AuthController as any).authService = {
      login: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 200 and login data on success", async () => {
    const mockLoginResult = {
      data: {
        userId: "user-id-123",
        username: "testuser",
        email: "test@example.com",
        role: "CUSTOMER",
        isVerified: true,
        createdAt: new Date().toISOString(),
      },
      tokens: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
      },
    };

    (AuthController as any).authService.login.mockResolvedValue(mockLoginResult);

    await AuthController.login(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: mockLoginResult,
    });
  });

  it("should return the CustomError status and message if login fails with a known error", async () => {
    const error = new CustomError("Invalid credentials", 401, "AUTH_FAILED");
    (AuthController as any).authService.login.mockRejectedValue(error);

    await AuthController.login(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        code: "AUTH_FAILED",
        message: "Invalid credentials",
      },
    });
  });

  it("should return 500 for unexpected errors", async () => {
    const error = new Error("Something went wrong");
    (AuthController as any).authService.login.mockRejectedValue(error);

    await AuthController.login(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
      },
    });
  });
});
