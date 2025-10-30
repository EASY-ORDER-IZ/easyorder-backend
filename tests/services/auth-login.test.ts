import argon2 from "argon2";
import { AuthService } from "../../src/services/auth.service";
import { CustomError } from "../../src/utils/custom-error";
import { Role, AccountStatus } from "../../src/constants";
import { storeRefreshToken } from "../../src/utils/redisToken";
import type { mockUser } from "../../src/api/v1/types/auth";

jest.mock("../../src/utils/redisToken", () => ({
  storeRefreshToken: jest.fn(),
}));

jest.mock("argon2", () => ({
  verify: jest.fn(),
}));

interface MockUserRepository {
  findOne: jest.Mock;
  findOneBy: jest.Mock;
}

interface MockTokenGenerator {
  generateAuthTokens: jest.Mock;
}

interface MockedDependencies {
  userRepository: MockUserRepository;
  tokenGenerator: MockTokenGenerator;
}

describe("AuthService - login", () => {
  let authService: AuthService;
  let mockedService: MockedDependencies;
  let mockUser: mockUser;

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
      findOneBy: jest.fn().mockResolvedValue(mockUser),
    };

    mockedService.tokenGenerator = {
      generateAuthTokens: jest.fn().mockReturnValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        refreshJti: "refresh-jti",
        refreshTtlSeconds: 3600,
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully login a valid user", async () => {
    (argon2.verify as jest.Mock).mockResolvedValue(true);

    const result = await authService.login({
      email: mockUser.email,
      password: "password123",
    });

    expect(result).toHaveProperty("user");
    expect(result.user.userId).toBe(mockUser.id);
    expect(result.user.email).toBe(mockUser.email);
    expect(result.user.role).toBe(Role.CUSTOMER);
    expect(result.user.isVerified).toBe(true);

    expect(result).toHaveProperty("tokens");
    expect(result.tokens.accessToken).toBe("access-token");
    expect(result.tokens.refreshToken).toBe("refresh-token");

    expect(storeRefreshToken).toHaveBeenCalledWith(
      "refresh-jti",
      mockUser.id,
      3600
    );
  });

  it("should throw AUTH_FAILED if user not found", async () => {
    mockedService.userRepository.findOne.mockResolvedValue(null);

    await expect(
      authService.login({ email: "wrong@example.com", password: "pass" })
    ).rejects.toThrow(CustomError);
  });

  it("should throw AUTH_FAILED if password is incorrect", async () => {
    (argon2.verify as jest.Mock).mockResolvedValue(false);

    await expect(
      authService.login({ email: "test@example.com", password: "wrongpass" })
    ).rejects.toThrow(CustomError);
  });

  it("should throw EMAIL_NOT_VERIFIED if emailVerified is null", async () => {
    mockUser.emailVerified = null;

    await expect(
      authService.login({ email: "test@example.com", password: "password123" })
    ).rejects.toThrow(CustomError);
  });

  it("should throw ACCOUNT_INACTIVE if accountStatus is not ACTIVE", async () => {
    mockUser.accountStatus = AccountStatus.PENDING;

    await expect(
      authService.login({ email: "test@example.com", password: "password123" })
    ).rejects.toThrow(CustomError);
  });

  it("should assign ADMIN role if user has ADMIN role", async () => {
    mockUser.userRoles = [{ role: Role.ADMIN }];

    (argon2.verify as jest.Mock).mockResolvedValue(true);

    const result = await authService.login({
      email: mockUser.email,
      password: "password123",
    });

    expect(result.user.role).toBe(Role.ADMIN);
  });

  it("should assign CUSTOMER role if user does not have ADMIN role", async () => {
    mockUser.userRoles = [{ role: Role.CUSTOMER }];

    (argon2.verify as jest.Mock).mockResolvedValue(true);

    const result = await authService.login({
      email: mockUser.email,
      password: "password123",
    });

    expect(result.user.role).toBe(Role.CUSTOMER);
  });
});
