import type { Request } from "express";
export interface FileMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface GeneratePresignedUrlRequest {
  files: FileMetadata[];
}

export interface GeneratePresignedUrlRequestType extends Request {
  body: GeneratePresignedUrlRequest;
}
