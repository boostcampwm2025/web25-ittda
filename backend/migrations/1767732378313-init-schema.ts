import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1767732378313 implements MigrationInterface {
  name = 'InitSchema1767732378313';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "email" character varying NOT NULL, "nickname" character varying NOT NULL, "provider" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "groups" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "owner_id" uuid, CONSTRAINT "PK_659d1483316afb28afd3a90646e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."posts_templatetype_enum" AS ENUM('DIARY', 'MOVIE', 'MUSICAL', 'THEATER', 'TRAVEL', 'MEMO', 'ETC')`,
    );
    await queryRunner.query(
      `CREATE TABLE "posts" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "templateType" "public"."posts_templatetype_enum" NOT NULL, "title" character varying(200) NOT NULL, "content" text NOT NULL, "location" geometry(Point,4326), "visitedAt" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "authorId" uuid, "groupId" uuid, CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ddb43799b8e58d04404d3d533f" ON "posts" USING GiST ("location") `,
    );
    await queryRunner.query(
      `CREATE TABLE "trash" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "expiredAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "postId" uuid, CONSTRAINT "REL_d8851ee9918f1649ca8fb8be16" UNIQUE ("postId"), CONSTRAINT "PK_cbaebd47a9c109b81eb72e8004a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."folders_templatetype_enum" AS ENUM('DIARY', 'MOVIE', 'MUSICAL', 'THEATER', 'TRAVEL', 'MEMO', 'ETC')`,
    );
    await queryRunner.query(
      `CREATE TABLE "folders" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying NOT NULL, "templateType" "public"."folders_templatetype_enum" NOT NULL, "isDefault" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "ownerId" uuid, "groupId" uuid, CONSTRAINT "PK_8578bd31b0e7f6d6c2480dbbca8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" ADD CONSTRAINT "FK_5d7af25843377def343ab0beaa8" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_c5a322ad12a7bf95460c958e80e" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_d10acbe503da4c56853181efc98" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trash" ADD CONSTRAINT "FK_d8851ee9918f1649ca8fb8be165" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "folders" ADD CONSTRAINT "FK_6228242ce9f7a8f3aec9397c6a7" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "folders" ADD CONSTRAINT "FK_2d159800fa1dbf78ee3773134a8" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "folders" DROP CONSTRAINT "FK_2d159800fa1dbf78ee3773134a8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "folders" DROP CONSTRAINT "FK_6228242ce9f7a8f3aec9397c6a7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trash" DROP CONSTRAINT "FK_d8851ee9918f1649ca8fb8be165"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_d10acbe503da4c56853181efc98"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_c5a322ad12a7bf95460c958e80e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "groups" DROP CONSTRAINT "FK_5d7af25843377def343ab0beaa8"`,
    );
    await queryRunner.query(`DROP TABLE "folders"`);
    await queryRunner.query(`DROP TYPE "public"."folders_templatetype_enum"`);
    await queryRunner.query(`DROP TABLE "trash"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ddb43799b8e58d04404d3d533f"`,
    );
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`DROP TYPE "public"."posts_templatetype_enum"`);
    await queryRunner.query(`DROP TABLE "groups"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
