import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAnnouncements1770500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "announcements" (
        "id"         uuid              NOT NULL DEFAULT gen_random_uuid(),
        "title"      varchar(200)      NOT NULL,
        "content"    text,
        "image_url"  text,
        "is_active"  boolean           NOT NULL DEFAULT false,
        "start_at"   timestamptz,
        "end_at"     timestamptz,
        "created_at" timestamptz       NOT NULL DEFAULT now(),
        "updated_at" timestamptz       NOT NULL DEFAULT now(),
        CONSTRAINT "PK_announcements" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_announcements_is_active" ON "announcements" ("is_active")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_announcements_is_active"`);
    await queryRunner.query(`DROP TABLE "announcements"`);
  }
}
