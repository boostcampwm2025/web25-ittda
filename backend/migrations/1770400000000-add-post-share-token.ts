import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostShareToken1770400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" ADD COLUMN "share_token" uuid`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_posts_share_token" ON "posts" ("share_token") WHERE "share_token" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_posts_share_token"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "share_token"`);
  }
}
