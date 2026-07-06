import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFcmTokenMigration1783344174180 implements MigrationInterface {
  name = 'CreateFcmTokenMigration1783344174180';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "fcm_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token" text NOT NULL,
        "platform" character varying(10) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fcm_tokens" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fcm_tokens_user_id_platform" ON "fcm_tokens" ("user_id", "platform")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fcm_tokens_user_id_platform"`,
    );
    await queryRunner.query(`DROP TABLE "fcm_tokens"`);
  }
}
