import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserGuestGroupEntities1768589247868 implements MigrationInterface {
  name = 'AddUserGuestGroupEntities1768589247868';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."uq_post_media_block_sort"`);
    await queryRunner.query(
      `DROP INDEX "public"."uq_post_media_thumbnail_per_post"`,
    );
    await queryRunner.query(
      `CREATE TABLE "guest_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7c077389b040139ae9487c1b03e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."group_invites_permission_enum" AS ENUM('ADMIN', 'EDITOR', 'VIEWER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "group_invites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "group_id" uuid NOT NULL, "permission" "public"."group_invites_permission_enum" NOT NULL DEFAULT 'VIEWER', "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_145bbc40f47d34c458ed6e9d96f" UNIQUE ("code"), CONSTRAINT "PK_ca736add48a2a0f2f7950e4ac9b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "revoked" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4542dd2f38a61354a040ba9fd57" UNIQUE ("token"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "profile_image_url" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "settings" jsonb NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TYPE "public"."post_blocks_type_enum" RENAME TO "post_blocks_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."post_blocks_type_enum" AS ENUM('DATE', 'TIME', 'TEXT', 'MOOD', 'TAG', 'RATING', 'LOCATION', 'IMAGE', 'TABLE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_blocks" ALTER COLUMN "type" TYPE "public"."post_blocks_type_enum" USING "type"::"text"::"public"."post_blocks_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."post_blocks_type_enum_old"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_posts_location_gist" ON "posts" USING GiST ("location") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d00d52b628ccbca8200c30be69" ON "post_blocks" ("post_id", "layout_row", "layout_col") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e067f8c9294df9c3ea668c055f" ON "post_media" ("block_id", "sort_order") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b0b5a4c05e3922d33923b39203" ON "post_contributors" ("post_id", "user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "group_invites" ADD CONSTRAINT "FK_74273612fc6076c533f12b9e6ba" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "group_invites" DROP CONSTRAINT "FK_74273612fc6076c533f12b9e6ba"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b0b5a4c05e3922d33923b39203"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e067f8c9294df9c3ea668c055f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d00d52b628ccbca8200c30be69"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_posts_location_gist"`);
    await queryRunner.query(
      `CREATE TYPE "public"."post_blocks_type_enum_old" AS ENUM('TITLE', 'DATE', 'TIME', 'TEXT', 'MOOD', 'TAG', 'RATING', 'LOCATION', 'IMAGE', 'TABLE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_blocks" ALTER COLUMN "type" TYPE "public"."post_blocks_type_enum_old" USING "type"::"text"::"public"."post_blocks_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."post_blocks_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."post_blocks_type_enum_old" RENAME TO "post_blocks_type_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "settings"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "profile_image_url"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "group_invites"`);
    await queryRunner.query(
      `DROP TYPE "public"."group_invites_permission_enum"`,
    );
    await queryRunner.query(`DROP TABLE "guest_sessions"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_post_media_thumbnail_per_post" ON "post_media" ("post_id") WHERE (kind = 'THUMBNAIL'::post_media_kind_enum)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_post_media_block_sort" ON "post_media" ("block_id", "sort_order") WHERE (kind = 'BLOCK'::post_media_kind_enum)`,
    );
  }
}
