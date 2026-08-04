import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1785818810951 implements MigrationInterface {
    name = 'Migration1785818810951'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "UQ_33e48bdf6a67804c0e370494285"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_category_name_tenant_active" ON "category" ("name", "tenantId") WHERE "deletedAt" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_category_name_tenant_active"`);
        await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "UQ_33e48bdf6a67804c0e370494285" UNIQUE ("name", "tenantId")`);
    }

}
