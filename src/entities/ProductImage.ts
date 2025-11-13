import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
} from "typeorm";

import { Product } from "./Product";

@Entity("product_images")
@Check(`LOWER("image_name") LIKE '%.jpg' OR LOWER("image_name") LIKE '%.png'`)
export class ProductImage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "product_id", nullable: true })
  productId?: string;

  @Column({ type: "varchar", length: 255, nullable: false, name: "image_name" })
  imageName!: string;

  @Column({ type: "boolean", default: false, name: "is_primary" })
  isPrimary!: boolean;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Column({ type: "uuid", nullable: true, name: "created_by" })
  createdBy?: string;

  @ManyToOne(() => Product, (product) => product.images, {
    nullable: true,
  })
  @JoinColumn({ name: "product_id" })
  product?: Product;
}
