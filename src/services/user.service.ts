import { AppDataSource } from "../configs/database";
import { User } from "../entities/User";
import { UserRole } from "../entities/UserRole";
import { Store } from "../entities/Store";
import { Role } from "../constants";
import { CustomError } from "../utils/custom-error";
import logger from "../configs/logger";
import { TokenGenerator } from "../utils/jwt";
import { storeRefreshToken } from "../utils/redisToken";

export class UserService {
  private userRepository = AppDataSource.getRepository(User);
  private userRoleRepository = AppDataSource.getRepository(UserRole);
  private storeRepository = AppDataSource.getRepository(Store);
  private tokenGenerator = new TokenGenerator();

  async createStore(
    userId: string,
    storeName: string
  ): Promise<{
    store: Store;
    user: User;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["userRoles", "store"],
    });

    if (!user) {
      throw new CustomError("User not found", 404, "USER_NOT_FOUND");
    }

    if (user.store) {
      throw new CustomError(
        "User already has a store",
        400,
        "STORE_ALREADY_EXISTS"
      );
    }

    const hasAdminRole = user.userRoles.some((ur) => ur.role === Role.ADMIN);
    if (hasAdminRole) {
      throw new CustomError("User is already an admin", 400, "ALREADY_ADMIN");
    }

    const existingStore = await this.storeRepository.findOne({
      where: { name: storeName },
    });

    if (existingStore) {
      throw new CustomError(
        "Store name already exists",
        409,
        "STORE_NAME_EXISTS"
      );
    }

    const store = this.storeRepository.create({
      ownerId: userId,
      name: storeName,
      description: "Default store description",
      createdBy: userId,
      updatedBy: userId,
    });

    const savedStore = await this.storeRepository.save(store);

    const adminRole = this.userRoleRepository.create({
      userId: userId,
      role: Role.ADMIN,
    });

    await this.userRoleRepository.save(adminRole);

    logger.info(`Store "${storeName}" created for user ${userId}`);
    logger.info(`User ${userId} promoted to ADMIN`);

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["userRoles", "store"],
    });

    const tokens = this.tokenGenerator.generateAuthTokens(
      updatedUser!.id,
      Role.ADMIN,
      savedStore.id
    );

    await storeRefreshToken(
      tokens.refreshJti,
      userId,
      tokens.refreshTtlSeconds
    );

    logger.info(`New tokens generated for user ${userId} with ADMIN role`);

    return {
      store: savedStore,
      user: updatedUser!,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }
}
