import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostDraftsKindAndTarget1769617375430 implements MigrationInterface {
  name = 'AddPostDraftsKindAndTarget1769617375430';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."post_drafts_kind_enum" AS ENUM('CREATE', 'EDIT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_drafts" ADD "kind" "public"."post_drafts_kind_enum" NOT NULL DEFAULT 'CREATE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_drafts" ADD "target_post_id" uuid`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_post_drafts_active_group"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_post_drafts_active_group_create" ON "post_drafts" ("group_id") WHERE is_active = true AND kind = 'CREATE'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_post_drafts_active_group_edit" ON "post_drafts" ("group_id", "target_post_id") WHERE is_active = true AND kind = 'EDIT'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_post_drafts_active_group_edit"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_post_drafts_active_group_create"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_post_drafts_active_group" ON "post_drafts" ("group_id") WHERE is_active = true`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_drafts" DROP COLUMN "target_post_id"`,
    );
    await queryRunner.query(`ALTER TABLE "post_drafts" DROP COLUMN "kind"`);
    await queryRunner.query(`DROP TYPE "public"."post_drafts_kind_enum"`);
  }
}
