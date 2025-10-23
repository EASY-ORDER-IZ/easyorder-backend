import type { Response } from "express";
import type { RegisterRequest , LoginRequest } from "../requests/auth.request";
import type {
  RegisterResponse,
  ErrorResponse,
} from "../responses/auth.response";
import { AuthService } from "../../../services/auth.service";
import { CustomError } from "../../../utils/custom-error";
import type { ValidatedRequest } from "../../middlewares/schemaValidator";
import logger from "../../../configs/logger";

export class AuthController {
  private static authService = new AuthService();

  static async register(
    req: ValidatedRequest,
    res: Response<RegisterResponse | ErrorResponse>
  ): Promise<void> {
    try {
      const userData = req.validatedBody as RegisterRequest;

      const user = await AuthController.authService.register(userData);

      res.status(201).json({
        data: user,
      });
    } catch (error) {
      if (error instanceof CustomError) {
        res.status(error.statusCode).json({
          error: {
            code: error.code ?? "ERROR",
            message: error.message,
          },
        });
        return;
      }

      res.status(500).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
        },
      });
    }
  }

  static async login(req: ValidatedRequest, res: Response): Promise<void> {
    const { username, password } = req.validatedBody as LoginRequest;
    logger.info(`login attempt for user: ${username}`);

    try {
      const loginResult = await AuthController.authService.login(
        // what is passed
        { username, password }
      );

      res.status(200).json({
        data: loginResult,
      });
    } catch (error) {
      if (error instanceof CustomError) {
        res.status(error.statusCode).json({
          error: {
            code: error.code ?? "ERROR",
            message: error.message,
          },
        });
        return;
      }

      res.status(500).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
        },
      });
    }
  }
}
