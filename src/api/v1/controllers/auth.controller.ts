import type { Request, Response, NextFunction } from "express";
import type { LoginRequest } from "../requests/auth.request";
import type {
  // RegisterRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RefreshTokenRequest,
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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const userData = req.body as LoginRequest;
    logger.info(`login attempt for user: ${userData.email}`);

    try {
      const loginResult = await AuthController.authService.login(userData);

      res.status(200).json({
        loginResult,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyOtp(
    req: Request,
    res: Response<VerifyOtpResponse | ErrorResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, otpCode } = req.body as VerifyOtpRequest;

      const result = await AuthController.authService.verifyOtp(email, otpCode);

      res.status(200).json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async resendOtp(
    req: Request,
    res: Response<ResendOtpResponse | ErrorResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body as ResendOtpRequest;

      const result = await AuthController.authService.resendOtp(email);

      res.status(200).json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(
    req: Request,
    res: Response<ForgotPasswordResponse | ErrorResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body as ForgotPasswordRequest;

      const result = await AuthController.authService.forgotPassword(email);

      res.status(200).json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(
    req: Request,
    res: Response<ResetPasswordResponse | ErrorResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, otpCode, newPassword } = req.body as ResetPasswordRequest;

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

  static async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { refreshToken } = req.body as RefreshTokenRequest;
      logger.info("Attempting to refresh token");

      const tokens =
        await AuthController.authService.refreshToken(refreshToken);

      res.status(200).json({
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { refreshToken } = req.body as LogoutRequest;
    const accessToken = req.headers.authorization?.split(" ")[1];

    try {
      await AuthController.authService.logout(refreshToken, accessToken);

      logger.info(
        `Refresh token deleted (prefix): ${refreshToken.slice(0, 10)}...`
      );
      res.status(200).json({ data: { message: "Logout successful" } });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;

      const userProfile = await AuthController.authService.getProfile(userId);

      res.status(200).json({
        data: userProfile,
      });
    } catch (error) {
      next(error);
    }
  }
}
