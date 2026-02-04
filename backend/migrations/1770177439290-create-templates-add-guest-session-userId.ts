import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTemplatesAddGuestSessionUserId1770177439290 implements MigrationInterface {
  name = 'CreateTemplatesAddGuestSessionUserId1770177439290';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."templates_scope_enum" AS ENUM('SYSTEM', 'ME', 'GROUP')`,
    );
    await queryRunner.query(
      `CREATE TABLE "templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(100) NOT NULL, "description" text, "scope" "public"."templates_scope_enum" NOT NULL, "owner_user_id" uuid, "group_id" uuid, "blocks" jsonb NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_515948649ce0bbbe391de702ae5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ca479017ddf61cd72db7962c96" ON "templates" ("scope") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fe2860d161c7a847d865f86b1b" ON "templates" ("owner_user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1968f4bdc5f062b1cf7ddd6504" ON "templates" ("group_id") `,
    );
    await queryRunner.query(`ALTER TABLE "guest_sessions" ADD "user_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "post_drafts" ALTER COLUMN "snapshot" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "templates" ADD CONSTRAINT "FK_fe2860d161c7a847d865f86b1bc" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "templates" ADD CONSTRAINT "FK_1968f4bdc5f062b1cf7ddd65043" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "templates" DROP CONSTRAINT "FK_1968f4bdc5f062b1cf7ddd65043"`,
    );
    await queryRunner.query(
      `ALTER TABLE "templates" DROP CONSTRAINT "FK_fe2860d161c7a847d865f86b1bc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_drafts" ALTER COLUMN "snapshot" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "guest_sessions" DROP COLUMN "user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1968f4bdc5f062b1cf7ddd6504"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fe2860d161c7a847d865f86b1b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ca479017ddf61cd72db7962c96"`,
    );
    await queryRunner.query(`DROP TABLE "templates"`);
    await queryRunner.query(`DROP TYPE "public"."templates_scope_enum"`);
  }
}
