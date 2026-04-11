import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostsGroupFkCascade1770700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 기존 FK 제거 후 ON DELETE CASCADE로 재생성
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_7628aa3741a30d6217271a226cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_7628aa3741a30d6217271a226cf" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_7628aa3741a30d6217271a226cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_7628aa3741a30d6217271a226cf" FOREIGN KEY ("group_id") REFERENCES "groups"("id")`,
    );
  }
}
