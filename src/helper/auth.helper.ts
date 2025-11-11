import { AppDataSource } from "../configs/database";
import { User } from "../entities/User";
import { LoginRequest } from "../api/v1/schemas/auth.schema";
import { CustomError } from "../utils/custom-error";
import { PasswordUtil } from "../utils/password.utils";
import { AccountStatus, Role } from "../constants";
import logger from "../configs/logger";

export class AuthHelper {
  private userRepository = AppDataSource.getRepository(User);

  async getValidUser(data: LoginRequest): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email: data.email },
      relations: ["userRoles"],
    });

    if (!user) {
      logger.warn(
        `Login attempt failed: user not found for email ${data.email}`
      );

      throw new CustomError("Invalid email or password", 401, "AUTH_FAILED");
    }

    const passwordValid = PasswordUtil.verify(user.passwordHash, data.password);
    if (!passwordValid) {
      logger.warn(
        `Login attempt failed: invalid password for email ${data.email}`
      );

      throw new CustomError("Invalid email or password", 401, "AUTH_FAILED");
    }

    if (user.emailVerified === null) {
      logger.warn(
        `Login attempt failed: email not verified for email ${data.email}`
      );

      throw new CustomError("Email not verified", 403, "EMAIL_NOT_VERIFIED");
    }

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      logger.warn(
        `Login attempt failed: inactive account for email ${data.email}`
      );

      throw new CustomError("Account is not active", 403, "ACCOUNT_INACTIVE");
    }
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
