import { z } from "zod";

const ALLOWED_FILE_TYPES = ["image/jpg", "image/png"];

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const fileMetadataSchema = z.object({
  fileName: z
    .string()
    .min(1, "File name is required")
    .max(255, "File name must not exceed 255 characters")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "File name can only contain letters, numbers, dots, hyphens, and underscores"
    ),

  fileType: z
    .string()
    .refine(
      (type) => ALLOWED_FILE_TYPES.includes(type),
      "Only JPG and PNG images are allowed"
    ),

  fileSize: z
    .number()
    .positive("File size must be greater than 0")
    .max(MAX_FILE_SIZE, "File size must not exceed 2MB"),
});

export const generatePresignedUrlSchema = z
  .object({
    files: z.array(fileMetadataSchema).min(1, "At least one file is required"),
  })
  .openapi("GeneratePresignedUrlRequest");

export type GeneratePresignedUrlRequest = z.infer<
  typeof generatePresignedUrlSchema
>;

export { ALLOWED_FILE_TYPES, MAX_FILE_SIZE };
