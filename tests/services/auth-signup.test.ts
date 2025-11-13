import { DataSource } from "typeorm";
import dotenv from "dotenv";
import path from "path";
import { AuthService } from "../../src/services/auth.service";
import { User } from "../../src/entities/User";
import { UserRole } from "../../src/entities/UserRole";
import { Store } from "../../src/entities/Store";
import { OtpCode } from "../../src/entities/OtpCode";
import { AccountStatus, Role } from "../../src/constants";
import * as databaseConfig from "../../src/configs/database";
import { AuthFixtures } from "../fixtures/auth.fixture";

dotenv.config({
  path: path.resolve(process.cwd(), ".env.test"),
  override: true,
});

jest.mock("../../src/services/email.service", () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendOtp: jest.fn().mockResolvedValue(true),
  })),
}));

describe("AuthService - Registration (Integration)", () => {
  let dataSource: DataSource;
  let authService: AuthService;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: "postgres",
      host: process.env.DB_HOST ?? "localhost",
      port: Number(process.env.DB_PORT) || 5433,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [User, Store, UserRole, OtpCode],
      synchronize: true,
      dropSchema: true,
      logging: false,
    });

    await dataSource.initialize();

    jest
      .spyOn(databaseConfig.AppDataSource, "getRepository")
      .mockImplementation((entity) => dataSource.getRepository(entity));

    jest
      .spyOn(databaseConfig.AppDataSource, "createQueryRunner")
      .mockImplementation(() => dataSource.createQueryRunner());

    authService = new AuthService();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    await dataSource
      .getRepository(OtpCode)
      .createQueryBuilder()
      .delete()
      .execute();

    await dataSource
      .getRepository(Store)
      .createQueryBuilder()
      .delete()
      .execute();

    await dataSource
      .getRepository(UserRole)
      .createQueryBuilder()
      .delete()
      .execute();

    await dataSource
      .getRepository(User)
      .createQueryBuilder()
      .delete()
      .execute();
  });

  it("should successfully register a customer without a store", async () => {
    const registerData = AuthFixtures.generateCustomerData();

    const result = await authService.register(registerData);

    expect(result.user.username).toBe(registerData.username);
    expect(result.user.email).toBe(registerData.email);
    expect(result.role).toBe(Role.CUSTOMER);
    expect(result.user.accountStatus).toBe(AccountStatus.PENDING);
    expect(result.user.store).toBeNull();

    const userInDb = await dataSource.getRepository(User).findOne({
      where: { email: registerData.email },
    });
    expect(userInDb).toBeDefined();
    expect(userInDb?.username).toBe(registerData.username);

    const userRoleInDb = await dataSource.getRepository(UserRole).findOne({
      where: { userId: result.user.id },
    });
    expect(userRoleInDb).toBeDefined();
    expect(userRoleInDb?.role).toBe(Role.CUSTOMER);

    const otpInDb = await dataSource.getRepository(OtpCode).findOne({
      where: { userId: result.user.id },
    });
    expect(otpInDb).toBeDefined();
  });

  it("should successfully register an admin with a store", async () => {
    const registerData = AuthFixtures.generateAdminData({
      storeName: "My Awesome Store",
    });

    const result = await authService.register(registerData);

    expect(result.user.username).toBe(registerData.username);
    expect(result.user.email).toBe(registerData.email);
    expect(result.role).toBe(Role.ADMIN);
    expect(result.user.store).toBeDefined();
    expect(result.user.store?.name).toBe("My Awesome Store");

    const userRoleInDb = await dataSource.getRepository(UserRole).findOne({
      where: { userId: result.user.id },
    });
    expect(userRoleInDb?.role).toBe(Role.ADMIN);

    const storeInDb = await dataSource.getRepository(Store).findOne({
      where: { ownerId: result.user.id },
    });
    expect(storeInDb).toBeDefined();
    expect(storeInDb?.name).toBe("My Awesome Store");
  });

  it("should throw error when registering with duplicate verified email", async () => {
    const firstUserData = AuthFixtures.generateCustomerData({
      email: "duplicate@example.com",
    });

    const firstResult = await authService.register(firstUserData);

    await dataSource
      .getRepository(User)
      .update({ id: firstResult.user.id }, { emailVerified: new Date() });

    const secondUserData = AuthFixtures.generateCustomerData({
      email: "duplicate@example.com",
    });

    await expect(authService.register(secondUserData)).rejects.toThrow(
      "Email already registered"
    );
  });

  it("should throw error when creating store with duplicate name", async () => {
    const firstAdminData = AuthFixtures.generateAdminData({
      storeName: "UniqueStoreName",
    });
    await authService.register(firstAdminData);

    const secondAdminData = AuthFixtures.generateAdminData({
      storeName: "UniqueStoreName",
    });

    await expect(authService.register(secondAdminData)).rejects.toThrow(
      "Store name already exists"
    );
  });

  it("should auto-generate store name when admin doesn't provide one", async () => {
    const registerData = AuthFixtures.generateAdminData({
      username: "testadmin",
      storeName: undefined,
    });

    const result = await authService.register(registerData);

    expect(result.role).toBe(Role.ADMIN);
    expect(result.user.store).toBeDefined();
  });

  it("should create OTP for email verification", async () => {
    const registerData = AuthFixtures.generateCustomerData();

    const result = await authService.register(registerData);

    const otpInDb = await dataSource.getRepository(OtpCode).findOne({
      where: { userId: result.user.id },
    });

    expect(otpInDb).toBeDefined();
    expect(otpInDb?.purpose).toBe("email_verification");
    expect(otpInDb?.expiresAt).toBeDefined();
  });

  it("should rollback user creation when store name already exists", async () => {
    const firstAdminData = AuthFixtures.generateAdminData({
      storeName: "ExistingStore",
    });
    await authService.register(firstAdminData);

    const secondAdminData = AuthFixtures.generateAdminData({
      storeName: "ExistingStore",
    });

    await expect(authService.register(secondAdminData)).rejects.toThrow();

    const userInDb = await dataSource.getRepository(User).findOne({
      where: { email: secondAdminData.email },
    });
    expect(userInDb).toBeNull();
  });
});
