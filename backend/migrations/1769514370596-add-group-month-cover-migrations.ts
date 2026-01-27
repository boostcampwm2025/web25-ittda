import { MigrationInterface, QueryRunner } from 'typeorm';

export class GroupMonthCover1769514370596 implements MigrationInterface {
  name = 'GroupMonthCover17695143705961769514370596';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. group_month_covers 테이블 생성
    await queryRunner.query(
      `CREATE TABLE "group_month_covers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "group_id" uuid NOT NULL, "year" integer NOT NULL, "month" integer NOT NULL, "cover_media_asset_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1721e2b6392d38edb6b32a7d53b" UNIQUE ("group_id", "year", "month"), CONSTRAINT "PK_dc2dde92d65d15ce5c12fc9a5a4" PRIMARY KEY ("id"))`,
    );
    // 2. media_assets 컬럼 추가
    await queryRunner.query(`ALTER TABLE "media_assets" ADD "width" integer`);
    await queryRunner.query(`ALTER TABLE "media_assets" ADD "height" integer`);
    // 3. group_members 컬럼 추가
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    // 4. group_invites 컬럼 타입 변경 (Drop 후 Re-add)
    await queryRunner.query(
      `ALTER TABLE "group_invites" DROP COLUMN "expires_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_invites" ADD "expires_at" TIMESTAMP NOT NULL`,
    );
    // 5. post_drafts 기본값 변경
    await queryRunner.query(
      `ALTER TABLE "post_drafts" ALTER COLUMN "snapshot" SET DEFAULT '{}'::jsonb`,
    );
    // 6. 외래키 제약조건 추가
    await queryRunner.query(
      `ALTER TABLE "group_month_covers" ADD CONSTRAINT "FK_4275491a1a4b408c52a312bfcbf" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_month_covers" ADD CONSTRAINT "FK_ce3314a26d74909c7b670c21bcd" FOREIGN KEY ("cover_media_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 6. 외래키 제약조건 제거 (역순)
    await queryRunner.query(
      `ALTER TABLE "group_month_covers" DROP CONSTRAINT "FK_ce3314a26d74909c7b670c21bcd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_month_covers" DROP CONSTRAINT "FK_4275491a1a4b408c52a312bfcbf"`,
    );
    // 5. post_drafts 기본값 원복
    await queryRunner.query(
      `ALTER TABLE "post_drafts" ALTER COLUMN "snapshot" SET DEFAULT '{}'`,
    );
    // 4. group_invites 컬럼 타입 원복 (Drop 후 Re-add)
    await queryRunner.query(
      `ALTER TABLE "group_invites" DROP COLUMN "expires_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_invites" ADD "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL`,
    );
    // 3. group_members 컬럼 제거
    await queryRunner.query(
      `ALTER TABLE "group_members" DROP COLUMN "updated_at"`,
    );
    // 2. media_assets 컬럼 제거
    await queryRunner.query(`ALTER TABLE "media_assets" DROP COLUMN "height"`);
    await queryRunner.query(`ALTER TABLE "media_assets" DROP COLUMN "width"`);
    // 1. group_month_covers 테이블 삭제
    await queryRunner.query(`DROP TABLE "group_month_covers"`);
  }
}
