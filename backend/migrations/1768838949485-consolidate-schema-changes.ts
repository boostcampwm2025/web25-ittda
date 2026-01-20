import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsolidateSchemaChanges1768838949485 implements MigrationInterface {
  name = 'ConsolidateSchemaChanges1768838949485';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop outdated indexes on old column names
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_add066edd974dc5f321761f3e1"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_013223b1c556c9345e31004747"`,
    );

    // Users: rename columns, swap profile image column
    await queryRunner.query(
      `DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'users'
            AND column_name = 'providerId'
        ) THEN
          ALTER TABLE "users" RENAME COLUMN "providerId" TO "provider_id";
        END IF;
      END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'users'
            AND column_name = 'createdAt'
        ) THEN
          ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";
        END IF;
      END $$;`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "profile_image_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_image_id" uuid`,
    );

    // Groups: add cover fields and normalize created_at
    await queryRunner.query(
      `ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "cover_media_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "cover_source_post_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "last_activity_at" TIMESTAMPTZ`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'groups'
            AND column_name = 'createdAt'
        ) THEN
          ALTER TABLE "groups" RENAME COLUMN "createdAt" TO "created_at";
        END IF;
      END $$;`,
    );

    // Guest sessions: normalize timestamp column names/types
    await queryRunner.query(
      `DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'guest_sessions'
            AND column_name = 'expiresAt'
        ) THEN
          ALTER TABLE "guest_sessions" RENAME COLUMN "expiresAt" TO "expires_at";
        END IF;
      END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'guest_sessions'
            AND column_name = 'createdAt'
        ) THEN
          ALTER TABLE "guest_sessions" RENAME COLUMN "createdAt" TO "created_at";
        END IF;
      END $$;`,
    );
    await queryRunner.query(
      `ALTER TABLE "guest_sessions" ALTER COLUMN "expires_at" TYPE TIMESTAMPTZ USING "expires_at"::timestamptz`,
    );
    await queryRunner.query(
      `ALTER TABLE "guest_sessions" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at"::timestamptz`,
    );

    // Group members: rename joinedAt, add profile/nickname/read tracking
    await queryRunner.query(
      `DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'group_members'
            AND column_name = 'joinedAt'
        ) THEN
          ALTER TABLE "group_members" RENAME COLUMN "joinedAt" TO "joined_at";
        END IF;
      END $$;`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD COLUMN IF NOT EXISTS "nickname_in_group" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD COLUMN IF NOT EXISTS "profile_media_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD COLUMN IF NOT EXISTS "last_read_at" TIMESTAMPTZ`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" ALTER COLUMN "joined_at" TYPE TIMESTAMPTZ USING "joined_at"::timestamptz`,
    );

    // Group invites: normalize timestamp column names/types
    await queryRunner.query(
      `DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'group_invites'
            AND column_name = 'expiresAt'
        ) THEN
          ALTER TABLE "group_invites" RENAME COLUMN "expiresAt" TO "expires_at";
        END IF;
      END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'group_invites'
            AND column_name = 'createdAt'
        ) THEN
          ALTER TABLE "group_invites" RENAME COLUMN "createdAt" TO "created_at";
        END IF;
      END $$;`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_invites" ALTER COLUMN "expires_at" TYPE TIMESTAMPTZ USING "expires_at"::timestamptz`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_invites" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at"::timestamptz`,
    );

    // Refresh tokens: normalize timestamp column names/types
    await queryRunner.query(
      `DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'refresh_tokens'
            AND column_name = 'userId'
        ) THEN
          ALTER TABLE "refresh_tokens" RENAME COLUMN "userId" TO "user_id";
        END IF;
      END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'refresh_tokens'
            AND column_name = 'expiresAt'
        ) THEN
          ALTER TABLE "refresh_tokens" RENAME COLUMN "expiresAt" TO "expires_at";
        END IF;
      END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'refresh_tokens'
            AND column_name = 'createdAt'
        ) THEN
          ALTER TABLE "refresh_tokens" RENAME COLUMN "createdAt" TO "created_at";
        END IF;
      END $$;`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ALTER COLUMN "expires_at" TYPE TIMESTAMPTZ USING "expires_at"::timestamptz`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at"::timestamptz`,
    );

    // Posts: shrink emotion length
    await queryRunner.query(
      `ALTER TABLE "posts" ALTER COLUMN "emotion" TYPE character varying(5)`,
    );

    // Drop legacy folders table
    await queryRunner.query(`DROP TABLE IF EXISTS "folders"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."folders_templatetype_enum"`,
    );

    // Post blocks: add MEDIA enum value
    await queryRunner.query(
      `ALTER TYPE "public"."post_blocks_type_enum" ADD VALUE IF NOT EXISTS 'MEDIA'`,
    );

    // New index on group members
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ae1fba173c2d8ad58aee57197a" ON "group_members" ("user_id", "joined_at")`,
    );

    // Foreign keys
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_96d6f1aafc327443850f263cd50" FOREIGN KEY ("profile_image_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" ADD CONSTRAINT "FK_b92fa5150a08a97def6667c5558" FOREIGN KEY ("cover_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" ADD CONSTRAINT "FK_382db8d83ce0a79246141499239" FOREIGN KEY ("cover_source_post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD CONSTRAINT "FK_207da59dd9525299ba630e342d0" FOREIGN KEY ("profile_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "group_members" DROP CONSTRAINT "FK_207da59dd9525299ba630e342d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" DROP CONSTRAINT "FK_382db8d83ce0a79246141499239"`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" DROP CONSTRAINT "FK_b92fa5150a08a97def6667c5558"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_96d6f1aafc327443850f263cd50"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ae1fba173c2d8ad58aee57197a"`,
    );

    await queryRunner.query(
      `ALTER TABLE "posts" ALTER COLUMN "emotion" TYPE character varying(20)`,
    );

    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ALTER COLUMN "created_at" TYPE TIMESTAMP USING "created_at"::timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ALTER COLUMN "expires_at" TYPE TIMESTAMP USING "expires_at"::timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" RENAME COLUMN "created_at" TO "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" RENAME COLUMN "expires_at" TO "expiresAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" RENAME COLUMN "user_id" TO "userId"`,
    );

    await queryRunner.query(
      `ALTER TABLE "group_invites" ALTER COLUMN "created_at" TYPE TIMESTAMP USING "created_at"::timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_invites" ALTER COLUMN "expires_at" TYPE TIMESTAMP USING "expires_at"::timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_invites" RENAME COLUMN "created_at" TO "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_invites" RENAME COLUMN "expires_at" TO "expiresAt"`,
    );

    await queryRunner.query(
      `ALTER TABLE "group_members" ALTER COLUMN "joined_at" TYPE TIMESTAMP USING "joined_at"::timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" DROP COLUMN IF EXISTS "last_read_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" DROP COLUMN IF EXISTS "profile_media_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" DROP COLUMN IF EXISTS "nickname_in_group"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" RENAME COLUMN "joined_at" TO "joinedAt"`,
    );

    await queryRunner.query(
      `ALTER TABLE "guest_sessions" ALTER COLUMN "created_at" TYPE TIMESTAMP USING "created_at"::timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "guest_sessions" ALTER COLUMN "expires_at" TYPE TIMESTAMP USING "expires_at"::timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "guest_sessions" RENAME COLUMN "created_at" TO "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "guest_sessions" RENAME COLUMN "expires_at" TO "expiresAt"`,
    );

    await queryRunner.query(
      `ALTER TABLE "groups" DROP COLUMN IF EXISTS "last_activity_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" DROP COLUMN IF EXISTS "cover_source_post_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" DROP COLUMN IF EXISTS "cover_media_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" RENAME COLUMN "created_at" TO "createdAt"`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "profile_image_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_image_url" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "created_at" TO "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "provider_id" TO "providerId"`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."folders_templatetype_enum" AS ENUM('DIARY', 'MOVIE', 'MUSICAL', 'THEATER', 'TRAVEL', 'MEMO', 'ETC')`,
    );
    await queryRunner.query(
      `CREATE TABLE "folders" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying NOT NULL, "templateType" "public"."folders_templatetype_enum" NOT NULL, "isDefault" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "ownerId" uuid, "groupId" uuid, CONSTRAINT "PK_8578bd31b0e7f6d6c2480dbbca8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "folders" ADD CONSTRAINT "FK_6228242ce9f7a8f3aec9397c6a7" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "folders" ADD CONSTRAINT "FK_2d159800fa1dbf78ee3773134a8" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
