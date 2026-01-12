import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostAggregateSchema1768229076316 implements MigrationInterface {
  name = 'PostAggregateSchema1768229076316';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // posts.location에 걸린 GiST 인덱스 중, IDX_posts_location_gist가 아닌 것들은 제거
    await queryRunner.query(`
    DO $$
    DECLARE r RECORD;
    BEGIN
      FOR r IN
        SELECT i.relname AS index_name
        FROM pg_index x
        JOIN pg_class t ON t.oid = x.indrelid
        JOIN pg_class i ON i.oid = x.indexrelid
        JOIN pg_am am ON am.oid = i.relam
        JOIN pg_attribute a ON a.attrelid = t.oid
        WHERE t.relname = 'posts'
          AND am.amname = 'gist'
          AND a.attname = 'location'
          AND x.indkey::text LIKE '%' || a.attnum || '%'
          AND i.relname <> 'IDX_posts_location_gist'
      LOOP
        EXECUTE format('DROP INDEX IF EXISTS public.%I', r.index_name);
      END LOOP;
    END;
    $$;
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_posts_location_gist" ON "posts" USING GiST ("location");`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."post_blocks_type_enum" AS ENUM('TITLE', 'DATE', 'TIME', 'TEXT', 'MOOD', 'TAG', 'RATING', 'LOCATION', 'IMAGE', 'TABLE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "post_blocks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "post_id" uuid NOT NULL, "type" "public"."post_blocks_type_enum" NOT NULL, "value" jsonb NOT NULL, "layout_row" integer NOT NULL, "layout_col" integer NOT NULL, "layout_span" integer NOT NULL DEFAULT '1', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_85429a65a405fe550c8867bf307" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`
      ALTER TABLE "post_blocks"
        ADD CONSTRAINT "uq_post_blocks_start_cell"
        UNIQUE ("post_id", "layout_row", "layout_col")
        DEFERRABLE INITIALLY DEFERRED;
    `);
    await queryRunner.query(
      `CREATE TABLE "media_assets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner_user_id" uuid NOT NULL, "storage_key" character varying(512) NOT NULL, "url" character varying(1024), "mime_type" character varying(100), "size" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_ca47e9f67a5e5d8af1e75d66ee6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7928e5d784921ca2861e3ad5bd" ON "media_assets" ("owner_user_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."post_media_kind_enum" AS ENUM('THUMBNAIL', 'BLOCK')`,
    );
    await queryRunner.query(
      `CREATE TABLE "post_media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "post_id" uuid NOT NULL, "media_id" uuid NOT NULL, "kind" "public"."post_media_kind_enum" NOT NULL, "block_id" uuid, "sort_order" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_049edb1ce7ab3d2a98009b171d0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`
      ALTER TABLE "post_media"
        ADD CONSTRAINT "chk_post_media_kind"
        CHECK (
          (kind = 'THUMBNAIL' AND block_id IS NULL AND sort_order IS NULL)
          OR
          (kind = 'BLOCK' AND block_id IS NOT NULL AND sort_order IS NOT NULL)
        );
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_ed0212abde682557b6d10d4808" ON "post_media" ("post_id", "kind") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."post_contributors_role_enum" AS ENUM('AUTHOR', 'EDITOR', 'VIEWER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "post_contributors" ("post_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" "public"."post_contributors_role_enum" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b0b5a4c05e3922d33923b392037" PRIMARY KEY ("post_id", "user_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_blocks" ADD CONSTRAINT "FK_699802d5dc7dd71c15ad3c4258a" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" ADD CONSTRAINT "FK_7928e5d784921ca2861e3ad5bdc" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_media" ADD CONSTRAINT "FK_1eeb54a4fdfbe9db17899243cbe" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_media" ADD CONSTRAINT "FK_a759d9accb8e41ae25c357e5ed3" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_media" ADD CONSTRAINT "FK_b4395d7f851ea6c8cc34f802667" FOREIGN KEY ("block_id") REFERENCES "post_blocks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_contributors" ADD CONSTRAINT "FK_cb0ed522f2bb15a2ddc0721badf" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_contributors" ADD CONSTRAINT "FK_4a7e47e57acf7989e1da142326d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_post_media_block_sort" ON "post_media" ("block_id", "sort_order") WHERE kind = 'BLOCK';`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_post_media_thumbnail_per_post" ON "post_media" ("post_id") WHERE kind = 'THUMBNAIL';`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // post_media check constraint
    await queryRunner.query(
      `ALTER TABLE "post_media" DROP CONSTRAINT IF EXISTS "chk_post_media_kind";`,
    );

    // post_blocks deferrable unique constraint
    await queryRunner.query(
      `ALTER TABLE "post_blocks" DROP CONSTRAINT IF EXISTS "uq_post_blocks_start_cell";`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_contributors" DROP CONSTRAINT "FK_4a7e47e57acf7989e1da142326d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_contributors" DROP CONSTRAINT "FK_cb0ed522f2bb15a2ddc0721badf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_media" DROP CONSTRAINT "FK_b4395d7f851ea6c8cc34f802667"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_media" DROP CONSTRAINT "FK_a759d9accb8e41ae25c357e5ed3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_media" DROP CONSTRAINT "FK_1eeb54a4fdfbe9db17899243cbe"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media_assets" DROP CONSTRAINT "FK_7928e5d784921ca2861e3ad5bdc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_blocks" DROP CONSTRAINT "FK_699802d5dc7dd71c15ad3c4258a"`,
    );
    await queryRunner.query(`DROP TABLE "post_contributors"`);
    await queryRunner.query(`DROP TYPE "public"."post_contributors_role_enum"`);
    await queryRunner.query(`DROP TABLE "post_media"`);
    await queryRunner.query(`DROP TYPE "public"."post_media_kind_enum"`);
    await queryRunner.query(`DROP TABLE "media_assets"`);
    await queryRunner.query(`DROP TABLE "post_blocks"`);
    await queryRunner.query(`DROP TYPE "public"."post_blocks_type_enum"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_posts_location_gist";`,
    );
  }
}
