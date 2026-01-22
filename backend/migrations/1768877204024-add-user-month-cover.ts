import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserMonthCover1768877204024 implements MigrationInterface {
  name = 'AddUserMonthCover1768877204024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 기존 제약 조건 제거 [cite: 54]
    await queryRunner.query(
      `ALTER TABLE "post_media" DROP CONSTRAINT "chk_post_media_kind"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_blocks" DROP CONSTRAINT "uq_post_blocks_start_cell"`,
    );

    // 2. 신규 테이블 생성 [cite: 54]
    await queryRunner.query(
      `CREATE TABLE "user_month_covers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "year" integer NOT NULL, "month" integer NOT NULL, "cover_url" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_dce3a9df98b626dbb2a6438c2af" UNIQUE ("user_id", "year", "month"), CONSTRAINT "PK_f0f3e7428c2e5a0f900fdda6e6e" PRIMARY KEY ("id"))`,
    );

    // 3. Users 테이블 수정: nickname 길이 제한 추가 [cite: 54]
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "nickname" TYPE character varying(50);`,
    );

    // 4. Users 테이블 수정: 유니크 제약 조건 추가 (컬럼명 provider_id로 수정)
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_ae9a93b13bce1425823c8ecd074" UNIQUE ("provider", "provider_id")`,
    );

    // 5. 외래키 설정
    await queryRunner.query(
      `ALTER TABLE "user_month_covers" ADD CONSTRAINT "FK_c40abdb2af389c7f59c19d7f5b4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. 외래키 및 유니크 제약 조건 제거
    await queryRunner.query(
      `ALTER TABLE "user_month_covers" DROP CONSTRAINT "FK_c40abdb2af389c7f59c19d7f5b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_ae9a93b13bce1425823c8ecd074"`,
    );

    // 2. Users 테이블 nickname 복구 (기존 character varying으로 회귀) [cite: 3]
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "nickname" TYPE character varying;`,
    );

    // 3. 테이블 삭제
    await queryRunner.query(`DROP TABLE "user_month_covers"`);

    // 4. up에서 제거했던 제약 조건 복구 (필요 시) [cite: 16, 19]
    await queryRunner.query(
      `ALTER TABLE "post_media" ADD CONSTRAINT "chk_post_media_kind" CHECK ((kind = 'THUMBNAIL' AND block_id IS NULL AND sort_order IS NULL) OR (kind = 'BLOCK' AND block_id IS NOT NULL AND sort_order IS NOT NULL))`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_blocks" ADD CONSTRAINT "uq_post_blocks_start_cell" UNIQUE ("post_id", "layout_row", "layout_col")`,
    );
  }
}
