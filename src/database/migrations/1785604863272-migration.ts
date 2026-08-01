import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1785604863272 implements MigrationInterface {
    name = 'Migration1785604863272'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."table_shape_enum" AS ENUM('circle', 'square', 'rectangle')`);
        await queryRunner.query(`CREATE TYPE "public"."table_status_enum" AS ENUM('available', 'occupied', 'reserved')`);
        await queryRunner.query(`CREATE TABLE "table" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "shape" "public"."table_shape_enum" NOT NULL, "capacity" integer NOT NULL, "status" "public"."table_status_enum" NOT NULL DEFAULT 'available', "posX" double precision NOT NULL, "posY" double precision NOT NULL, "width" double precision NOT NULL, "height" double precision NOT NULL, "color" character varying NOT NULL, "tenantId" uuid, CONSTRAINT "PK_28914b55c485fc2d7a101b1b2a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."membership_type_enum" AS ENUM('lifetime', 'monthly', 'annual')`);
        await queryRunner.query(`CREATE TABLE "membership" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "customerId" uuid NOT NULL, "type" "public"."membership_type_enum" NOT NULL, "startDate" date NOT NULL, "expiryDate" date, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "REL_b566644a095e72fa5afe7a9edd" UNIQUE ("customerId"), CONSTRAINT "PK_83c1afebef3059472e7c37e8de8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "table" ADD CONSTRAINT "FK_110e94c9ba2006dafbaa4593abb" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "membership" ADD CONSTRAINT "FK_b566644a095e72fa5afe7a9edd1" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "membership" DROP CONSTRAINT "FK_b566644a095e72fa5afe7a9edd1"`);
        await queryRunner.query(`ALTER TABLE "table" DROP CONSTRAINT "FK_110e94c9ba2006dafbaa4593abb"`);
        await queryRunner.query(`DROP TABLE "membership"`);
        await queryRunner.query(`DROP TYPE "public"."membership_type_enum"`);
        await queryRunner.query(`DROP TABLE "table"`);
        await queryRunner.query(`DROP TYPE "public"."table_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."table_shape_enum"`);
    }

}
