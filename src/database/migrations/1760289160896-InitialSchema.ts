import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1760289160896 implements MigrationInterface {
  name = "InitialSchema1760289160896";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_roles_role_enum" AS ENUM('admin', 'customer')`
    );
    await queryRunner.query(
      `CREATE TABLE "user_roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "role" "public"."user_roles_role_enum" NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8acd5cf26ebd158416f477de799" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_87b8888186ca9769c960e92687" ON "user_roles" ("user_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_09d115a69b6014d324d592f9c4" ON "user_roles" ("user_id", "role") `
    );
    await queryRunner.query(
      `CREATE TABLE "stores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_by" uuid, CONSTRAINT "UQ_c03f4f73d83362cabb34dfa9418" UNIQUE ("owner_id"), CONSTRAINT "UQ_a205ca5a37fa5e10005f003aaf3" UNIQUE ("name"), CONSTRAINT "REL_c03f4f73d83362cabb34dfa941" UNIQUE ("owner_id"), CONSTRAINT "PK_7aa6e7d71fa7acdd7ca43d7c9cb" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."otp_codes_purpose_enum" AS ENUM('email_verification', 'password_reset')`
    );
    await queryRunner.query(
      `CREATE TABLE "otp_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "otp_code" character varying(255) NOT NULL, "purpose" "public"."otp_codes_purpose_enum" NOT NULL, "expires_at" TIMESTAMP NOT NULL, "verified_at" TIMESTAMP, "attempt_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9d0487965ac1837d57fec4d6a26" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_318b850fc020b1e0f8670f66e1" ON "otp_codes" ("user_id") `
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_account_status_enum" AS ENUM('active', 'blocked', 'suspended', 'pending')`
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying(20) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "email_verified" TIMESTAMP, "account_status" "public"."users_account_status_enum" NOT NULL DEFAULT 'pending', "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "stores" ADD CONSTRAINT "FK_c03f4f73d83362cabb34dfa9418" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "otp_codes" ADD CONSTRAINT "FK_318b850fc020b1e0f8670f66e12" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "otp_codes" DROP CONSTRAINT "FK_318b850fc020b1e0f8670f66e12"`
    );
    await queryRunner.query(
      `ALTER TABLE "stores" DROP CONSTRAINT "FK_c03f4f73d83362cabb34dfa9418"`
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_account_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_318b850fc020b1e0f8670f66e1"`
    );
    await queryRunner.query(`DROP TABLE "otp_codes"`);
    await queryRunner.query(`DROP TYPE "public"."otp_codes_purpose_enum"`);
    await queryRunner.query(`DROP TABLE "stores"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_09d115a69b6014d324d592f9c4"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_87b8888186ca9769c960e92687"`
    );
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP TYPE "public"."user_roles_role_enum"`);
  }
}
