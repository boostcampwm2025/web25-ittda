import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupMemberSoftDelete1776953071970 implements MigrationInterface {
  name = 'AddGroupMemberSoftDelete1776953071970';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "group_members" DROP CONSTRAINT IF EXISTS "UQ_f5939ee0ad233ad35e03f5c65c1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7c25c4411fca323ef830fd580b" ON "group_members" ("group_id", "user_id") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_7c25c4411fca323ef830fd580b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD CONSTRAINT "UQ_f5939ee0ad233ad35e03f5c65c1" UNIQUE ("group_id", "user_id")`,
    );
  }
}
