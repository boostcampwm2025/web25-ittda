import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserMonthCover1768877204024 implements MigrationInterface {
  name = 'AddUserMonthCover1768877204024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_media" DROP CONSTRAINT "chk_post_media_kind"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_blocks" DROP CONSTRAINT "uq_post_blocks_start_cell"`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_month_covers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "year" integer NOT NULL, "month" integer NOT NULL, "cover_url" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_dce3a9df98b626dbb2a6438c2af" UNIQUE ("user_id", "year", "month"), CONSTRAINT "PK_f0f3e7428c2e5a0f900fdda6e6e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "nickname"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "nickname" character varying(50)`,
    );
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "emotion"`);
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "emotion" character varying(5)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_ae9a93b13bce1425823c8ecd074" UNIQUE ("provider", "providerId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_month_covers" ADD CONSTRAINT "FK_c40abdb2af389c7f59c19d7f5b4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_month_covers" DROP CONSTRAINT "FK_c40abdb2af389c7f59c19d7f5b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_ae9a93b13bce1425823c8ecd074"`,
    );
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "emotion"`);
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "emotion" character varying(20)`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "nickname"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "nickname" character varying NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "user_month_covers"`);
    await queryRunner.query(
      `ALTER TABLE "post_blocks" ADD CONSTRAINT "uq_post_blocks_start_cell" UNIQUE ("post_id", "layout_row", "layout_col")`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_media" ADD CONSTRAINT "chk_post_media_kind" CHECK ((((kind = 'THUMBNAIL'::post_media_kind_enum) AND (block_id IS NULL) AND (sort_order IS NULL)) OR ((kind = 'BLOCK'::post_media_kind_enum) AND (block_id IS NOT NULL) AND (sort_order IS NOT NULL))))`,
    );
  }
}
