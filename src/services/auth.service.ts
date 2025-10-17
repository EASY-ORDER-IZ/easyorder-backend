import argon2 from "argon2";
import { AppDataSource } from "../configs/database";
import { User } from "../entities/User";
import { UserRole } from "../entities/UserRole";
import { AccountStatus } from "../constants";
import type { RegisterRequest } from "../api/v1/requests/auth.request";
import { CustomError } from "../utils/custom-error";
import type { Role } from "../constants";

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private userRoleRepository = AppDataSource.getRepository(UserRole);

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
      accountStatus: AccountStatus.ACTIVE,
    });

    const savedUser = await this.userRepository.save(user);

    await this.userRoleRepository.save({
      userId: savedUser.id,
      role,
    });

    return {
      userId: savedUser.id,
      username: savedUser.username,
      email: savedUser.email,
      role,
      isVerified: false,
      createdAt: savedUser.createdAt.toISOString(),
    };
  }
}
