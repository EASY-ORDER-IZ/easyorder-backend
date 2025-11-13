import argon2 from "argon2";
import logger from "../../configs/logger";

export async function hashOtp(otp: string): Promise<string> {
  return await argon2.hash(otp);
}
// ! hook
export async function verifyOtp(otp: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, otp);
  } catch (error) {
    logger.error("OTP verification error:", error);
    return false;
  }
}
