import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInquiries1770600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "inquiries" (
        "id"         uuid              NOT NULL DEFAULT gen_random_uuid(),
        "category"   varchar(100)      NOT NULL,
        "content"    text              NOT NULL,
        "email"      varchar(320),
        "is_read"    boolean           NOT NULL DEFAULT false,
        "created_at" timestamptz       NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inquiries" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_inquiries_is_read" ON "inquiries" ("is_read")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_inquiries_is_read"`);
    await queryRunner.query(`DROP TABLE "inquiries"`);
  }
}
