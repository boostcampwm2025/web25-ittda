import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUpdatedAtToRefreshTokens1769426745027 implements MigrationInterface {
  name = 'AddUpdatedAtToRefreshTokens1769426745027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      DROP COLUMN "updated_at"
    `);
  }
}
