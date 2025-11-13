import type { Request } from "express";
import type { z } from "zod";
import type { registerSchema } from "../schemas/auth.schema";

export type RegisterRequest = z.infer<typeof registerSchema>;

export interface RegisterRequestType extends Request {
  body: RegisterRequest;
}
