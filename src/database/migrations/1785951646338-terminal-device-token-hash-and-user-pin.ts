import { MigrationInterface, QueryRunner } from "typeorm";

// deviceToken is renamed to deviceTokenHash in place — any terminal already
// paired with the old plaintext value must call POST /terminals/:id/rotate-token
// before it can pair again, since the stored value is no longer a real hash.
export class TerminalDeviceTokenHashAndUserPin1785951646338 implements MigrationInterface {
    name = 'TerminalDeviceTokenHashAndUserPin1785951646338'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pos_terminal" RENAME COLUMN "deviceToken" TO "deviceTokenHash"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "pin" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "pin"`);
        await queryRunner.query(`ALTER TABLE "pos_terminal" RENAME COLUMN "deviceTokenHash" TO "deviceToken"`);
    }

}
