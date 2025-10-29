import argon2 from "argon2";
import { MoreThan, IsNull } from "typeorm";
import { AppDataSource } from "../configs/database";
import { User } from "../entities/User";
import { UserRole } from "../entities/UserRole";
import { OtpCode } from "../entities/OtpCode";
import { Store } from "../entities/Store";
import { AccountStatus, OtpPurpose, Role } from "../constants";
import type {
  LoginRequest,
  RegisterRequest,
} from "../api/v1/requests/auth.request";
import { CustomError } from "../utils/custom-error";
import { generateOtpCode, calculateOtpExpiry } from "../utils/otp-generator";
import { hashOtp, verifyOtp } from "../utils/otp-hasher";
import logger from "../configs/logger";
import { EmailService } from "./email.service";
import { env } from "../configs/envConfig";
import { TokenGenerator } from "../utils/jwt";
import { storeRefreshToken } from "../utils/redisToken";

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private userRoleRepository = AppDataSource.getRepository(UserRole);
  private otpRepository = AppDataSource.getRepository(OtpCode);
  private storeRepository = AppDataSource.getRepository(Store);
  private emailService = new EmailService();
  private tokenGenerator = new TokenGenerator();

  async register(data: RegisterRequest): Promise<{
    userId: string;
    username: string;
    email: string;
    role: Role;
    isVerified: boolean;
    createdAt: string;
    store?: {
      storeId: string;
      storeName: string;
      createdAt: string;
    };
  }> {
    const { username, email, password, createStore, storeName } = data;

    const existingEmail = await this.userRepository.findOneBy({ email });
    if (existingEmail) {
      throw new CustomError("Email already registered", 409, "EMAIL_EXISTS");
    }
    // ! transaction
    const passwordHash = await argon2.hash(password);

    const user = this.userRepository.create({
      username,
      email,
      passwordHash,
      accountStatus: AccountStatus.PENDING,
    });

    const savedUser = await this.userRepository.save(user);

    const role = createStore === "yes" ? Role.ADMIN : Role.CUSTOMER;
    // ! cascade insert
    await this.userRoleRepository.save({
      userId: savedUser.id,
      role,
    });

    const otpCode = await this.generateOtp(
      savedUser.id,
      OtpPurpose.EMAIL_VERIFICATION,
      env.OTP_EXPIRY_MINUTES
    );

    try {
      await this.emailService.sendOtp(email, otpCode);
      logger.info(`OTP email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send email to ${email}:`, error);
    }

    let storeInfo;
    if (createStore === "yes") {
      try {
        let finalStoreName: string;

        if (storeName !== undefined && storeName.trim() !== "") {
          const existingStore = await this.storeRepository.findOneBy({
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
          finalStoreName = await this.generateUniqueStoreName(username);
        }

        const store = await this.createStoreForAdmin(
          savedUser.id,
          finalStoreName
        );

        storeInfo = {
          storeId: store.id,
          storeName: store.name,
          createdAt: store.createdAt.toISOString(),
        };

        logger.info(`Store ${store.name} created for admin ${username}`);
      } catch (error) {
        logger.error(`Failed to create store for admin ${username}:`, error);
        throw error;
      }
    }
    // ! return user
    return {
      userId: savedUser.id,
      username: savedUser.username,
      email: savedUser.email,
      role,
      isVerified: false,
      createdAt: savedUser.createdAt.toISOString(),
      ...(storeInfo && { store: storeInfo }),
    };
  }

  private async createStoreForAdmin(
    userId: string,
    storeName: string
  ): Promise<Store> {
    const store = this.storeRepository.create({
      ownerId: userId,
      name: storeName,
      description: "Default store description. Update your store details.",
      createdBy: userId,
    });

    return await this.storeRepository.save(store);
  }

  private async generateUniqueStoreName(username: string): Promise<string> {
    let storeName = username;

    const exists = await this.storeRepository.findOneBy({ name: storeName });

    if (!exists) {
      return storeName;
    }

    let isUnique = false;

    while (!isUnique) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      storeName = `${username}_${randomSuffix}`;

      const storeExists = await this.storeRepository.findOneBy({
        name: storeName,
      });

      if (!storeExists) {
        isUnique = true;
      }
    }

    return storeName;
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

  async resendOtp(email: string): Promise<{
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

    if (user.emailVerified !== null) {
      throw new CustomError(
        "Email is already verified",
        400,
        "EMAIL_ALREADY_VERIFIED"
      );
    }

    if (user.accountStatus !== AccountStatus.PENDING) {
      throw new CustomError(
        "Account is not in pending status",
        400,
        "INVALID_ACCOUNT_STATUS"
      );
    }

    const now = new Date();
    await this.otpRepository.update(
      {
        userId: user.id,
        purpose: OtpPurpose.EMAIL_VERIFICATION,
        verifiedAt: IsNull(),
        expiresAt: MoreThan(now),
      },
      {
        expiresAt: now,
      }
    );

    const otpCode = await this.generateOtp(
      user.id,
      OtpPurpose.EMAIL_VERIFICATION,
      env.OTP_EXPIRY_MINUTES
    );

    try {
      await this.emailService.sendOtp(email, otpCode);
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
      env.OTP_EXPIRY_MINUTES
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
    expiryMinutes: number = env.OTP_EXPIRY_MINUTES
  ): Promise<string> {
    const plainOtpCode = generateOtpCode();
    const expiresAt = calculateOtpExpiry(expiryMinutes);
    const hashedOtp = await hashOtp(plainOtpCode);

    const otp = this.otpRepository.create({
      userId,
      otpCode: hashedOtp,
      purpose,
      expiresAt,
      attemptCount: 0,
    });

    await this.otpRepository.save(otp);
    return plainOtpCode;
  }

  async login(data: LoginRequest): Promise<{
    data: {
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
    if (roles.includes(Role.ADMIN)) {
      userRole = Role.ADMIN;
    } else {
      userRole = Role.CUSTOMER;
    }

    const { accessToken, refreshToken, refreshJti, refreshTtlSeconds } =
      this.tokenGenerator.generateAuthTokens(user.id, userRole);

    await storeRefreshToken(refreshJti, user.id, refreshTtlSeconds);

    logger.info(`User ${user.email} logged in successfully`);

    return {
      data: {
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
}
