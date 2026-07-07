import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupMemberNotificationMuted1783398050652 implements MigrationInterface {
  name = 'AddGroupMemberNotificationMuted1783398050652';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD COLUMN IF NOT EXISTS "notification_muted" BOOLEAN NOT NULL DEFAULT FALSE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "group_members" DROP COLUMN IF EXISTS "notification_muted"`,
    );
  }
}
