export interface CreateStoreSuccessResponse {
  data: {
    store: {
      id: string;
      name: string;
      description?: string;
      createdAt: Date;
    };
    user: {
      id: string;
      username: string;
      email: string;
      roles: string[];
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
