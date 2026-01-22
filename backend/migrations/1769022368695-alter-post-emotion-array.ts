import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterPostEmotionArray1769022368695 implements MigrationInterface {
  name = 'AlterPostEmotionArray1769022368695';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" ALTER COLUMN "emotion" TYPE character varying(5)[] USING CASE WHEN "emotion" IS NULL THEN NULL ELSE ARRAY["emotion"] END`,
    );
    await queryRunner.query(`
      UPDATE "posts" AS p
      SET "emotion" = sub.emotions
      FROM (
        SELECT
          "post_id",
          array_agg(DISTINCT ("value"->>'mood')::varchar(5)) AS emotions
        FROM "post_blocks"
        WHERE "type" = 'MOOD'
        GROUP BY "post_id"
      ) AS sub
      WHERE p."id" = sub."post_id"
        AND (p."emotion" IS NULL OR p."emotion" = '{}'::varchar(5)[]);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" ALTER COLUMN "emotion" TYPE character varying(5) USING CASE WHEN "emotion" IS NULL THEN NULL ELSE "emotion"[1] END`,
    );
    await queryRunner.query(`
      UPDATE "posts" AS p
      SET "emotion" = sub.emotion
      FROM (
        SELECT
          "post_id",
          ("value"->>'mood')::varchar(5) AS emotion
        FROM "post_blocks"
        WHERE "type" = 'MOOD'
      ) AS sub
      WHERE p."id" = sub."post_id"
        AND p."emotion" IS NULL;
    `);
  }
}
