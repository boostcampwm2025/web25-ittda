import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePostGroupShare1785943591809 implements MigrationInterface {
  name = 'CreatePostGroupShare1785943591809';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "post_group_shares" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "post_id" uuid NOT NULL, "group_id" uuid NOT NULL, "shared_by_user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_f366945b73bae6e8842e612e0a6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_772509429a63fa2916d6e6b19e" ON "post_group_shares" ("post_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f787d33fa9d36760c1f3d4292d" ON "post_group_shares" ("group_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_4c71709d2634a18a80325ec66e" ON "post_group_shares" ("post_id", "group_id") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_group_shares" ADD CONSTRAINT "FK_772509429a63fa2916d6e6b19e2" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_group_shares" ADD CONSTRAINT "FK_f787d33fa9d36760c1f3d4292de" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_group_shares" ADD CONSTRAINT "FK_02ba7419454c656dbcd9e71a8c5" FOREIGN KEY ("shared_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_group_shares" DROP CONSTRAINT "FK_02ba7419454c656dbcd9e71a8c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_group_shares" DROP CONSTRAINT "FK_f787d33fa9d36760c1f3d4292de"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_group_shares" DROP CONSTRAINT "FK_772509429a63fa2916d6e6b19e2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4c71709d2634a18a80325ec66e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f787d33fa9d36760c1f3d4292d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_772509429a63fa2916d6e6b19e"`,
    );
    await queryRunner.query(`DROP TABLE "post_group_shares"`);
  }
}
