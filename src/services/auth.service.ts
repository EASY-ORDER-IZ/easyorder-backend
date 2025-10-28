import type { EntityManager } from "typeorm";
// import argon2 from "argon2";
import { AppDataSource } from "../configs/database";
import { User } from "../entities/User";
import { UserRole } from "../entities/UserRole";
import { OtpCode } from "../entities/OtpCode";
import { Store } from "../entities/Store";
import { AccountStatus, OtpPurpose, Role } from "../constants";
import type { RegisterRequest } from "../api/v1/types";
import { CustomError } from "../utils/custom-error";
import { generateOtpCode, calculateOtpExpiry, hashOtp } from "../utils/otp";
import logger from "../configs/logger";
import { EmailService } from "./email.service";
import { env } from "../configs/envConfig";
import { generateUniqueStoreName } from "../utils/store";

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private userRoleRepository = AppDataSource.getRepository(UserRole);
  private otpRepository = AppDataSource.getRepository(OtpCode);
  private storeRepository = AppDataSource.getRepository(Store);
  private emailService = new EmailService();

  async register(data: RegisterRequest): Promise<{ user: User; role: Role }> {
    const { username, email, password, createStore, storeName } = data;

    const existingEmail = await this.userRepository.findOneBy({ email });
    if (existingEmail) {
      throw new CustomError("Email already registered", 409, "EMAIL_EXISTS");
    }

    //const passwordHash = await argon2.hash(password);

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
        let finalStoreName: string;

        if (storeName !== undefined && storeName.trim() !== "") {
          const existingStore = await queryRunner.manager.findOneBy(Store, {
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

      const savedUser = await queryRunner.manager.save(User, user);

      await queryRunner.manager.save(UserRole, {
        userId: savedUser.id,
        role,
      });

      const otpCode = await this.generateOtp(
        savedUser.id,
        OtpPurpose.EMAIL_VERIFICATION,
        env.OTP_EXPIRY_MINUTES,
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

  async generateOtp(
    userId: string,
    purpose: OtpPurpose,
    expiryMinutes: number = env.OTP_EXPIRY_MINUTES,
    manager?: EntityManager
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

    if (manager) {
      await manager.save(OtpCode, otp);
    } else {
      await this.otpRepository.save(otp);
    }

    return plainOtpCode;
  }
}
