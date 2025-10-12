import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";

import { User } from "./User";

@Entity("stores")
export class Store {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", unique: true, name: "owner_id", nullable: false })
  ownerId!: string;

  @Column({ type: "varchar", length: 255, unique: true, nullable: false })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @Column({ type: "uuid", nullable: true, name: "created_by" })
  createdBy?: string;

  @Column({ type: "uuid", nullable: true, name: "updated_by" })
  updatedBy?: string;

  @OneToOne(() => User, (user) => user.store)
  @JoinColumn({ name: "owner_id" })
  owner!: User;
}
