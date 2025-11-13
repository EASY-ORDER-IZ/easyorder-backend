import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  OneToOne,
  BeforeInsert,
} from "typeorm";

import argon2 from "argon2";
import { UserRole } from "./UserRole";
import { Store } from "./Store";
import { OtpCode } from "./OtpCode";

import { AccountStatus } from "../constants";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 20, nullable: false })
  username!: string;

  @Column({ type: "varchar", length: 255, unique: true, nullable: false })
  email!: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
    name: "password_hash",
  })
  passwordHash!: string;

  @Column({ type: "timestamp", nullable: true, name: "email_verified" })
  emailVerified?: Date;

  @Column({
    type: "enum",
    enum: AccountStatus,
    default: AccountStatus.PENDING,
    name: "account_status",
  })
  accountStatus!: AccountStatus;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles!: UserRole[];

  @OneToOne(() => Store, (store) => store.owner, {
    cascade: true,
    eager: false,
  })
  store?: Store;

  @OneToMany(() => OtpCode, (otpCode) => otpCode.user)
  otpCodes!: OtpCode[];

  @BeforeInsert()
  async hashPasswordBeforeInsert(): Promise<void> {
    if (this.passwordHash !== undefined && this.passwordHash !== null) {
      this.passwordHash = await argon2.hash(this.passwordHash);
    }
  }
}
