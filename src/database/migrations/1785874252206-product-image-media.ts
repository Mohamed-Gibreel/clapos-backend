import { MigrationInterface, QueryRunner } from "typeorm";

export class ProductImageMedia1785874252206 implements MigrationInterface {
    name = 'ProductImageMedia1785874252206'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "imageUrl"`);
        await queryRunner.query(`ALTER TABLE "product" ADD "imageId" uuid`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_b1b332c0f436897f21a960f26c7" FOREIGN KEY ("imageId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_b1b332c0f436897f21a960f26c7"`);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "imageId"`);
        await queryRunner.query(`ALTER TABLE "product" ADD "imageUrl" character varying`);
    }

}
