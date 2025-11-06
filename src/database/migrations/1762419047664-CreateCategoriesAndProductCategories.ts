import type { MigrationInterface, QueryRunner } from "typeorm";
import { v4 as uuid } from "uuid";

export class CreateCategoriesAndProductCategories1762419047664
  implements MigrationInterface
{
  name = "CreateCategoriesAndProductCategories1762419047664";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "parent_id" uuid,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "product_categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "product_id" uuid NOT NULL,
                "category_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_54f2e1dbf14cfa770f59f0aac8f" UNIQUE ("product_id", "category_id"),
                CONSTRAINT "PK_7069dac60d88408eca56fdc9e0c" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "categories" 
            ADD CONSTRAINT "FK_88cea2dc9c31951d06437879b40" 
            FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "product_categories" 
            ADD CONSTRAINT "FK_8748b4a0e8de6d266f2bbc877f6" 
            FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "product_categories" 
            ADD CONSTRAINT "FK_9148da8f26fc248e77a387e3112" 
            FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

    const menId = uuid();
    const womenId = uuid();
    const kidsId = uuid();

    await queryRunner.query(`
            INSERT INTO categories (id, name, created_at)
            VALUES 
                ('${menId}', 'Men', now()),
                ('${womenId}', 'Women', now()),
                ('${kidsId}', 'Kids', now())
        `);

    const menCasualId = uuid();
    const menFormalId = uuid();
    const menSportsId = uuid();

    const womenCasualId = uuid();
    const womenFormalId = uuid();
    const womenSportsId = uuid();

    const boysId = uuid();
    const girlsId = uuid();
    const babiesId = uuid();

    await queryRunner.query(`
            INSERT INTO categories (id, name, parent_id, created_at)
            VALUES
                ('${menCasualId}', 'Casual', '${menId}', now()),
                ('${menFormalId}', 'Formal', '${menId}', now()),
                ('${menSportsId}', 'Sports', '${menId}', now()),

                ('${womenCasualId}', 'Casual', '${womenId}', now()),
                ('${womenFormalId}', 'Formal', '${womenId}', now()),
                ('${womenSportsId}', 'Sports', '${womenId}', now()),

                ('${boysId}', 'Boys', '${kidsId}', now()),
                ('${girlsId}', 'Girls', '${kidsId}', now()),
                ('${babiesId}', 'Babies', '${kidsId}', now())
        `);

    const sizes = ["Shirts", "T-shirts", "Pants", "Shorts"];

    const insertSubSubCategories = (parentId: string): string => {
      return sizes
        .map((name) => `('${uuid()}', '${name}', '${parentId}', now())`)
        .join(",");
    };

    await queryRunner.query(`
            INSERT INTO categories (id, name, parent_id, created_at) VALUES
                ${insertSubSubCategories(menCasualId)},
                ${insertSubSubCategories(menFormalId)},
                ${insertSubSubCategories(menSportsId)},
                ${insertSubSubCategories(womenCasualId)},
                ${insertSubSubCategories(womenFormalId)},
                ${insertSubSubCategories(womenSportsId)},
                ${insertSubSubCategories(boysId)},
                ${insertSubSubCategories(girlsId)},
                ${insertSubSubCategories(babiesId)}
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_categories" DROP CONSTRAINT "FK_9148da8f26fc248e77a387e3112"`
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" DROP CONSTRAINT "FK_8748b4a0e8de6d266f2bbc877f6"`
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_88cea2dc9c31951d06437879b40"`
    );
    await queryRunner.query(`DROP TABLE "product_categories"`);
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
