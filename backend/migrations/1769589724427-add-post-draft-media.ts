import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostDraftMedia1769589724427 implements MigrationInterface {
  name = 'AddPostDraftMedia1769589724427';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "post_draft_media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "draft_id" uuid NOT NULL, "media_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b0bfbf30818baa7061867a90340" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_46848eaa21a5be3d81726be4b7" ON "post_draft_media" ("draft_id", "media_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "post_draft_media" ADD CONSTRAINT "FK_cecc1c531404f6bec222f624955" FOREIGN KEY ("draft_id") REFERENCES "post_drafts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_draft_media" ADD CONSTRAINT "FK_935d12dada3bee1db4c7f43f70f" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_draft_media" DROP CONSTRAINT "FK_935d12dada3bee1db4c7f43f70f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_draft_media" DROP CONSTRAINT "FK_cecc1c531404f6bec222f624955"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_46848eaa21a5be3d81726be4b7"`,
    );
    await queryRunner.query(`DROP TABLE "post_draft_media"`);
  }
}
