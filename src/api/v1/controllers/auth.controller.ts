import type { Request, Response, NextFunction } from "express";
import type { LoginRequest } from "../requests/auth.request";
import type {
  // RegisterRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "../schemas/auth.schema";
import type {
  // RegisterResponse,
  ErrorResponse,
  VerifyOtpResponse,
  ResendOtpResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
} from "../responses/auth.response";
import { AuthService } from "../../../services/auth.service";
import type { ValidatedRequest } from "../../middlewares/schemaValidator";
import logger from "../../../configs/logger";

export class AuthController {
  private static authService = new AuthService();

  static async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userData = req.body;

      const user = await AuthController.authService.register(userData);
      // ! error middleware handler
      res.status(201).json({
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(
    req: ValidatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const userData = req.validatedBody as LoginRequest;
    logger.info(`login attempt for user: ${userData.email}`);

    try {
      const loginResult = await AuthController.authService.login(userData);

      res.status(200).json({
        data: loginResult,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyOtp(
    req: ValidatedRequest,
    res: Response<VerifyOtpResponse | ErrorResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, otpCode } = req.validatedBody as VerifyOtpRequest;

      const result = await AuthController.authService.verifyOtp(email, otpCode);

      res.status(200).json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async resendOtp(
    req: ValidatedRequest,
    res: Response<ResendOtpResponse | ErrorResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.validatedBody as ResendOtpRequest;

      const result = await AuthController.authService.resendOtp(email);

      res.status(200).json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(
    req: ValidatedRequest,
    res: Response<ForgotPasswordResponse | ErrorResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.validatedBody as ForgotPasswordRequest;

      const result = await AuthController.authService.forgotPassword(email);

      res.status(200).json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(
    req: ValidatedRequest,
    res: Response<ResetPasswordResponse | ErrorResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, otpCode, newPassword } =
        req.validatedBody as ResetPasswordRequest;

      const result = await AuthController.authService.resetPassword(
        email,
        otpCode,
        newPassword
      );

      res.status(200).json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(
    req: ValidatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { refreshToken } = req.validatedBody as LogoutRequest;
    try {
      await AuthController.authService.logout(refreshToken);

      logger.info(`Refresh token successfully deleted: ${refreshToken}`);
      res.status(200).json({ data: { message: "Logout successful" } });
    } catch (error) {
      next(error);
    }
  }
}
