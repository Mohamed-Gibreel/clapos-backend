import { MigrationInterface, QueryRunner } from "typeorm";

export class CategoryIconMedia1785948171934 implements MigrationInterface {
    name = 'CategoryIconMedia1785948171934'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "icon"`);
        await queryRunner.query(`ALTER TABLE "category" ADD "iconId" uuid`);
        await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "FK_6b1c6bc5c2fbba874342e58ba67" FOREIGN KEY ("iconId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_6b1c6bc5c2fbba874342e58ba67"`);
        await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "iconId"`);
        await queryRunner.query(`ALTER TABLE "category" ADD "icon" character varying`);
    }

}
