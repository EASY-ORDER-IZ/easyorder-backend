import { AuthService } from "../../src/services/auth.service";
import { CustomError } from "../../src/utils/custom-error";
import { deleteRefreshToken } from "../../src/utils/redisToken";

jest.mock("../../src/utils/redisToken", () => ({
  deleteRefreshToken: jest.fn(),
}));

jest.mock("../../src/configs/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("AuthService - logout", () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully logout", async () => {
    (deleteRefreshToken as jest.Mock).mockResolvedValue(undefined);

    await authService.logout("valid-refresh-token");

    expect(deleteRefreshToken).toHaveBeenCalledWith("valid-refresh-token");
  });

  it("should throw INVALID_INPUT and log warn if token missing", async () => {
    await expect(authService.logout("")).rejects.toThrow(CustomError);
  });

  it("should throw INVALID_REFRESH_TOKEN and log error if delete fails", async () => {
    (deleteRefreshToken as jest.Mock).mockImplementation(() => {
      throw new CustomError(
        "Invalid refresh token",
        401,
        "INVALID_REFRESH_TOKEN"
      );
    });

    await expect(authService.logout("invalid-token")).rejects.toThrow(
      CustomError
    );
  });
});
