import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1785818950663 implements MigrationInterface {
    name = 'Migration1785818950663'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "terminal_event" DROP CONSTRAINT "UQ_6da2e59aef17686cd2542bd812e"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_terminal_event_terminal_event_active" ON "terminal_event" ("terminalId", "eventId") WHERE "deletedAt" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_terminal_event_terminal_event_active"`);
        await queryRunner.query(`ALTER TABLE "terminal_event" ADD CONSTRAINT "UQ_6da2e59aef17686cd2542bd812e" UNIQUE ("terminalId", "eventId")`);
    }

}
