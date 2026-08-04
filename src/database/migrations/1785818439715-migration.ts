import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1785818439715 implements MigrationInterface {
    name = 'Migration1785818439715'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "feature_flag" DROP CONSTRAINT "UQ_49b0237d95e9f0164218ecafd52"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_feature_flag_key_tenant_active" ON "feature_flag" ("key", "tenantId") WHERE "deletedAt" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_feature_flag_key_tenant_active"`);
        await queryRunner.query(`ALTER TABLE "feature_flag" ADD CONSTRAINT "UQ_49b0237d95e9f0164218ecafd52" UNIQUE ("key", "tenantId")`);
    }

}
