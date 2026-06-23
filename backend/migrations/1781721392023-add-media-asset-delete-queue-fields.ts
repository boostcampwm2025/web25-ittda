import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaAssetDeleteQueueFields1781721392023 implements MigrationInterface {
  name = 'AddMediaAssetDeleteQueueFields1781721392023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media_assets" ADD "delete_requested_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" ADD "delete_retry_count" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" ADD "last_delete_error" text`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_media_assets_delete_requested_at" ON "media_assets" ("delete_requested_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_media_assets_delete_requested_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" DROP COLUMN "last_delete_error"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" DROP COLUMN "delete_retry_count"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" DROP COLUMN "delete_requested_at"`,
    );
  }
}
