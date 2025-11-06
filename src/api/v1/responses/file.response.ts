export interface PresignedUrlData {
  originalFileName: string;
  generatedFileName: string;
  uploadUrl: string;
  fileUrl: string;
}

export interface GeneratePresignedUrlSuccessResponse {
  data: {
    uploadUrls: PresignedUrlData[];
  };
}

export interface FileErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{ message: string }>;
  };
}
