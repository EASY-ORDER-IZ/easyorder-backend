import type { Response, NextFunction } from "express";
import type { GeneratePresignedUrlRequestType } from "../requests/file.request";
import type { GeneratePresignedUrlSuccessResponse } from "../responses/file.response";
import { FileService } from "../../../services/file.service";
import logger from "../../../configs/logger";
import { CustomError } from "../../../utils/custom-error";

export class FileController {
  private static fileService = new FileService();

  static async generatePresignedUrl(
    req: GeneratePresignedUrlRequestType,
    res: Response<GeneratePresignedUrlSuccessResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { files } = req.body;

      const user = req.user;

      if (!user) {
        throw new CustomError(
          "User not authenticated",
          401,
          "USER_NOT_AUTHENTICATED"
        );
      }

      const uploadUrls =
        await FileController.fileService.generatePresignedUrls(files);

      logger.info(
        `Generated ${uploadUrls.length} presigned URLs for user ${user.userId}`
      );

      res.status(200).json({
        data: {
          uploadUrls,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
