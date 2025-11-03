import argon2 from "argon2";
import { AuthService } from "../../src/services/auth.service";
import { CustomError } from "../../src/utils/custom-error";
import { Role, AccountStatus } from "../../src/constants";
import { storeRefreshToken } from "../../src/utils/redisToken";
import { StoreHelper } from "../../src/services/helper/auth.helper";
import type { User } from "../../src/entities/User";
import type { UserRole } from "../../src/entities/UserRole";

jest.mock("../../src/utils/redisToken", () => ({
  storeRefreshToken: jest.fn(),
}));

jest.mock("argon2", () => ({
  verify: jest.fn(),
}));

jest.mock("../../src/services/helper/auth.helper", () => ({
  StoreHelper: {
    getStoreIdByUserId: jest.fn().mockResolvedValue("mock-store-id"),
  },
}));

interface MockUserRepository {
  findOne: jest.MockedFunction<
    (
      options: Parameters<AuthService["userRepository"]["findOne"]>[0]
    ) => Promise<User | null>
  >;
  findOneBy: jest.MockedFunction<
    (
      options: Parameters<AuthService["userRepository"]["findOneBy"]>[0]
    ) => Promise<User | null>
  >;
}

interface MockTokenGenerator {
  generateAuthTokens: jest.MockedFunction<
    (
      userId: string,
      role: Role,
      storeId?: string | null
    ) => {
      accessToken: string;
      refreshToken: string;
      refreshJti: string;
      refreshTtlSeconds: number;
    }
  >;
}

describe("AuthService - login", () => {
  let authService: AuthService;
  let userRepository: MockUserRepository;
  let tokenGenerator: MockTokenGenerator;
  let mockUser: User & { userRoles: UserRole[] };

  beforeEach(() => {
    authService = new AuthService();

    userRepository = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
    };

    tokenGenerator = {
      generateAuthTokens: jest.fn().mockReturnValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        refreshJti: "refresh-jti",
        refreshTtlSeconds: 3600,
      }),
    };

    (
      authService as unknown as {
        userRepository: MockUserRepository;
        tokenGenerator: MockTokenGenerator;
      }
    ).userRepository = userRepository;

    (
      authService as unknown as {
        userRepository: MockUserRepository;
        tokenGenerator: MockTokenGenerator;
      }
    ).tokenGenerator = tokenGenerator;

    mockUser = {
      id: "user-id-123",
      username: "testuser",
      email: "test@example.com",
      passwordHash: "hashedpassword",
      emailVerified: new Date(),
      accountStatus: AccountStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,

      userRoles: [],
      otpCodes: [],
      store: undefined,
    };

    const customerRole: UserRole = {
      id: "role-id-123",
      userId: mockUser.id,
      role: Role.CUSTOMER,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
      user: mockUser,
    };

    mockUser.userRoles.push(customerRole);

    userRepository.findOne.mockResolvedValue(mockUser);
    userRepository.findOneBy.mockResolvedValue(mockUser);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully login a valid CUSTOMER user", async () => {
    (argon2.verify as jest.Mock).mockResolvedValue(true);

    const result = await authService.login({
      email: mockUser.email,
      password: "password123",
    });

    expect(result.user.role).toBe(Role.CUSTOMER);
    expect(result.user.isVerified).toBe(true);

    expect(storeRefreshToken).toHaveBeenCalledWith(
      "refresh-jti",
      mockUser.id,
      3600
    );
  });

  it("should assign ADMIN role and get storeId for ADMIN user", async () => {
    const adminRole: UserRole = {
      id: "role-id-456",
      userId: mockUser.id,
      role: Role.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
      user: mockUser,
    };

    mockUser.userRoles = [adminRole];

    (argon2.verify as jest.Mock).mockResolvedValue(true);

    const result = await authService.login({
      email: mockUser.email,
      password: "password123",
    });

    expect(result.user.role).toBe(Role.ADMIN);
    expect(StoreHelper.getStoreIdByUserId).toHaveBeenCalledWith(mockUser.id);
  });

  it("should throw AUTH_FAILED if user not found", async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(
      authService.login({ email: "wrong@example.com", password: "pass" })
    ).rejects.toThrow(CustomError);
  });

  it("should throw AUTH_FAILED if password is incorrect", async () => {
    (argon2.verify as jest.Mock).mockResolvedValue(false);

    await expect(
      authService.login({ email: mockUser.email, password: "wrongpass" })
    ).rejects.toThrow(CustomError);
  });

  it("should throw EMAIL_NOT_VERIFIED if emailVerified is null", async () => {
    mockUser.emailVerified = undefined;

    await expect(
      authService.login({ email: mockUser.email, password: "password123" })
    ).rejects.toThrow(CustomError);
  });

  it("should throw ACCOUNT_INACTIVE if accountStatus is not ACTIVE", async () => {
    mockUser.accountStatus = AccountStatus.PENDING;

    await expect(
      authService.login({ email: mockUser.email, password: "password123" })
    ).rejects.toThrow(CustomError);
  });
});
