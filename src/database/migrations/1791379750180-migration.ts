import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1791379750180 implements MigrationInterface {
    name = 'Migration1791379750180'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" ADD "discountCode" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "discountCode"`);
    }

}
