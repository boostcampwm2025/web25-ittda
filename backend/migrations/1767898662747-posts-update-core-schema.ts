import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostsUpdateCoreSchema1767898662747 implements MigrationInterface {
  name = 'PostsUpdateCoreSchema1767898662747';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_d10acbe503da4c56853181efc98"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_c5a322ad12a7bf95460c958e80e"`,
    );
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "templateType"`);
    await queryRunner.query(`DROP TYPE "public"."posts_templatetype_enum"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "groupId"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "authorId"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "visitedAt"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "content"`);
    await queryRunner.query(
      `CREATE TYPE "public"."posts_scope_enum" AS ENUM('PERSONAL', 'GROUP')`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "scope" "public"."posts_scope_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "owner_user_id" uuid NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "posts" ADD "group_id" uuid`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "tags" text array`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "rating" smallint`);
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "event_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b55cce1536ebe75be12a98d90e" ON "posts" ("owner_user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7628aa3741a30d6217271a226c" ON "posts" ("group_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b578b8b1393e83a3e4a9e79b49" ON "posts" ("event_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_b55cce1536ebe75be12a98d90eb" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_7628aa3741a30d6217271a226cf" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_posts_location_gist" ON "posts" USING GiST ("location")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_7628aa3741a30d6217271a226cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_b55cce1536ebe75be12a98d90eb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b578b8b1393e83a3e4a9e79b49"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7628aa3741a30d6217271a226c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b55cce1536ebe75be12a98d90e"`,
    );
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "event_at"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "rating"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "tags"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "group_id"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "owner_user_id"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "scope"`);
    await queryRunner.query(`DROP TYPE "public"."posts_scope_enum"`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "content" text NOT NULL`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "visitedAt" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "posts" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "authorId" uuid`);
    await queryRunner.query(`ALTER TABLE "posts" ADD "groupId" uuid`);
    await queryRunner.query(
      `CREATE TYPE "public"."posts_templatetype_enum" AS ENUM('DIARY', 'MOVIE', 'MUSICAL', 'THEATER', 'TRAVEL', 'MEMO', 'ETC')`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "templateType" "public"."posts_templatetype_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_c5a322ad12a7bf95460c958e80e" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_d10acbe503da4c56853181efc98" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_posts_location_gist"`);
  }
}
