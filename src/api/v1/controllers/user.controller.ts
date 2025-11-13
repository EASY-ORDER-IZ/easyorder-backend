import type { Response, NextFunction } from "express";
import type { CreateStoreRequestType } from "../requests/user.request";
import type { CreateStoreSuccessResponse } from "../responses/user.response";
import { UserService } from "../../../services/user.service";
import { CustomError } from "../../../utils/custom-error";
import logger from "../../../configs/logger";
import type { UserRole } from "../../../entities/UserRole";

export class UserController {
  private static userService = new UserService();

  static async createStore(
    req: CreateStoreRequestType,
    res: Response<CreateStoreSuccessResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { storeName } = req.body;

      const user = req.user;

      if (!user) {
        throw new CustomError(
          "User not authenticated",
          401,
          "USER_NOT_AUTHENTICATED"
        );
      }

      const result = await UserController.userService.createStore(
        user.userId,
        storeName
      );

      logger.info(`Store created successfully by user ${user.userId}`);

      res.status(201).json({
        data: {
          store: {
            id: result.store.id,
            name: result.store.name,
            description: result.store.description,
            createdAt: result.store.createdAt,
          },
          user: {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email,
            roles: result.user.userRoles.map((ur: UserRole) => ur.role),
          },
          tokens: {
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
