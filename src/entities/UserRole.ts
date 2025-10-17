import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";

import { User } from "./User";
import { Role } from "../constants";

@Entity("user_roles")
@Index(["userId", "role"], { unique: true })
@Index(["userId"])
export class UserRole {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "user_id", nullable: false })
  userId!: string;

  @Column({
    type: "enum",
    enum: Role,
  })
  role!: Role;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.userRoles)
  @JoinColumn({ name: "user_id" })
  user!: User;
}
