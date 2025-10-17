import type { Request, Response } from "express";
import type { RegisterRequest } from "../requests/auth.request";
import type {
  RegisterResponse,
  ErrorResponse,
} from "../responses/auth.response";
import { AuthService } from "../../../services/auth.service";
import { CustomError } from "../../../utils/custom-error";

export class AuthController {
  private static authService = new AuthService();

  static async register(
    req: Request<{}, {}, RegisterRequest>,
    res: Response<RegisterResponse | ErrorResponse>
  ): Promise<void> {
    try {
      const userData = req.body;

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
