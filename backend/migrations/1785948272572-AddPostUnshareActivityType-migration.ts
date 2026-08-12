import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostUnshareActivityType1785948272572 implements MigrationInterface {
  name = 'AddPostUnshareActivityType1785948272572';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."group_activity_logs_type_enum" RENAME TO "group_activity_logs_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."group_activity_logs_type_enum" AS ENUM('POST_COLLAB_START', 'POST_EDIT_START', 'POST_COLLAB_COMPLETE', 'POST_EDIT_COMPLETE', 'POST_CREATE', 'POST_UPDATE', 'POST_DELETE', 'POST_SHARE', 'POST_UNSHARE', 'MEMBER_JOIN', 'MEMBER_LEAVE', 'MEMBER_REMOVE', 'MEMBER_ROLE_CHANGE', 'GROUP_COVER_UPDATE', 'GROUP_NAME_UPDATE', 'MEMBER_NICKNAME_CHANGE', 'GROUP_MONTH_COVER_UPDATE', 'GROUP_CREATE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_activity_logs" ALTER COLUMN "type" TYPE "public"."group_activity_logs_type_enum" USING "type"::"text"::"public"."group_activity_logs_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."group_activity_logs_type_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "group_activity_logs" WHERE "type" = 'POST_UNSHARE'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."group_activity_logs_type_enum_old" AS ENUM('POST_COLLAB_START', 'POST_EDIT_START', 'POST_COLLAB_COMPLETE', 'POST_EDIT_COMPLETE', 'POST_CREATE', 'POST_UPDATE', 'POST_DELETE', 'POST_SHARE', 'MEMBER_JOIN', 'MEMBER_LEAVE', 'MEMBER_REMOVE', 'MEMBER_ROLE_CHANGE', 'GROUP_COVER_UPDATE', 'GROUP_NAME_UPDATE', 'MEMBER_NICKNAME_CHANGE', 'GROUP_MONTH_COVER_UPDATE', 'GROUP_CREATE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_activity_logs" ALTER COLUMN "type" TYPE "public"."group_activity_logs_type_enum_old" USING "type"::"text"::"public"."group_activity_logs_type_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."group_activity_logs_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."group_activity_logs_type_enum_old" RENAME TO "group_activity_logs_type_enum"`,
    );
  }
}
