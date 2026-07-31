import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1770638398268 implements MigrationInterface {
    name = 'Migration1770638398268'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."role_name_enum" AS ENUM('User', 'Admin', 'SuperAdmin')`);
        await queryRunner.query(`CREATE TABLE "role" ("id" SERIAL NOT NULL, "name" "public"."role_name_enum" NOT NULL, CONSTRAINT "UQ_ae4578dcaed5adff96595e61660" UNIQUE ("name"), CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "project" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "tenantId" uuid, CONSTRAINT "UQ_001552e6547ef46b1e9bc1be664" UNIQUE ("name", "tenantId"), CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tenant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, CONSTRAINT "PK_da8c6efd67bb301e810e56ac139" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "emailAddress" character varying NOT NULL, "name" character varying NOT NULL, "password" character varying NOT NULL, "last_login_at" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "roleId" integer, "tenantId" uuid, CONSTRAINT "UQ_eea9ba2f6e1bb8cb89c4e672f62" UNIQUE ("emailAddress"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "project" ADD CONSTRAINT "FK_710135bfa3254e493e6ebe683d0" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_c28e52f758e7bbc53828db92194" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_685bf353c85f23b6f848e4dcded" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_685bf353c85f23b6f848e4dcded"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_c28e52f758e7bbc53828db92194"`);
        await queryRunner.query(`ALTER TABLE "project" DROP CONSTRAINT "FK_710135bfa3254e493e6ebe683d0"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "tenant"`);
        await queryRunner.query(`DROP TABLE "project"`);
        await queryRunner.query(`DROP TABLE "role"`);
        await queryRunner.query(`DROP TYPE "public"."role_name_enum"`);
    }

}
