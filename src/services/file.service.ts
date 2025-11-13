import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { env } from "../configs/envConfig";
import type { FileMetadata } from "../api/v1/requests/file.request";
import type { PresignedUrlData } from "../api/v1/responses/file.response";
import { CustomError } from "../utils/custom-error";
import logger from "../configs/logger";

export class FileService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.region = env.AWS_REGION;
    this.bucketName = env.AWS_S3_BUCKET_NAME;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async generatePresignedUrls(
    files: FileMetadata[]
  ): Promise<PresignedUrlData[]> {
    logger.debug(`Generating presigned URLs for ${files.length} files`);

    const uploadUrls: PresignedUrlData[] = [];

    for (const file of files) {
      try {
        const generatedFileName = `${uuidv4()}-${file.fileName}`;
        const s3Key = `${generatedFileName}`;

        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
          ContentType: file.fileType,
        });

        const uploadUrl = await getSignedUrl(this.s3Client, command, {
          expiresIn: 300,
        });

        const fileUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;

        uploadUrls.push({
          originalFileName: file.fileName,
          generatedFileName: generatedFileName,
          uploadUrl: uploadUrl,
          fileUrl: fileUrl,
        });

        logger.debug(`Generated presigned URL for file: ${file.fileName}`);
      } catch (error) {
        logger.error(
          `Failed to generate presigned URL for file: ${file.fileName}`,
          error
        );
        throw new CustomError(
          `Failed to generate presigned URL for file: ${file.fileName}`,
          500,
          "PRESIGNED_URL_GENERATION_FAILED"
        );
      }
    }

    return uploadUrls;
  }
}
