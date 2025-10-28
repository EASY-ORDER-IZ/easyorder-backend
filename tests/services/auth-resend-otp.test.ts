// import { DataSource } from "typeorm";
// import dotenv from "dotenv";
// import path from "path";
// import { User } from "../../src/entities/User";
// import { Store } from "../../src/entities/Store";
// import { UserRole } from "../../src/entities/UserRole";
// import { OtpCode } from "../../src/entities/OtpCode";
// import { TestFixtures } from "../fixtures/entities.fixture";
// import { AuthService } from "../../src/services/auth.service";
// import logger from "../../src/configs/logger";
// import { AccountStatus } from "../../src/constants";

// dotenv.config({
//   path: path.resolve(process.cwd(), ".env.test"),
//   override: true,
// });

// jest.mock("../../src/configs/database", () => ({
//   AppDataSource: {
//     getRepository: jest.fn(),
//   },
// }));

// describe("AuthService - Resend OTP", () => {
//   let dataSource: DataSource;
//   let fixtures: TestFixtures;
//   let authService: AuthService;

//   beforeAll(async () => {
//     dataSource = new DataSource({
//       type: "postgres",
//       host: process.env.DB_HOST ?? "localhost",
//       port: Number(process.env.DB_PORT) || 5433,
//       username: process.env.POSTGRES_USER,
//       password: process.env.POSTGRES_PASSWORD,
//       database: process.env.POSTGRES_DB,
//       entities: [User, Store, UserRole, OtpCode],
//       synchronize: true,
//       dropSchema: true,
//       logging: false,
//     });

//     await dataSource.initialize();
//     fixtures = new TestFixtures(dataSource);

//     const { AppDataSource } = require("../../src/configs/database");
//     AppDataSource.getRepository = dataSource.getRepository.bind(dataSource);

//     authService = new AuthService();
//   });

//   afterAll(async () => {
//     if (dataSource?.isInitialized) {
//       await dataSource.destroy();
//     }
//   });

//   beforeEach(async () => {
//     await dataSource
//       .getRepository(OtpCode)
//       .createQueryBuilder()
//       .delete()
//       .execute();
//     await dataSource
//       .getRepository(Store)
//       .createQueryBuilder()
//       .delete()
//       .execute();
//     await dataSource
//       .getRepository(UserRole)
//       .createQueryBuilder()
//       .delete()
//       .execute();
//     await dataSource
//       .getRepository(User)
//       .createQueryBuilder()
//       .delete()
//       .execute();
//   });

//   it("should throw USER_NOT_FOUND for non-existent email", async () => {
//     await expect(
//       authService.resendOtp("nonexistent@gmail.com")
//     ).rejects.toThrow();
//   });

//   it("should throw EMAIL_ALREADY_VERIFIED for verified user", async () => {
//     const user = await fixtures.createUser({
//       username: "verifieduser",
//       email: "verified@example.com",
//       emailVerified: new Date(),
//     });

//     logger.info("user created:", { user });

//     await expect(
//       authService.resendOtp("verified@example.com")
//     ).rejects.toThrow();
//   });

//   it("should successfully resend OTP for unverified user", async () => {
//     const user = await fixtures.createUser({
//       username: "pendinguser",
//       email: "pending@example.com",
//       accountStatus: AccountStatus.PENDING,
//       emailVerified: undefined,
//     });

//     logger.info("user created:", { user });

//     const result = await authService.resendOtp("pending@example.com");

//     expect(result).toBeDefined();
//     expect(result.email).toBe("pending@example.com");
//   });

//   it("should expire old OTP when resending", async () => {
//     const user = await fixtures.createUser({
//       username: "resenduser",
//       email: "resend@example.com",
//       accountStatus: AccountStatus.PENDING,
//     });

//     const futureDate = new Date(Date.now() + 10 * 60 * 1000);
//     const oldOtp = await fixtures.createOtp(user.id, {
//       expiresAt: futureDate,
//     });

//     await authService.resendOtp("resend@example.com");

//     const otpRepository = dataSource.getRepository(OtpCode);
//     const expiredOtp = await otpRepository.findOne({
//       where: { id: oldOtp.id },
//     });

//     expect(expiredOtp).toBeDefined();
//     expect(expiredOtp!.expiresAt.getTime()).toBeLessThanOrEqual(Date.now());
//   });

//   it("should expire multiple old OTPs when resending", async () => {
//     const user = await fixtures.createUser({
//       username: "multiuser",
//       email: "multi@example.com",
//       accountStatus: AccountStatus.PENDING,
//     });

//     const futureDate = new Date(Date.now() + 10 * 60 * 1000);
//     const oldOtp1 = await fixtures.createOtp(user.id, {
//       expiresAt: futureDate,
//     });
//     const oldOtp2 = await fixtures.createOtp(user.id, {
//       expiresAt: futureDate,
//     });
//     const oldOtp3 = await fixtures.createOtp(user.id, {
//       expiresAt: futureDate,
//     });

//     logger.info("old OTPs created:", { oldOtp1, oldOtp2, oldOtp3 });

//     await authService.resendOtp("multi@example.com");

//     const otpRepository = dataSource.getRepository(OtpCode);
//     const allOtps = await otpRepository.find({
//       where: { userId: user.id },
//     });

//     const expiredOtps = allOtps.filter(
//       (otp) => otp.expiresAt.getTime() <= Date.now()
//     );

//     expect(expiredOtps.length).toBe(3);
//     expect(allOtps.length).toBe(4);
//   });
// });
