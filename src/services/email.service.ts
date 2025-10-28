import nodemailer from "nodemailer";
import { env } from "../configs/envConfig";
import logger from "../configs/logger";

export class EmailService {
  private transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  async sendOtp(email: string, otp: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: "Your OTP Code",
        html: `<h1>Your OTP: ${otp}</h1><p>Expires in ${env.OTP_EXPIRY_MINUTES} minutes</p>`,
      });

      logger.info(`OTP email sent successfully to ${email}`);
    } catch (error) {
      logger.error(`Failed to send OTP email to ${email}:`, error);
    }
  }
}
