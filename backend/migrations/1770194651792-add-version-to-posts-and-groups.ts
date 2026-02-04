import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVersionToPostsAndGroups1770194651792 implements MigrationInterface {
  name = 'AddVersionToPostsAndGroups1770194651792';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."uq_post_drafts_active_group_create"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."uq_post_drafts_active_group_edit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_media" DROP CONSTRAINT "chk_post_media_kind"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_blocks" DROP CONSTRAINT "uq_post_blocks_start_cell"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "version" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" ADD "version" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_drafts" ALTER COLUMN "snapshot" SET DEFAULT '{}'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_drafts" ALTER COLUMN "snapshot" SET DEFAULT '{}'`,
    );
    await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "version"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "version"`);
    await queryRunner.query(
      `ALTER TABLE "post_blocks" ADD CONSTRAINT "uq_post_blocks_start_cell" UNIQUE ("post_id", "layout_row", "layout_col")`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_media" ADD CONSTRAINT "chk_post_media_kind" CHECK ((((kind = 'THUMBNAIL'::post_media_kind_enum) AND (block_id IS NULL) AND (sort_order IS NULL)) OR ((kind = 'BLOCK'::post_media_kind_enum) AND (block_id IS NOT NULL) AND (sort_order IS NOT NULL))))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_post_drafts_active_group_edit" ON "post_drafts" ("group_id", "target_post_id") WHERE ((is_active = true) AND (kind = 'EDIT'::post_drafts_kind_enum))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_post_drafts_active_group_create" ON "post_drafts" ("group_id") WHERE ((is_active = true) AND (kind = 'CREATE'::post_drafts_kind_enum))`,
    );
  }
}
