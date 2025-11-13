import type { EntityManager } from "typeorm";
import argon2 from "argon2";
import { MoreThan, IsNull } from "typeorm";
import { AppDataSource } from "../configs/database";
import { User } from "../entities/User";
import { UserRole } from "../entities/UserRole";
import { OtpCode } from "../entities/OtpCode";
import { Store } from "../entities/Store";
import { AccountStatus, OtpPurpose, Role } from "../constants";
import { generateUniqueStoreName } from "../utils/store";
import type {
  LoginRequest,
  RegisterRequest,
} from "../api/v1/requests/auth.request";
import { CustomError } from "../utils/custom-error";
import { generateOtpCode, calculateOtpExpiry } from "../utils/otp";
import { verifyOtp } from "../utils/otp";
import logger from "../configs/logger";
import { EmailService } from "./email.service";
import { env } from "../configs/envConfig";
import { deleteRefreshToken, storeRefreshToken } from "../utils/redisToken";
import { TokenGenerator } from "../utils/jwt";
import type { UserProfileResponse } from "../api/v1/responses/auth.response";
import { StoreHelper } from "./helper/auth.helper";

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private userRoleRepository = AppDataSource.getRepository(UserRole);
  private otpRepository = AppDataSource.getRepository(OtpCode);
  private storeRepository = AppDataSource.getRepository(Store);
  private emailService = new EmailService();
  private tokenGenerator = new TokenGenerator();
  private storeHelper = StoreHelper;

  async register(data: RegisterRequest): Promise<{ user: User; role: Role }> {
    const { username, email, password, createStore, storeName } = data;

    const existingEmail = await this.userRepository.findOneBy({ email });
    if (existingEmail) {
      throw new CustomError("Email already registered", 409, "EMAIL_EXISTS");
    }

    const role = createStore === "yes" ? Role.ADMIN : Role.CUSTOMER;

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = this.userRepository.create({
        username,
        email,
        passwordHash: password,
        accountStatus: AccountStatus.PENDING,
      });

      if (createStore === "yes") {
        await this.handleStoreCreation(
          user,
          storeName,
          username,
          queryRunner.manager
        );
      }

      const savedUser = await queryRunner.manager.save(User, user);

      await queryRunner.manager.save(UserRole, {
        userId: savedUser.id,
        role,
      });

      const otpCode = await this.generateOtp(
        savedUser.id,
        OtpPurpose.EMAIL_VERIFICATION,
        queryRunner.manager
      );

      await queryRunner.commitTransaction();

      await this.emailService.sendOtp(email, otpCode);

      const userWithRelations = await this.userRepository.findOne({
        where: { id: savedUser.id },
        relations: ["store"],
      });

      return { user: userWithRelations!, role };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error("Transaction failed, rolling back:", error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async verifyOtp(
    email: string,
    otpCode: string
  ): Promise<{
    userId: string;
    email: string;
    isVerified: boolean;
    verifiedAt: string;
  }> {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new CustomError("User not found", 404, "USER_NOT_FOUND");
    }

    const otp = await this.otpRepository.findOne({
      where: {
        userId: user.id,
        purpose: OtpPurpose.EMAIL_VERIFICATION, // ! remove purpose
      },
      order: {
        createdAt: "DESC",
      },
    });

    if (!otp) {
      throw new CustomError(
        "No OTP found. Please request a new one.",
        400,
        "OTP_NOT_FOUND"
      );
    }

    if (otp.verifiedAt !== null) {
      throw new CustomError(
        "OTP code has already been used",
        400,
        "OTP_ALREADY_USED"
      );
    }

    const now = new Date();
    if (otp.expiresAt < now) {
      throw new CustomError("OTP code has expired", 400, "OTP_EXPIRED");
    }

    const maxAttempts = env.OTP_MAX_ATTEMPTS;
    if (otp.attemptCount >= maxAttempts) {
      throw new CustomError(
        "Maximum OTP verification attempts exceeded",
        400,
        "OTP_MAX_ATTEMPTS"
      );
    }

    const isValid = await verifyOtp(otpCode, otp.otpCode);

    if (!isValid) {
      otp.attemptCount += 1;
      await this.otpRepository.save(otp);

      throw new CustomError("Invalid OTP code", 400, "INVALID_OTP");
    }

    otp.verifiedAt = now;
    otp.attemptCount += 1;
    await this.otpRepository.save(otp);

    user.emailVerified = now;
    user.accountStatus = AccountStatus.ACTIVE;
    await this.userRepository.save(user);

    return {
      userId: user.id,
      email: user.email,
      isVerified: true,
      verifiedAt: user.emailVerified.toISOString(),
    };
  }

  async resendOtp(
    email: string,
    purpose: OtpPurpose
  ): Promise<{
    email: string;
    expiresInMinutes: number;
  }> {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new CustomError(
        "User not found with this email",
        404,
        "USER_NOT_FOUND"
      );
    }

    if (
      purpose === OtpPurpose.EMAIL_VERIFICATION &&
      user.emailVerified !== null
    ) {
      throw new CustomError("Email is already verified", 400);
    }

    const now = new Date();
    await this.otpRepository.update(
      {
        userId: user.id,
        purpose: purpose,
        verifiedAt: IsNull(),
        expiresAt: MoreThan(now),
      },
      {
        expiresAt: now,
      }
    );

    // const otpCode = await this.generateOtp(
    //   user.id,
    //   purpose,
    //   env.OTP_EXPIRY_MINUTES
    // );

    try {
      // await this.emailService.sendOtp(email, otpCode);
      logger.info(`OTP resent successfully to ${email}`);
    } catch (error) {
      logger.error(`Failed to send OTP email to ${email}:`, error);
      throw new CustomError(
        "Failed to send OTP email. Please try again later.",
        500,
        "EMAIL_SEND_FAILED"
      );
    }

    return {
      email: user.email,
      expiresInMinutes: env.OTP_EXPIRY_MINUTES,
    };
  }

  async forgotPassword(email: string): Promise<{
    email: string;
    expiresInMinutes: number;
  }> {
    const user = await this.userRepository.findOneBy({ email });

    if (!user || user.accountStatus !== AccountStatus.ACTIVE) {
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return {
        email: email,
        expiresInMinutes: env.OTP_EXPIRY_MINUTES,
      };
    }

    const now = new Date();
    await this.otpRepository.update(
      {
        userId: user.id,
        purpose: OtpPurpose.PASSWORD_RESET,
        verifiedAt: IsNull(),
        expiresAt: MoreThan(now),
      },
      {
        expiresAt: now,
      }
    );

    const otpCode = await this.generateOtp(
      user.id,
      OtpPurpose.PASSWORD_RESET,
      // env.OTP_EXPIRY_MINUTES
    );

    try {
      await this.emailService.sendOtp(email, otpCode);
      logger.info(`Password reset OTP sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send password reset OTP to ${email}:`, error);
      throw new CustomError(
        "Failed to send OTP email. Please try again later.",
        500,
        "EMAIL_SEND_FAILED"
      );
    }

    return {
      email: user.email,
      expiresInMinutes: env.OTP_EXPIRY_MINUTES,
    };
  }

  async resetPassword(
    email: string,
    otpCode: string,
    newPassword: string
  ): Promise<{
    email: string;
    message: string;
    resetAt: string;
  }> {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new CustomError(
        "User not found with this email",
        404,
        "USER_NOT_FOUND"
      );
    }

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new CustomError(
        "Account is not active. Please verify your email first.",
        400,
        "ACCOUNT_NOT_ACTIVE"
      );
    }

    const otp = await this.otpRepository.findOne({
      where: {
        userId: user.id,
        purpose: OtpPurpose.PASSWORD_RESET,
      },
      order: {
        createdAt: "DESC",
      },
    });

    if (!otp) {
      throw new CustomError(
        "No password reset OTP found. Please request a new one.",
        400,
        "OTP_NOT_FOUND"
      );
    }

    if (otp.verifiedAt !== null) {
      throw new CustomError(
        "This OTP has already been used. Please request a new one.",
        400,
        "OTP_ALREADY_USED"
      );
    }

    const now = new Date();
    if (otp.expiresAt < now) {
      throw new CustomError(
        "The password reset link is expired. Please request a new one.",
        400,
        "OTP_EXPIRED"
      );
    }

    const maxAttempts = env.OTP_MAX_ATTEMPTS;
    if (otp.attemptCount >= maxAttempts) {
      throw new CustomError(
        "Maximum OTP verification attempts exceeded. Please request a new one.",
        400,
        "OTP_MAX_ATTEMPTS"
      );
    }

    const isValid = await verifyOtp(otpCode, otp.otpCode);

    if (!isValid) {
      otp.attemptCount += 1;
      await this.otpRepository.save(otp);

      throw new CustomError(
        "Invalid OTP code. Please check and try again.",
        400,
        "INVALID_OTP"
      );
    }

    const passwordHash = await argon2.hash(newPassword);

    user.passwordHash = passwordHash;
    await this.userRepository.save(user);

    otp.verifiedAt = now;
    otp.attemptCount += 1;
    await this.otpRepository.save(otp);

    logger.info(`Password reset successful for user: ${email}`);

    return {
      email: user.email,
      message: "Password reset successful",
      resetAt: now.toISOString(),
    };
  }

  async generateOtp(
    userId: string,
    purpose: OtpPurpose,
    manager?: EntityManager
  ): Promise<string> {
    const plainOtpCode = generateOtpCode();
    const expiresAt = calculateOtpExpiry(OtpCode.EXPIRY_MINUTES);

    const otp = this.otpRepository.create({
      userId,
      otpCode: plainOtpCode,
      purpose,
      expiresAt,
      attemptCount: 0,
    });

    if (manager) {
      await manager.save(OtpCode, otp);
    } else {
      await this.otpRepository.save(otp);
    }

    return plainOtpCode;
  }

  private async handleStoreCreation(
    user: User,
    storeName: string | undefined,
    username: string,
    manager: EntityManager
  ): Promise<void> {
    let finalStoreName: string;

    if (storeName !== undefined && storeName.trim() !== "") {
      const existingStore = await manager.findOneBy(Store, {
        name: storeName,
      });

      if (existingStore) {
        throw new CustomError(
          "Store name already exists. Please choose a different name.",
          409,
          "STORE_NAME_EXISTS"
        );
      }

      finalStoreName = storeName;
    } else {
      finalStoreName = await generateUniqueStoreName(
        username,
        this.storeRepository
      );
    }

    const store = this.storeRepository.create({
      name: finalStoreName,
      description: "Default store description. Update your store details.",
    });

    store.owner = user;
    user.store = store;

    logger.info(
      `Store ${finalStoreName} will be created for admin ${username}`
    );
  }


  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) {
      logger.warn("Logout failed: no refresh token provided");
      throw new CustomError("Refresh token is required", 400, "INVALID_INPUT");
    }

    const decoded = await this.tokenGenerator.verifyRefreshToken(refreshToken);
    await deleteRefreshToken(decoded.jti);
  }

  async login(data: LoginRequest): Promise<{
    user: {
      userId: string;
      username: string;
      email: string;
      role: Role | null;
      isVerified: boolean;
      createdAt: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  }> {
    const user = await this.userRepository.findOne({
      where: { email: data.email },
      relations: ["userRoles"],
    });

    if (!user) {
      throw new CustomError("Invalid email or password", 401, "AUTH_FAILED");
    }

    const passwordValid = await this.verifyPassword(user.id, data.password);
    if (!passwordValid) {
      throw new CustomError("Invalid email or password", 401, "AUTH_FAILED");
    }

    if (user.emailVerified === null) {
      throw new CustomError("Email not verified", 403, "EMAIL_NOT_VERIFIED");
    }

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new CustomError("Account is not active", 403, "ACCOUNT_INACTIVE");
    }

    const roles = user.userRoles.map((role) => role.role);
    let userRole: Role;
    let storeId: string | null = null;
    if (roles.includes(Role.ADMIN)) {
      userRole = Role.ADMIN;
      storeId = await this.storeHelper.getStoreIdByUserId(user.id);
    } else {
      userRole = Role.CUSTOMER;
    }

    const { accessToken, refreshToken, refreshJti, refreshTtlSeconds } =
      this.tokenGenerator.generateAuthTokens(user.id, userRole, storeId);

    await storeRefreshToken(refreshJti, user.id, refreshTtlSeconds);

    logger.info(`User ${user.email} logged in successfully`);

    return {
      user: {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: userRole,
        isVerified: user.accountStatus === AccountStatus.ACTIVE,
        createdAt: user.createdAt.toISOString(),
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new CustomError("User not found", 404, "USER_NOT_FOUND");
    }

    return await argon2.verify(user.passwordHash, password);
  }

  async refreshToken(token: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const decoded = await this.tokenGenerator.verifyRefreshToken(token);

      const user = await this.userRepository.findOne({
        where: { id: decoded.userId },
        relations: ["userRoles"],
      });

      if (!user) {
        await deleteRefreshToken(decoded.jti);
        throw new CustomError("User not found", 404, "USER_NOT_FOUND");
      }

      if (user.accountStatus !== AccountStatus.ACTIVE) {
        await deleteRefreshToken(decoded.jti);
        throw new CustomError("Account is not active", 403, "ACCOUNT_INACTIVE");
      }

      const roles = user.userRoles.map((role) => role.role);
      let userRole: Role;
      let storeId: string | null = null;
      if (roles.includes(Role.ADMIN)) {
        userRole = Role.ADMIN;
        storeId = await this.storeHelper.getStoreIdByUserId(user.id);
      } else {
        userRole = Role.CUSTOMER;
      }

      const { accessToken, refreshToken, refreshJti, refreshTtlSeconds } =
        this.tokenGenerator.generateAuthTokens(user.id, userRole, storeId);

      await storeRefreshToken(refreshJti, user.id, refreshTtlSeconds);

      logger.info(`Tokens successfully refreshed for user ID: ${user.id}`);
      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      logger.error("Error during token refresh:", error);
      throw new CustomError(
        "An unexpected error occurred during token refresh.",
        500,
        "REFRESH_FAILED"
      );
    }
  }

  async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["store", "userRoles"],
    });

    if (!user) {
      throw new CustomError("User not found", 404, "USER_NOT_FOUND");
    }

    const roles = user.userRoles.map((r) => r.role);
    const storeId = user.store ? user.store.id : null;
    const storeName = user.store ? user.store.name : null;

    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      roles: roles,
      store: {
        storeId,
        name: storeName,
      },
      isVerified: user.accountStatus === AccountStatus.ACTIVE,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
