import { AuthService } from "../../src/services/auth.service";
import { CustomError } from "../../src/utils/custom-error";
import { Role, AccountStatus } from "../../src/constants";
import type { UserProfileResponse } from "../../src/api/v1/responses/auth.response";

interface MockUserRole {
  role: Role;
  id: string;
}

interface MockStore {
  id: string;
  name: string;
}

interface MockUser {
  id: string;
  username: string;
  email: string;
  accountStatus: AccountStatus;
  createdAt: Date;
  userRoles: MockUserRole[];
  store: MockStore | null;
}

interface MockUserRepository {
  findOne: jest.Mock<Promise<MockUser | null>, [object]>;
}

interface MockedDependencies {
  userRepository: MockUserRepository;
}

describe("AuthService - getProfile", () => {
  let authService: AuthService;
  let mockedService: MockedDependencies;
  let mockUser: MockUser;

  beforeEach(() => {
    authService = new AuthService();
    mockedService = authService as unknown as MockedDependencies;

    mockUser = {
      id: "user-id-123",
      username: "testuser",
      email: "test@example.com",
      accountStatus: AccountStatus.ACTIVE,
      createdAt: new Date("2025-10-30T10:00:00Z"),
      userRoles: [{ role: Role.CUSTOMER, id: "role-id-1" }],
      store: { id: "store-id-1", name: "My Store" },
    };

    mockedService.userRepository = {
      findOne: jest.fn().mockResolvedValue(mockUser),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully return the user profile", async () => {
    const result: UserProfileResponse =
      await authService.getProfile("user-id-123");

    expect(result).toEqual({
      userId: mockUser.id,
      username: mockUser.username,
      email: mockUser.email,
      roles: [Role.CUSTOMER],
      store: {
        storeId: mockUser.store?.id ?? null,
        name: mockUser.store?.name ?? null,
      },
      isVerified: true,
      createdAt: mockUser.createdAt.toISOString(),
    });
  });

  it("should return null store fields if store is missing", async () => {
    mockUser.store = null;
    mockedService.userRepository.findOne.mockResolvedValue(mockUser);

    const result: UserProfileResponse =
      await authService.getProfile("user-id-123");

    expect(result.store).toEqual({
      storeId: null,
      name: null,
    });
  });

  it("should throw USER_NOT_FOUND if the user does not exist", async () => {
    mockedService.userRepository.findOne.mockResolvedValue(null);

    await expect(authService.getProfile("nonexistent-id")).rejects.toThrow(
      new CustomError("User not found", 404, "USER_NOT_FOUND")
    );
  });

  it("should assign ADMIN role if user has ADMIN role", async () => {
    mockUser.userRoles = [{ role: Role.ADMIN, id: "role-id-2" }];
    mockedService.userRepository.findOne.mockResolvedValue(mockUser);

    const result: UserProfileResponse =
      await authService.getProfile("user-id-123");

    expect(result.roles).toEqual([Role.ADMIN]);
  });

  it("should assign CUSTOMER role if user does not have ADMIN role", async () => {
    mockUser.userRoles = [{ role: Role.CUSTOMER, id: "role-id-1" }];
    mockedService.userRepository.findOne.mockResolvedValue(mockUser);

    const result: UserProfileResponse =
      await authService.getProfile("user-id-123");

    expect(result.roles).toEqual([Role.CUSTOMER]);
  });

  it("should mark isVerified as false if accountStatus is not ACTIVE", async () => {
    mockUser.accountStatus = AccountStatus.PENDING;
    mockedService.userRepository.findOne.mockResolvedValue(mockUser);

    const result: UserProfileResponse =
      await authService.getProfile("user-id-123");

    expect(result.isVerified).toBe(false);
  });
});
