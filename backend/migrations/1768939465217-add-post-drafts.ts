import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostDrafts1768939465217 implements MigrationInterface {
  name = 'AddPostDrafts1768939465217';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "post_drafts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "group_id" uuid NOT NULL, "owner_actor_id" uuid NOT NULL, "snapshot" jsonb NOT NULL DEFAULT '{}'::jsonb, "version" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7ede6ee50c70a8f7ced9d64e076" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_afa6cee0b190c2e318fb9c207d" ON "post_drafts" ("group_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_post_drafts_active_group" ON "post_drafts" ("group_id") WHERE is_active = true`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at" AT TIME ZONE 'Asia/Seoul'`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at" AT TIME ZONE 'Asia/Seoul'`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_invites" ALTER COLUMN "expires_at" TYPE TIMESTAMPTZ USING "expires_at" AT TIME ZONE 'Asia/Seoul'`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ALTER COLUMN "expires_at" TYPE TIMESTAMPTZ USING "expires_at" AT TIME ZONE 'Asia/Seoul'`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_drafts" ADD CONSTRAINT "FK_afa6cee0b190c2e318fb9c207d2" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_drafts" DROP CONSTRAINT "FK_afa6cee0b190c2e318fb9c207d2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ALTER COLUMN "expires_at" TYPE TIMESTAMP USING "expires_at" AT TIME ZONE 'Asia/Seoul'`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_invites" ALTER COLUMN "expires_at" TYPE TIMESTAMP USING "expires_at" AT TIME ZONE 'Asia/Seoul'`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" ALTER COLUMN "created_at" TYPE TIMESTAMP USING "created_at" AT TIME ZONE 'Asia/Seoul'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "created_at" TYPE TIMESTAMP USING "created_at" AT TIME ZONE 'Asia/Seoul'`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_afa6cee0b190c2e318fb9c207d"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_post_drafts_active_group"`,
    );
    await queryRunner.query(`DROP TABLE "post_drafts"`);
  }
}
