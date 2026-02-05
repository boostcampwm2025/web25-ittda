import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostDraftCreateSlot1770288931741 implements MigrationInterface {
  name = 'AddPostDraftCreateSlot1770288931741';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_drafts" ADD "create_slot" integer`,
    );
    await queryRunner.query(
      `UPDATE "post_drafts" SET "create_slot" = 1 WHERE "kind" = 'CREATE' AND "is_active" = true AND "create_slot" IS NULL`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_post_drafts_active_group_create"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_post_drafts_active_group_create_slot" ON "post_drafts" ("group_id", "create_slot") WHERE is_active = true AND kind = 'CREATE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_post_drafts_active_group_create_slot"`,
    );
    await queryRunner.query(
      `WITH ranked AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY group_id
            ORDER BY updated_at DESC, created_at DESC
          ) AS rn
        FROM post_drafts
        WHERE is_active = true AND kind = 'CREATE'
      )
      UPDATE post_drafts d
      SET is_active = false
      FROM ranked r
      WHERE d.id = r.id AND r.rn > 1`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_post_drafts_active_group_create" ON "post_drafts" ("group_id") WHERE is_active = true AND kind = 'CREATE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_drafts" DROP COLUMN "create_slot"`,
    );
  }
}
