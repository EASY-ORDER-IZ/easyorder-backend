import argon2 from "argon2";
import { AppDataSource } from "../configs/database";
import { User } from "../entities/User";
import { UserRole } from "../entities/UserRole";
import { OtpCode } from "../entities/OtpCode";
import { AccountStatus, OtpPurpose } from "../constants";
import type { RegisterRequest } from "../api/v1/requests/auth.request";
import { CustomError } from "../utils/custom-error";
import type { Role } from "../constants";
import { generateOtpCode, calculateOtpExpiry } from "../utils/otp-generator";
import logger from "../configs/logger";

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private userRoleRepository = AppDataSource.getRepository(UserRole);
  private otpRepository = AppDataSource.getRepository(OtpCode);

  async register(data: RegisterRequest): Promise<{
    userId: string;
    username: string;
    email: string;
    role: Role;
    isVerified: boolean;
    createdAt: string;
  }> {
    const { username, email, password, role } = data;

    const existingEmail = await this.userRepository.findOneBy({ email });
    if (existingEmail) {
      throw new CustomError("Email already registered", 409, "EMAIL_EXISTS");
    }

    const passwordHash = await argon2.hash(password);

    const user = this.userRepository.create({
      username,
      email,
      passwordHash,
      accountStatus: AccountStatus.PENDING,
    });

    const savedUser = await this.userRepository.save(user);

    await this.userRoleRepository.save({
      userId: savedUser.id,
      role,
    });

    const otpCode = await this.generateOtp(
      savedUser.id,
      OtpPurpose.EMAIL_VERIFICATION,
      15
    );

    logger.info(`[OTP Generated] User: ${email}, OTP: ${otpCode}`);

    return {
      userId: savedUser.id,
      username: savedUser.username,
      email: savedUser.email,
      role,
      isVerified: false,
      createdAt: savedUser.createdAt.toISOString(),
    };
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
    logger.info(`[OTP Verification Attempt] User: ${email}, OTP: ${otpCode}`);
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new CustomError("User not found", 404, "USER_NOT_FOUND");
    }

    const otp = await this.otpRepository.findOne({
      where: {
        userId: user.id,
        purpose: OtpPurpose.EMAIL_VERIFICATION,
      },
      order: {
        createdAt: "DESC",
      },
    });

    if (!otp) {
      throw new CustomError("Invalid OTP code", 400, "INVALID_OTP");
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

    const maxAttempts = 5;
    if (otp.attemptCount >= maxAttempts) {
      throw new CustomError(
        "Maximum OTP verification attempts exceeded",
        400,
        "OTP_MAX_ATTEMPTS"
      );
    }

    otp.attemptCount += 1;
    await this.otpRepository.save(otp);

    otp.verifiedAt = now;
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

  async generateOtp(
    userId: string,
    purpose: OtpPurpose,
    expiryMinutes: number = 15
  ): Promise<string> {
    const otpCode = generateOtpCode();
    const expiresAt = calculateOtpExpiry(expiryMinutes);

    const otp = this.otpRepository.create({
      userId,
      otpCode,
      purpose,
      expiresAt,
      attemptCount: 0,
    });

    await this.otpRepository.save(otp);

    return otpCode;
  }
}
