export function generateOtpCode(): string {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

export function calculateOtpExpiry(minutes: number = 15): Date {
  const now = new Date();
  return new Date(now.getTime() + minutes * 60000);
}
