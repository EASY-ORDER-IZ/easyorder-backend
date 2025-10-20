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
import { hashOtp } from "../utils/otp-hasher";
import logger from "../configs/logger";
import { EmailService } from "./email.service";

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private userRoleRepository = AppDataSource.getRepository(UserRole);
  private otpRepository = AppDataSource.getRepository(OtpCode);
  private emailService = new EmailService();

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

    try {
      await this.emailService.sendOtp(email, otpCode);
      logger.info(`OTP email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send email to ${email}:`, error);
    }

    return {
      userId: savedUser.id,
      username: savedUser.username,
      email: savedUser.email,
      role,
      isVerified: false,
      createdAt: savedUser.createdAt.toISOString(),
    };
  }

  async generateOtp(
    userId: string,
    purpose: OtpPurpose,
    expiryMinutes: number = 15
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
}
