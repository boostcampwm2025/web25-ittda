import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterGroupMemberMigration1768292307230 implements MigrationInterface {
  name = 'AlterGroupMemberMigration1768292307230';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_posts_location_gist"`);
    await queryRunner.query(
      `CREATE TYPE "public"."group_members_role_enum" AS ENUM('ADMIN', 'EDITOR', 'VIEWER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "group_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "group_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" "public"."group_members_role_enum" NOT NULL, "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f5939ee0ad233ad35e03f5c65c1" UNIQUE ("group_id", "user_id"), CONSTRAINT "PK_86446139b2c96bfd0f3b8638852" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2c840df5db52dc6b4a1b0b69c6" ON "group_members" ("group_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_20a555b299f75843aa53ff8b0e" ON "group_members" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_013223b1c556c9345e31004747" ON "group_members" ("group_id", "role") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_add066edd974dc5f321761f3e1" ON "group_members" ("user_id", "joinedAt") `,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD CONSTRAINT "FK_2c840df5db52dc6b4a1b0b69c6e" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD CONSTRAINT "FK_20a555b299f75843aa53ff8b0ee" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "group_members" DROP CONSTRAINT "FK_20a555b299f75843aa53ff8b0ee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" DROP CONSTRAINT "FK_2c840df5db52dc6b4a1b0b69c6e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_add066edd974dc5f321761f3e1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_013223b1c556c9345e31004747"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_20a555b299f75843aa53ff8b0e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2c840df5db52dc6b4a1b0b69c6"`,
    );
    await queryRunner.query(`DROP TABLE "group_members"`);
    await queryRunner.query(`DROP TYPE "public"."group_members_role_enum"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_posts_location_gist" ON "posts" USING GiST ("location") `,
    );
  }
}
