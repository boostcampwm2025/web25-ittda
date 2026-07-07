import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFcmTokenUniqueConstraint1783348447838 implements MigrationInterface {
  name = 'AddFcmTokenUniqueConstraint1783348447838';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_fcm_tokens_user_id_platform"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fcm_tokens" ADD CONSTRAINT "UQ_fcm_tokens_user_id_platform" UNIQUE ("user_id", "platform")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "fcm_tokens" DROP CONSTRAINT "UQ_fcm_tokens_user_id_platform"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fcm_tokens_user_id_platform" ON "fcm_tokens" ("user_id", "platform")`,
    );
  }
}
