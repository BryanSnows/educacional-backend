import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1793152914204 implements MigrationInterface {
  name = 'InitialSchema1793152914204';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "xp" integer NOT NULL DEFAULT '0', "dailyGoal" integer NOT NULL DEFAULT '30', "streak" integer NOT NULL DEFAULT '0', "longestStreak" integer NOT NULL DEFAULT '0', "lastActiveDate" date, "hearts" integer NOT NULL DEFAULT '5', "heartsUpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "gems" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "exercises" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lessonId" uuid NOT NULL, "position" integer NOT NULL, "type" character varying NOT NULL, "prompt" text NOT NULL, "explanation" text NOT NULL DEFAULT '', "code" text, "data" jsonb NOT NULL DEFAULT '{}'::jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_exercises_lesson_position" UNIQUE ("lessonId", "position"), CONSTRAINT "PK_c4c46f5fa89a58ba7c2d894e3c3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "courses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL DEFAULT '', "active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_a3bb2d01cfa0f95bc5e034e1b7a" UNIQUE ("slug"), CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "units" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "courseId" uuid NOT NULL, "slug" character varying NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL DEFAULT '', "color" character varying NOT NULL DEFAULT '#58CC02', "icon" character varying NOT NULL DEFAULT 'book', "order" integer NOT NULL, "active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_units_course_slug" UNIQUE ("courseId", "slug"), CONSTRAINT "PK_5a8f2f064919b587d93936cb223" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lessons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "unitId" uuid NOT NULL, "title" character varying NOT NULL, "order" integer NOT NULL, "xp" integer NOT NULL DEFAULT '10', "active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_ca2edfa23c965f9c435572a7de3" UNIQUE ("slug"), CONSTRAINT "PK_9b9a8d455cac672d262d7275730" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lesson_completions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "lessonId" uuid NOT NULL, "bestStars" integer NOT NULL, "timesCompleted" integer NOT NULL DEFAULT '1', "completedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_lesson_completions_user_lesson" UNIQUE ("userId", "lessonId"), CONSTRAINT "PK_2e5c1e7d0882eafd013035f5430" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "xp_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "amount" integer NOT NULL, "source" character varying NOT NULL, "lessonId" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ff53781040f34f17bddeae20f4a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_xp_events_user_created" ON "xp_events" ("userId", "createdAt") `,
    );
    await queryRunner.query(
      `ALTER TABLE "exercises" ADD CONSTRAINT "FK_c7a7b90ae6ce91a6d8bcf09b8b6" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "units" ADD CONSTRAINT "FK_488039d526ad82da05a60e93556" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" ADD CONSTRAINT "FK_7c9fe457707c44ae26910acf6c5" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_completions" ADD CONSTRAINT "FK_fdac229c4cbdebdd482a3854a9e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_completions" ADD CONSTRAINT "FK_5241b14081904537154f16b15dc" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "xp_events" ADD CONSTRAINT "FK_d7d5db2dd3dfba0528230372dd4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "xp_events" ADD CONSTRAINT "FK_74c267eaf041eff504d760944db" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "xp_events" DROP CONSTRAINT "FK_74c267eaf041eff504d760944db"`,
    );
    await queryRunner.query(
      `ALTER TABLE "xp_events" DROP CONSTRAINT "FK_d7d5db2dd3dfba0528230372dd4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_completions" DROP CONSTRAINT "FK_5241b14081904537154f16b15dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_completions" DROP CONSTRAINT "FK_fdac229c4cbdebdd482a3854a9e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lessons" DROP CONSTRAINT "FK_7c9fe457707c44ae26910acf6c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "units" DROP CONSTRAINT "FK_488039d526ad82da05a60e93556"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exercises" DROP CONSTRAINT "FK_c7a7b90ae6ce91a6d8bcf09b8b6"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_xp_events_user_created"`);
    await queryRunner.query(`DROP TABLE "xp_events"`);
    await queryRunner.query(`DROP TABLE "lesson_completions"`);
    await queryRunner.query(`DROP TABLE "lessons"`);
    await queryRunner.query(`DROP TABLE "units"`);
    await queryRunner.query(`DROP TABLE "courses"`);
    await queryRunner.query(`DROP TABLE "exercises"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
