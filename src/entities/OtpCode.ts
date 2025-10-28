import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  // BeforeInsert,
} from "typeorm";

import { User } from "./User";
import { OtpPurpose } from "../constants";
// import { hashOtp } from "../utils/otp";

@Entity("otp_codes")
@Index(["userId"])
export class OtpCode {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "user_id" })
  userId!: string;

  @Column({ type: "varchar", length: 255, name: "otp_code" })
  otpCode!: string;

  @Column({
    type: "enum",
    enum: OtpPurpose,
  })
  purpose!: OtpPurpose;

  @Column({ type: "timestamp", name: "expires_at", nullable: false })
  expiresAt!: Date;

  @Column({ type: "timestamp", nullable: true, name: "verified_at" })
  verifiedAt?: Date;

  @Column({ type: "integer", default: 0, name: "attempt_count" })
  attemptCount!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.otpCodes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  // @BeforeInsert()
  // async hashOtpBeforeInsert(): Promise<void> {
  //   if (this.otpCode !== undefined && this.otpCode !== null) {
  //     this.otpCode = await hashOtp(this.otpCode);
  //   }
  // }
}
