import { MigrationInterface, QueryRunner } from 'typeorm';

export class ClaposPhase11770700000000 implements MigrationInterface {
  name = 'ClaposPhase11770700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // POS Terminal
    await queryRunner.query(`
      CREATE TABLE "pos_terminal" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying NOT NULL,
        "deviceToken" character varying NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "lastSeenAt" TIMESTAMP,
        "tenantId" uuid,
        CONSTRAINT "UQ_pos_terminal_deviceToken" UNIQUE ("deviceToken"),
        CONSTRAINT "PK_pos_terminal" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "pos_terminal"
        ADD CONSTRAINT "FK_pos_terminal_tenant"
        FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Category
    await queryRunner.query(`
      CREATE TABLE "category" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying NOT NULL,
        "icon" character varying,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "tenantId" uuid,
        CONSTRAINT "UQ_category_name_tenant" UNIQUE ("name", "tenantId"),
        CONSTRAINT "PK_category" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "category"
        ADD CONSTRAINT "FK_category_tenant"
        FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Product status enum
    await queryRunner.query(`CREATE TYPE "public"."product_status_enum" AS ENUM('active', 'inactive', 'draft')`);

    // Product
    await queryRunner.query(`
      CREATE TABLE "product" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying NOT NULL,
        "description" character varying,
        "sku" character varying NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "imageUrl" character varying,
        "status" "public"."product_status_enum" NOT NULL DEFAULT 'active',
        "categoryId" uuid,
        "tenantId" uuid,
        CONSTRAINT "UQ_product_sku_tenant" UNIQUE ("sku", "tenantId"),
        CONSTRAINT "PK_product" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "product"
        ADD CONSTRAINT "FK_product_category"
        FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "product"
        ADD CONSTRAINT "FK_product_tenant"
        FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Variation Group
    await queryRunner.query(`
      CREATE TABLE "variation_group" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying NOT NULL,
        "required" boolean NOT NULL DEFAULT false,
        "maxSelect" integer NOT NULL DEFAULT 1,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "productId" uuid,
        CONSTRAINT "PK_variation_group" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "variation_group"
        ADD CONSTRAINT "FK_variation_group_product"
        FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Variation Option
    await queryRunner.query(`
      CREATE TABLE "variation_option" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying NOT NULL,
        "priceModifier" numeric(10,2) NOT NULL DEFAULT 0,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "groupId" uuid,
        CONSTRAINT "PK_variation_option" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "variation_option"
        ADD CONSTRAINT "FK_variation_option_group"
        FOREIGN KEY ("groupId") REFERENCES "variation_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Gender enum
    await queryRunner.query(`CREATE TYPE "public"."customer_gender_enum" AS ENUM('male', 'female', 'other')`);

    // Customer
    await queryRunner.query(`
      CREATE TABLE "customer" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "clientId" character varying NOT NULL,
        "firstName" character varying NOT NULL,
        "lastName" character varying NOT NULL,
        "gender" "public"."customer_gender_enum",
        "phone" character varying,
        "email" character varying,
        "address" character varying,
        "birthDate" date,
        "isMember" boolean NOT NULL DEFAULT false,
        "syncedAt" TIMESTAMP,
        "tenantId" uuid,
        CONSTRAINT "UQ_customer_clientId" UNIQUE ("clientId"),
        CONSTRAINT "PK_customer" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "customer"
        ADD CONSTRAINT "FK_customer_tenant"
        FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Order enums
    await queryRunner.query(`CREATE TYPE "public"."order_status_enum" AS ENUM('open', 'in_progress', 'completed', 'cancelled')`);
    await queryRunner.query(`CREATE TYPE "public"."order_type_enum" AS ENUM('dine_in', 'take_away')`);
    await queryRunner.query(`CREATE TYPE "public"."order_discount_type_enum" AS ENUM('percentage', 'amount', 'none')`);
    await queryRunner.query(`CREATE TYPE "public"."order_payment_method_enum" AS ENUM('cash', 'card')`);

    // Order
    await queryRunner.query(`
      CREATE TABLE "order" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "clientId" character varying NOT NULL,
        "orderNumber" character varying,
        "status" "public"."order_status_enum" NOT NULL DEFAULT 'completed',
        "orderType" "public"."order_type_enum" NOT NULL,
        "discountType" "public"."order_discount_type_enum" NOT NULL DEFAULT 'none',
        "discountValue" numeric(10,2) NOT NULL DEFAULT 0,
        "subtotal" numeric(10,2) NOT NULL,
        "tax" numeric(10,2) NOT NULL DEFAULT 0,
        "total" numeric(10,2) NOT NULL,
        "paymentMethod" "public"."order_payment_method_enum" NOT NULL,
        "amountPaid" numeric(10,2) NOT NULL,
        "change" numeric(10,2) NOT NULL,
        "notes" character varying,
        "clientCreatedAt" TIMESTAMP NOT NULL,
        "hadOfflineConflict" boolean NOT NULL DEFAULT false,
        "tenantId" uuid,
        "terminalId" uuid,
        "customerId" uuid,
        "cashierId" integer,
        CONSTRAINT "UQ_order_clientId" UNIQUE ("clientId"),
        CONSTRAINT "UQ_order_orderNumber" UNIQUE ("orderNumber"),
        CONSTRAINT "PK_order" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_order_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_order_terminal" FOREIGN KEY ("terminalId") REFERENCES "pos_terminal"("id") ON DELETE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_order_customer" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_order_cashier" FOREIGN KEY ("cashierId") REFERENCES "user"("id") ON DELETE NO ACTION`);

    // Order Item
    await queryRunner.query(`
      CREATE TABLE "order_item" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "productId" character varying,
        "name" character varying NOT NULL,
        "unitPrice" numeric(10,2) NOT NULL,
        "quantity" integer NOT NULL,
        "subtotal" numeric(10,2) NOT NULL,
        "notes" character varying,
        "orderId" uuid,
        CONSTRAINT "PK_order_item" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`ALTER TABLE "order_item" ADD CONSTRAINT "FK_order_item_order" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE`);

    // Order Item Variation
    await queryRunner.query(`
      CREATE TABLE "order_item_variation" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "groupName" character varying NOT NULL,
        "optionName" character varying NOT NULL,
        "priceModifier" numeric(10,2) NOT NULL DEFAULT 0,
        "orderItemId" uuid,
        CONSTRAINT "PK_order_item_variation" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`ALTER TABLE "order_item_variation" ADD CONSTRAINT "FK_order_item_variation_item" FOREIGN KEY ("orderItemId") REFERENCES "order_item"("id") ON DELETE CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_item_variation" DROP CONSTRAINT "FK_order_item_variation_item"`);
    await queryRunner.query(`DROP TABLE "order_item_variation"`);
    await queryRunner.query(`ALTER TABLE "order_item" DROP CONSTRAINT "FK_order_item_order"`);
    await queryRunner.query(`DROP TABLE "order_item"`);
    await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_order_cashier"`);
    await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_order_customer"`);
    await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_order_terminal"`);
    await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_order_tenant"`);
    await queryRunner.query(`DROP TABLE "order"`);
    await queryRunner.query(`DROP TYPE "public"."order_payment_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."order_discount_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."order_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."order_status_enum"`);
    await queryRunner.query(`ALTER TABLE "customer" DROP CONSTRAINT "FK_customer_tenant"`);
    await queryRunner.query(`DROP TABLE "customer"`);
    await queryRunner.query(`DROP TYPE "public"."customer_gender_enum"`);
    await queryRunner.query(`ALTER TABLE "variation_option" DROP CONSTRAINT "FK_variation_option_group"`);
    await queryRunner.query(`DROP TABLE "variation_option"`);
    await queryRunner.query(`ALTER TABLE "variation_group" DROP CONSTRAINT "FK_variation_group_product"`);
    await queryRunner.query(`DROP TABLE "variation_group"`);
    await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_product_tenant"`);
    await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_product_category"`);
    await queryRunner.query(`DROP TABLE "product"`);
    await queryRunner.query(`DROP TYPE "public"."product_status_enum"`);
    await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_category_tenant"`);
    await queryRunner.query(`DROP TABLE "category"`);
    await queryRunner.query(`ALTER TABLE "pos_terminal" DROP CONSTRAINT "FK_pos_terminal_tenant"`);
    await queryRunner.query(`DROP TABLE "pos_terminal"`);
  }
}
