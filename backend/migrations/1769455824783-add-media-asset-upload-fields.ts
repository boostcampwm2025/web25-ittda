import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaAssetUploadFields1769455824783 implements MigrationInterface {
  name = 'AddMediaAssetUploadFields1769455824783';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."media_assets_status_enum" AS ENUM('PENDING', 'READY', 'FAILED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" ADD "status" "public"."media_assets_status_enum" NOT NULL DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" ADD "etag" character varying(128)`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" ADD "uploaded_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_media_assets_storage_key_active" ON "media_assets" ("storage_key") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."uq_media_assets_storage_key_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" DROP COLUMN "uploaded_at"`,
    );
    await queryRunner.query(`ALTER TABLE "media_assets" DROP COLUMN "etag"`);
    await queryRunner.query(`ALTER TABLE "media_assets" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."media_assets_status_enum"`);
  }
}
