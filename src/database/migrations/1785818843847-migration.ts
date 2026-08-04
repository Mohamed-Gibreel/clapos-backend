import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1785818843847 implements MigrationInterface {
    name = 'Migration1785818843847'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_30d87f4cea5b6fe30125c87e770"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_user_email_tenant_active" ON "user" ("emailAddress", "tenantId") WHERE "deletedAt" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_user_email_tenant_active"`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_30d87f4cea5b6fe30125c87e770" UNIQUE ("emailAddress", "tenantId")`);
    }

}
