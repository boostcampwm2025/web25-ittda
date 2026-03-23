import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterInquiriesRenameTitleToCategory1770600001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // title → category 컬럼명 변경
    await queryRunner.query(
      `ALTER TABLE "inquiries" RENAME COLUMN "title" TO "category"`,
    );

    // category 길이 조정 (200 → 100)
    await queryRunner.query(
      `ALTER TABLE "inquiries" ALTER COLUMN "category" TYPE varchar(100)`,
    );

    // email nullable로 변경
    await queryRunner.query(
      `ALTER TABLE "inquiries" ALTER COLUMN "email" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inquiries" ALTER COLUMN "email" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "inquiries" ALTER COLUMN "category" TYPE varchar(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "inquiries" RENAME COLUMN "category" TO "title"`,
    );
  }
}
