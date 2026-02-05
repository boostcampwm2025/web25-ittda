import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupActivityLogs1770162982812 implements MigrationInterface {
  name = 'AddGroupActivityLogs1770162982812';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "group_activity_log_actors" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "log_id" uuid NOT NULL, "user_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b3435b4e1d2b71db40c15de9669" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1dcd16321ca624b206d091f3b4" ON "group_activity_log_actors" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cf979ab129b5c65014f5cb3f73" ON "group_activity_log_actors" ("log_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_66d7282ea03f25a1c2c95cb635" ON "group_activity_log_actors" ("log_id", "user_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."group_activity_logs_type_enum" AS ENUM('POST_COLLAB_START', 'POST_EDIT_START', 'POST_COLLAB_COMPLETE', 'POST_EDIT_COMPLETE', 'POST_CREATE', 'POST_UPDATE', 'POST_DELETE', 'MEMBER_JOIN', 'MEMBER_LEAVE', 'MEMBER_REMOVE', 'MEMBER_ROLE_CHANGE', 'GROUP_COVER_UPDATE', 'GROUP_NAME_UPDATE', 'MEMBER_NICKNAME_CHANGE', 'GROUP_MONTH_COVER_UPDATE', 'GROUP_CREATE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "group_activity_logs" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "group_id" uuid NOT NULL, "type" "public"."group_activity_logs_type_enum" NOT NULL, "ref_id" uuid, "meta" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8c50b24149f85706a1971ef8510" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c1925e34bad1e2498116be7b14" ON "group_activity_logs" ("group_id", "created_at", "id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "group_activity_log_actors" ADD CONSTRAINT "FK_cf979ab129b5c65014f5cb3f737" FOREIGN KEY ("log_id") REFERENCES "group_activity_logs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_activity_log_actors" ADD CONSTRAINT "FK_1dcd16321ca624b206d091f3b43" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_activity_logs" ADD CONSTRAINT "FK_9872aab26f4e41f8d14a292ded1" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "group_activity_logs" DROP CONSTRAINT "FK_9872aab26f4e41f8d14a292ded1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_activity_log_actors" DROP CONSTRAINT "FK_1dcd16321ca624b206d091f3b43"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_activity_log_actors" DROP CONSTRAINT "FK_cf979ab129b5c65014f5cb3f737"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c1925e34bad1e2498116be7b14"`,
    );
    await queryRunner.query(`DROP TABLE "group_activity_logs"`);
    await queryRunner.query(
      `DROP TYPE "public"."group_activity_logs_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_66d7282ea03f25a1c2c95cb635"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cf979ab129b5c65014f5cb3f73"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1dcd16321ca624b206d091f3b4"`,
    );
    await queryRunner.query(`DROP TABLE "group_activity_log_actors"`);
  }
}
