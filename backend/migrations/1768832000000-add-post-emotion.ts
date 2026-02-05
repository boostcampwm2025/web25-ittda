import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostEmotion1768832000000 implements MigrationInterface {
  name = 'AddPostEmotion1768832000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "emotion" character varying(20)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" DROP COLUMN IF EXISTS "emotion"`,
    );
  }
}
