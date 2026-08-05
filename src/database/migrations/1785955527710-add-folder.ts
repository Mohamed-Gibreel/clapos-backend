import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFolder1785955527710 implements MigrationInterface {
    name = 'AddFolder1785955527710'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "folder" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "parentId" uuid, "tenantId" uuid, CONSTRAINT "PK_6278a41a706740c94c02e288df8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_folder_name_parent_tenant_active" ON "folder" ("name", "parentId", "tenantId") WHERE "deletedAt" IS NULL`);
        await queryRunner.query(`ALTER TABLE "media" ADD "folderId" uuid`);
        await queryRunner.query(`ALTER TABLE "folder" ADD CONSTRAINT "FK_9ee3bd0f189fb242d488c0dfa39" FOREIGN KEY ("parentId") REFERENCES "folder"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "folder" ADD CONSTRAINT "FK_0f107ef0bd5bcf6ac5405adbcae" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "media" ADD CONSTRAINT "FK_281435a95f96d84dc175a0319de" FOREIGN KEY ("folderId") REFERENCES "folder"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media" DROP CONSTRAINT "FK_281435a95f96d84dc175a0319de"`);
        await queryRunner.query(`ALTER TABLE "folder" DROP CONSTRAINT "FK_0f107ef0bd5bcf6ac5405adbcae"`);
        await queryRunner.query(`ALTER TABLE "folder" DROP CONSTRAINT "FK_9ee3bd0f189fb242d488c0dfa39"`);
        await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "folderId"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_folder_name_parent_tenant_active"`);
        await queryRunner.query(`DROP TABLE "folder"`);
    }

}
