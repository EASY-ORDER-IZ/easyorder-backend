import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Check,
} from "typeorm";

import { Store } from "./Store";
import { ProductImage } from "./ProductImage";
import { ProductSize } from "../constants/enums";

@Entity("products")
@Index(["storeId", "name"])
@Check(`"price" >= 0`)
@Check(`"stock" >= 0`)
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "store_id", nullable: false })
  storeId!: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
  price!: number;

  @Column({ type: "integer", nullable: false, default: 0 })
  stock!: number;

  @Column({
    type: "enum",
    enum: ProductSize,
    nullable: true,
  })
  size?: ProductSize;

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

  @ManyToOne(() => Store)
  @JoinColumn({ name: "store_id" })
  store!: Store;

  @OneToMany(() => ProductImage, (productImage) => productImage.product)
  images!: ProductImage[];
}
