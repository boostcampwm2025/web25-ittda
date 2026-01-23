import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMonthCover1769137504036 implements MigrationInterface {
  name = 'AddMonthCover1769137504036';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_month_covers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "year" integer NOT NULL, "month" integer NOT NULL, "cover_media_asset_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_dce3a9df98b626dbb2a6438c2af" UNIQUE ("user_id", "year", "month"), CONSTRAINT "PK_f0f3e7428c2e5a0f900fdda6e6e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "nickname" TYPE character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_invites" ALTER COLUMN "expires_at" TYPE TIMESTAMPTZ USING "expires_at" AT TIME ZONE 'Asia/Seoul'`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ALTER COLUMN "expires_at" TYPE TIMESTAMPTZ USING "expires_at" AT TIME ZONE 'Asia/Seoul'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_9c126dfdc9977c5a43780494471" UNIQUE ("provider", "provider_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_month_covers" ADD CONSTRAINT "FK_c40abdb2af389c7f59c19d7f5b4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_month_covers" ADD CONSTRAINT "FK_0ac1e4b65a8c7066e5d10b8127f" FOREIGN KEY ("cover_media_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_month_covers" DROP CONSTRAINT "FK_0ac1e4b65a8c7066e5d10b8127f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_month_covers" DROP CONSTRAINT "FK_c40abdb2af389c7f59c19d7f5b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "nickname" TYPE character varying;`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_9c126dfdc9977c5a43780494471"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ALTER COLUMN "expires_at" TYPE TIMESTAMP USING "expires_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_invites" ALTER COLUMN "expires_at" TYPE TIMESTAMP USING "expires_at"`,
    );
    await queryRunner.query(`DROP TABLE "user_month_covers"`);
  }
}
