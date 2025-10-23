import argon2 from "argon2";
import { AppDataSource } from "../configs/database";
import { User } from "../entities/User";
import { UserRole } from "../entities/UserRole";
import { OtpCode } from "../entities/OtpCode";
import { Store } from "../entities/Store";
import { AccountStatus, OtpPurpose, Role } from "../constants";
import type { RegisterRequest } from "../api/v1/schemas/auth.schema";
import { CustomError } from "../utils/custom-error";
import { generateOtpCode, calculateOtpExpiry } from "../utils/otp-generator";
import { hashOtp } from "../utils/otp-hasher";
import logger from "../configs/logger";
import { EmailService } from "./email.service";
import { env } from "../configs/envConfig";

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private userRoleRepository = AppDataSource.getRepository(UserRole);
  private otpRepository = AppDataSource.getRepository(OtpCode);
  private storeRepository = AppDataSource.getRepository(Store);
  private emailService = new EmailService();

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

    const passwordHash = await argon2.hash(password);

    const user = this.userRepository.create({
      username,
      email,
      passwordHash,
      accountStatus: AccountStatus.PENDING,
    });

    const savedUser = await this.userRepository.save(user);

    const role = createStore === "yes" ? Role.ADMIN : Role.CUSTOMER;

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
}
