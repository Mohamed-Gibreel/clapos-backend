import { MigrationInterface, QueryRunner } from 'typeorm';

export class MultilingualFields1785945466499 implements MigrationInterface {
  name = 'MultilingualFields1785945466499';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tax_config" ALTER COLUMN "name" TYPE jsonb USING jsonb_build_object('en', "name")`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."UQ_category_name_tenant_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ALTER COLUMN "name" TYPE jsonb USING jsonb_build_object('en', "name")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_category_name_tenant_active" ON "category" ("name", "tenantId") WHERE "deletedAt" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "name" TYPE jsonb USING jsonb_build_object('en', "name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "description" TYPE jsonb USING (CASE WHEN "description" IS NULL THEN NULL ELSE jsonb_build_object('en', "description") END)`,
    );

    await queryRunner.query(
      `ALTER TABLE "variation_group" ALTER COLUMN "name" TYPE jsonb USING jsonb_build_object('en', "name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "variation_option" ALTER COLUMN "name" TYPE jsonb USING jsonb_build_object('en', "name")`,
    );

    await queryRunner.query(
      `ALTER TABLE "discount" ALTER COLUMN "name" TYPE jsonb USING jsonb_build_object('en', "name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "discount" ALTER COLUMN "name" TYPE character varying USING ("name"->>'en')`,
    );

    await queryRunner.query(
      `ALTER TABLE "variation_option" ALTER COLUMN "name" TYPE character varying USING ("name"->>'en')`,
    );
    await queryRunner.query(
      `ALTER TABLE "variation_group" ALTER COLUMN "name" TYPE character varying USING ("name"->>'en')`,
    );

    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "description" TYPE character varying USING ("description"->>'en')`,
    );
    await queryRunner.query(
      `ALTER TABLE "product" ALTER COLUMN "name" TYPE character varying USING ("name"->>'en')`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."UQ_category_name_tenant_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ALTER COLUMN "name" TYPE character varying USING ("name"->>'en')`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_category_name_tenant_active" ON "category" ("name", "tenantId") WHERE "deletedAt" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "tax_config" ALTER COLUMN "name" TYPE character varying USING ("name"->>'en')`,
    );
  }
}
