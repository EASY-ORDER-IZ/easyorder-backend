import type { Response } from "express";
import { AuthService } from "../../../services/auth.service";
import { CustomError } from "../../../utils/custom-error";
import { toRegisterResponseDto } from "../responses/auth.response";
import type { RegisterRequestType } from "../types";

export class AuthController {
  private static authService = new AuthService();

  static async register(
    req: RegisterRequestType,
    res: Response
  ): Promise<void> {
    try {
      const userData = req.body;

      const { user, role } =
        await AuthController.authService.register(userData);

      const responseData = toRegisterResponseDto(user, role);

      res.status(201).json({
        data: responseData,
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
