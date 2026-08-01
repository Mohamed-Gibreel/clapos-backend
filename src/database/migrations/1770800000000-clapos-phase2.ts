import { MigrationInterface, QueryRunner } from 'typeorm';

export class ClaposPhase21770800000000 implements MigrationInterface {
  name = 'ClaposPhase21770800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // TaxConfig
    await queryRunner.query(`
      CREATE TABLE "tax_config" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying NOT NULL,
        "rate" numeric(5,4) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "tenantId" uuid,
        CONSTRAINT "PK_tax_config" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "tax_config"
        ADD CONSTRAINT "FK_tax_config_tenant"
        FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // FeatureFlag
    await queryRunner.query(`
      CREATE TABLE "feature_flag" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "key" character varying NOT NULL,
        "enabled" boolean NOT NULL DEFAULT false,
        "description" character varying,
        "tenantId" uuid,
        CONSTRAINT "UQ_feature_flag_key_tenant" UNIQUE ("key", "tenantId"),
        CONSTRAINT "PK_feature_flag" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "feature_flag"
        ADD CONSTRAINT "FK_feature_flag_tenant"
        FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Discount
    await queryRunner.query(`CREATE TYPE "discount_type_enum" AS ENUM ('percentage', 'amount')`);
    await queryRunner.query(`
      CREATE TABLE "discount" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying NOT NULL,
        "type" "discount_type_enum" NOT NULL,
        "value" numeric(10,2) NOT NULL,
        "code" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "expiresAt" TIMESTAMP,
        "tenantId" uuid,
        CONSTRAINT "UQ_discount_code" UNIQUE ("code"),
        CONSTRAINT "PK_discount" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "discount"
        ADD CONSTRAINT "FK_discount_tenant"
        FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Event (cross-tenant, no tenantId)
    await queryRunner.query(`
      CREATE TABLE "event" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying NOT NULL,
        "description" character varying,
        "location" character varying,
        "startDate" date NOT NULL,
        "endDate" date NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_event" PRIMARY KEY ("id")
      )
    `);

    // TerminalEvent (junction)
    await queryRunner.query(`
      CREATE TABLE "terminal_event" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "terminalId" uuid NOT NULL,
        "eventId" uuid NOT NULL,
        "assignedById" integer,
        "assignedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UQ_terminal_event" UNIQUE ("terminalId", "eventId"),
        CONSTRAINT "PK_terminal_event" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "terminal_event"
        ADD CONSTRAINT "FK_terminal_event_terminal"
        FOREIGN KEY ("terminalId") REFERENCES "pos_terminal"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "terminal_event"
        ADD CONSTRAINT "FK_terminal_event_event"
        FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "terminal_event"
        ADD CONSTRAINT "FK_terminal_event_user"
        FOREIGN KEY ("assignedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "terminal_event" DROP CONSTRAINT "FK_terminal_event_user"`);
    await queryRunner.query(`ALTER TABLE "terminal_event" DROP CONSTRAINT "FK_terminal_event_event"`);
    await queryRunner.query(`ALTER TABLE "terminal_event" DROP CONSTRAINT "FK_terminal_event_terminal"`);
    await queryRunner.query(`DROP TABLE "terminal_event"`);
    await queryRunner.query(`DROP TABLE "event"`);
    await queryRunner.query(`ALTER TABLE "discount" DROP CONSTRAINT "FK_discount_tenant"`);
    await queryRunner.query(`DROP TABLE "discount"`);
    await queryRunner.query(`DROP TYPE "discount_type_enum"`);
    await queryRunner.query(`ALTER TABLE "feature_flag" DROP CONSTRAINT "FK_feature_flag_tenant"`);
    await queryRunner.query(`DROP TABLE "feature_flag"`);
    await queryRunner.query(`ALTER TABLE "tax_config" DROP CONSTRAINT "FK_tax_config_tenant"`);
    await queryRunner.query(`DROP TABLE "tax_config"`);
  }
}
