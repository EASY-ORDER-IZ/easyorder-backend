import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User";
import { Tenant } from "./Tenant";

export enum Role {
  ADMIN = "admin",
  CUSTOMER = "customer",
}

@Entity("user_roles")
@Index(["userId", "tenantId"], { unique: true })
export class UserRole {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  @Column({
    type: "enum",
    enum: Role,
  })
  role!: Role;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.userRoles)
  @JoinColumn({ name: "userId" })
  user!: User;

  @ManyToOne(() => Tenant, (tenant) => tenant.userRoles)
  @JoinColumn({ name: "tenantId" })
  tenant!: Tenant;
}
