import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillPostEmotion1768833000000 implements MigrationInterface {
  name = 'BackfillPostEmotion1768833000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "posts" p
       SET "emotion" = b.value->>'mood'
       FROM "post_blocks" b
       WHERE b."post_id" = p."id"
         AND b."type" = 'MOOD'
         AND p."emotion" IS NULL`,
    );
  }

  public async down(): Promise<void> {
    // Data backfill is non-reversible without tracking previous values.
  }
}
