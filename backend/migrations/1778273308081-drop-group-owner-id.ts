import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropGroupOwnerId1778273308081 implements MigrationInterface {
  name = 'DropGroupOwnerId1778273308081';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "groups" DROP CONSTRAINT "FK_5d7af25843377def343ab0beaa8"`,
    );
    await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "owner_id"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "groups" ADD "owner_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "groups" ADD CONSTRAINT "FK_5d7af25843377def343ab0beaa8" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
