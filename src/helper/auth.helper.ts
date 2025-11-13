import { AppDataSource } from "../configs/database";
import { User } from "../entities/User";
import type { LoginRequest } from "../api/v1/schemas/auth.schema";
import { CustomError } from "../utils/custom-error";
import { PasswordUtil } from "../utils/password.utils";
import { AccountStatus, Role } from "../constants";
import logger from "../configs/logger";

export class AuthHelper {
  private userRepository = AppDataSource.getRepository(User);

  private async validateUserBase(
    criteria: { email?: string; id?: string },
    checkPassword?: string
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: criteria,
      relations: ["userRoles"],
    });

    if (!user) {
      logger.warn(`User validation failed: user not found`);
      throw new CustomError("Invalid credentials", 401, "AUTH_FAILED");
    }

    if (checkPassword !== undefined) {
      const valid = await PasswordUtil.verify(user.passwordHash, checkPassword);
      if (!valid) {
        logger.warn(
          `User validation failed: wrong password for ${criteria.email}`
        );
        throw new CustomError("Invalid email or password", 401, "AUTH_FAILED");
      }
    }

    if (user.emailVerified === null) {
      logger.warn(
        `User validation failed: email not verified for ${user.email}`
      );
      throw new CustomError("Email not verified", 403, "EMAIL_NOT_VERIFIED");
    }

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      logger.warn(`User validation failed: inactive account for ${user.email}`);
      throw new CustomError("Account is not active", 403, "ACCOUNT_INACTIVE");
    }

    return user;
  }

  async getValidUser(data: LoginRequest): Promise<User> {
    return this.validateUserBase({ email: data.email }, data.password);
  }

  async isUserValid(decoded: {
    userId: string;
    role: Role;
    jti: string;
    exp: number;
  }): Promise<User> {
    const user = await this.validateUserBase({ id: decoded.userId });
    return user;
  }

  async getUserRole(user: User): Promise<Role> {
    const roles = user.userRoles.map((role) => role.role);
    let userRole: Role;
    if (roles.includes(Role.ADMIN)) {
      userRole = Role.ADMIN;
    } else {
      userRole = Role.CUSTOMER;
    }
    return userRole;
  }
}
