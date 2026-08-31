import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeUserOauthUniqueOnlyForActiveUsers1776246916021 implements MigrationInterface {
  name = 'MakeUserOauthUniqueOnlyForActiveUsers1776246916021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_9c126dfdc9977c5a43780494471"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_provider_provider_id_active" ON "users" ("provider", "provider_id") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_users_provider_provider_id_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_9c126dfdc9977c5a43780494471" UNIQUE ("provider", "provider_id")`,
    );
  }
}
