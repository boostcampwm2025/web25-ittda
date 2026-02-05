import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterPostRatingToReal1768831000000 implements MigrationInterface {
  name = 'AlterPostRatingToReal1768831000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" ALTER COLUMN "rating" TYPE real USING "rating"::real`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" ALTER COLUMN "rating" TYPE smallint USING "rating"::smallint`,
    );
  }
}
