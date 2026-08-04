import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1785818883174 implements MigrationInterface {
    name = 'Migration1785818883174'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "UQ_505d4bf5fa042f7254adff9d6ad"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_product_sku_tenant_active" ON "product" ("sku", "tenantId") WHERE "deletedAt" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_product_sku_tenant_active"`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "UQ_505d4bf5fa042f7254adff9d6ad" UNIQUE ("sku", "tenantId")`);
    }

}
