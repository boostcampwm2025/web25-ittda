import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVersionToPostsAndGroups1770194651792 implements MigrationInterface {
  name = 'AddVersionToPostsAndGroups1770194651792';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "version" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" ADD "version" integer NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "version"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "version"`);
  }
}
