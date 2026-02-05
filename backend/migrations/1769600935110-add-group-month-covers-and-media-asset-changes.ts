import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupMonthCoversAndMediaAssetChanges1769600935110 implements MigrationInterface {
  name = 'AddGroupMonthCoversAndMediaAssetChanges1769600935110';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "group_month_covers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "group_id" uuid NOT NULL, "year" integer NOT NULL, "month" integer NOT NULL, "cover_media_asset_id" uuid, "source_post_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1721e2b6392d38edb6b32a7d53b" UNIQUE ("group_id", "year", "month"), CONSTRAINT "PK_dc2dde92d65d15ce5c12fc9a5a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "media_assets" ADD "width" integer`);
    await queryRunner.query(`ALTER TABLE "media_assets" ADD "height" integer`);
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "nickname" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_drafts" ALTER COLUMN "snapshot" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a759d9accb8e41ae25c357e5ed" ON "post_media" ("media_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1eeb54a4fdfbe9db17899243cb" ON "post_media" ("post_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_posts_group_event_id" ON "posts" ("group_id", "event_at", "id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "group_month_covers" ADD CONSTRAINT "FK_4275491a1a4b408c52a312bfcbf" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_month_covers" ADD CONSTRAINT "FK_ce3314a26d74909c7b670c21bcd" FOREIGN KEY ("cover_media_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_month_covers" ADD CONSTRAINT "FK_c018a5cf2d35b39d29fb6b8b662" FOREIGN KEY ("source_post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_drafts" DROP CONSTRAINT "FK_afa6cee0b190c2e318fb9c207d2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_drafts" ADD CONSTRAINT "FK_afa6cee0b190c2e318fb9c207d2" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "group_month_covers" DROP CONSTRAINT "FK_c018a5cf2d35b39d29fb6b8b662"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_month_covers" DROP CONSTRAINT "FK_ce3314a26d74909c7b670c21bcd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_month_covers" DROP CONSTRAINT "FK_4275491a1a4b408c52a312bfcbf"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_posts_group_event_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1eeb54a4fdfbe9db17899243cb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a759d9accb8e41ae25c357e5ed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_drafts" ALTER COLUMN "snapshot" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "nickname" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(`ALTER TABLE "media_assets" DROP COLUMN "height"`);
    await queryRunner.query(`ALTER TABLE "media_assets" DROP COLUMN "width"`);
    await queryRunner.query(`DROP TABLE "group_month_covers"`);
    await queryRunner.query(
      `ALTER TABLE "post_drafts" DROP CONSTRAINT "FK_afa6cee0b190c2e318fb9c207d2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_drafts" ADD CONSTRAINT "FK_afa6cee0b190c2e318fb9c207d2" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
