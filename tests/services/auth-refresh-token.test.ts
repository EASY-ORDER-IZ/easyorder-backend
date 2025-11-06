import { AuthService } from "../../src/services/auth.service";
import { CustomError } from "../../src/utils/custom-error";
import { Role, AccountStatus } from "../../src/constants";
import {
  getRefreshToken,
  storeRefreshToken,
  deleteRefreshToken,
} from "../../src/utils/redisToken";
import type { mockUser } from "../../src/api/v1/types/auth";

jest.mock("../../src/utils/redisToken", () => ({
  getRefreshToken: jest.fn(),
  storeRefreshToken: jest.fn(),
  deleteRefreshToken: jest.fn(),
}));

interface MockUserRepository {
  findOne: jest.Mock;
}

interface MockTokenGenerator {
  generateAuthTokens: jest.Mock;
  verifyRefreshToken: jest.Mock;
}

interface MockedDependencies {
  userRepository: MockUserRepository;
  tokenGenerator: MockTokenGenerator;
}

describe("AuthService - refreshToken", () => {
  let authService: AuthService;
  let mockedService: MockedDependencies;
  let mockUser: mockUser;

  const REFRESH_JTI = "refresh-jti";

  beforeEach(() => {
    authService = new AuthService();
    mockedService = authService as unknown as MockedDependencies;

    mockUser = {
      id: "user-id-123",
      username: "testuser",
      email: "test@example.com",
      passwordHash: "hashedpassword",
      emailVerified: new Date(),
      accountStatus: AccountStatus.ACTIVE,
      createdAt: new Date(),
      userRoles: [{ role: Role.CUSTOMER }],
    };

    mockedService.userRepository = {
      findOne: jest.fn().mockResolvedValue(mockUser),
    };

    mockedService.tokenGenerator = {
      generateAuthTokens: jest.fn().mockReturnValue({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        refreshJti: REFRESH_JTI,
        refreshTtlSeconds: 3600,
      }),
      verifyRefreshToken: jest.fn().mockResolvedValue({
        userId: mockUser.id,
        role: Role.CUSTOMER,
        jti: REFRESH_JTI,
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should refresh tokens successfully for a valid refresh token", async () => {
    (getRefreshToken as jest.Mock).mockResolvedValue(mockUser.id);

    const result = await authService.refreshToken("valid-refresh-token");

    expect(
      mockedService.tokenGenerator.verifyRefreshToken
    ).toHaveBeenCalledWith("valid-refresh-token");
    expect(mockedService.userRepository.findOne).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      relations: ["userRoles"],
    });

    expect(storeRefreshToken).toHaveBeenCalledWith(
      REFRESH_JTI,
      mockUser.id,
      3600
    );

    expect(result).toEqual({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    });
  });

  it("should throw USER_NOT_FOUND if user does not exist", async () => {
    (getRefreshToken as jest.Mock).mockResolvedValue(mockUser.id);
    mockedService.userRepository.findOne.mockResolvedValue(null);

    await expect(
      authService.refreshToken("valid-refresh-token")
    ).rejects.toThrow(CustomError);
    expect(deleteRefreshToken).toHaveBeenCalledWith(REFRESH_JTI);
  });

  it("should throw ACCOUNT_INACTIVE if user account is not active", async () => {
    (getRefreshToken as jest.Mock).mockResolvedValue(mockUser.id);
    mockUser.accountStatus = AccountStatus.PENDING;

    await expect(
      authService.refreshToken("valid-refresh-token")
    ).rejects.toThrow(CustomError);
    expect(deleteRefreshToken).toHaveBeenCalledWith(REFRESH_JTI);
  });

  it("should throw INVALID_TOKEN if refresh token is expired or invalid in Redis", async () => {
    const expectedError = new CustomError(
      "Refresh token expired or invalid",
      401,
      "INVALID_TOKEN"
    );

    mockedService.tokenGenerator.verifyRefreshToken.mockRejectedValue(
      expectedError
    );

    await expect(
      authService.refreshToken("some-refresh-token")
    ).rejects.toThrow(CustomError);

    await expect(
      authService.refreshToken("some-refresh-token")
    ).rejects.toThrow("Refresh token expired or invalid");

    expect(mockedService.userRepository.findOne).not.toHaveBeenCalled();
    expect(
      mockedService.tokenGenerator.generateAuthTokens
    ).not.toHaveBeenCalled();
  });

  it("should throw REFRESH_FAILED on unexpected errors", async () => {
    (
      mockedService.tokenGenerator.verifyRefreshToken as jest.Mock
    ).mockImplementation(() => {
      throw new Error("Unexpected error");
    });

    await expect(authService.refreshToken("any-token")).rejects.toThrow(
      CustomError
    );
  });
});
