import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { DataSource, EntityManager, In, Not } from 'typeorm';
import {
  assertCourseFile,
  assertUnitFile,
  COMMON_EXERCISE_FIELDS,
  ExerciseFile,
  LessonFile,
  UnitFile,
} from './content-files';
import { Course } from './entities/course.entity';
import { Exercise } from './entities/exercise.entity';
import { Lesson } from './entities/lesson.entity';
import { Unit } from './entities/unit.entity';

/** Pasta de conteúdo: CONTENT_DIR ou <cwd>/content. */
export function resolveContentDir(): string {
  return process.env.CONTENT_DIR || join(process.cwd(), 'content');
}

/**
 * Sincroniza content/<curso>/*.json com o banco a cada boot (idempotente).
 *
 * - Upsert por slug: curso (slug), unidade (curso + slug), lição (slug).
 * - Exercício: identidade = lição + posição; campos do tipo em jsonb.
 * - Nada que tenha progresso é apagado: unidades/lições que saíram do conteúdo
 *   (ou cujo arquivo ainda não existe) ficam `active = false` e somem da API.
 *   Só exercícios excedentes são removidos (não há progresso por exercício).
 */
@Injectable()
export class ContentSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ContentSyncService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.syncAll();
    } catch (err) {
      // Conteúdo quebrado não derruba a API: loga e segue com o que há no banco.
      this.logger.error(`Falha ao sincronizar conteúdo: ${String(err)}`);
    }
  }

  async syncAll(): Promise<void> {
    const dir = resolveContentDir();
    if (!existsSync(dir)) {
      this.logger.warn(`Pasta de conteúdo não encontrada: ${dir}`);
      return;
    }

    const courseDirs = readdirSync(dir).filter(
      name =>
        statSync(join(dir, name)).isDirectory() &&
        existsSync(join(dir, name, 'course.json')),
    );

    const syncedSlugs: string[] = [];
    let failed = false;
    for (const name of courseDirs) {
      try {
        const slug = await this.dataSource.transaction(manager =>
          this.syncCourse(join(dir, name), manager),
        );
        syncedSlugs.push(slug);
      } catch (err) {
        failed = true;
        this.logger.error(`Curso "${name}" não sincronizado: ${String(err)}`);
      }
    }

    // Cursos que sumiram de content/ ficam inativos (progresso preservado).
    if (!failed && syncedSlugs.length) {
      await this.dataSource
        .getRepository(Course)
        .update({ slug: Not(In(syncedSlugs)) }, { active: false });
    }
  }

  private async syncCourse(
    dir: string,
    manager: EntityManager,
  ): Promise<string> {
    const raw: unknown = JSON.parse(
      readFileSync(join(dir, 'course.json'), 'utf8'),
    );
    assertCourseFile(raw);

    const courseRepo = manager.getRepository(Course);
    let course = await courseRepo.findOne({ where: { slug: raw.slug } });
    course = courseRepo.merge(course ?? courseRepo.create(), {
      slug: raw.slug,
      title: raw.title,
      description: raw.description ?? '',
      active: true,
    });
    course = await courseRepo.save(course);

    const activeUnitIds: string[] = [];
    const activeLessonIds: string[] = [];
    let lessonCount = 0;
    let exerciseCount = 0;

    for (const [index, unitName] of raw.units.entries()) {
      const file = join(dir, `${unitName}.json`);
      if (!existsSync(file)) {
        this.logger.warn(
          `[${raw.slug}] unidade "${unitName}" sem arquivo (${file}); ignorada`,
        );
        continue;
      }

      let unitFile: UnitFile;
      try {
        const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
        assertUnitFile(parsed);
        unitFile = parsed;
      } catch (err) {
        this.logger.warn(
          `[${raw.slug}] unidade "${unitName}" inválida; ignorada: ${String(err)}`,
        );
        continue;
      }

      const unit = await this.upsertUnit(manager, course, unitFile, index + 1);
      activeUnitIds.push(unit.id);

      for (const [lessonIndex, lessonFile] of unitFile.lessons.entries()) {
        const lesson = await this.upsertLesson(
          manager,
          unit,
          lessonFile,
          lessonIndex + 1,
        );
        activeLessonIds.push(lesson.id);
        lessonCount++;
        exerciseCount += await this.syncExercises(
          manager,
          lesson,
          lessonFile.exercises,
        );
      }
    }

    // Desativa (sem apagar) o que não está mais no conteúdo deste curso.
    await manager.getRepository(Unit).update(
      {
        courseId: course.id,
        ...(activeUnitIds.length ? { id: Not(In(activeUnitIds)) } : {}),
      },
      { active: false },
    );
    const courseUnitIds = (
      await manager
        .getRepository(Unit)
        .find({ where: { courseId: course.id }, select: { id: true } })
    ).map(u => u.id);
    if (courseUnitIds.length) {
      await manager.getRepository(Lesson).update(
        {
          unitId: In(courseUnitIds),
          ...(activeLessonIds.length ? { id: Not(In(activeLessonIds)) } : {}),
        },
        { active: false },
      );
    }

    this.logger.log(
      `[${raw.slug}] conteúdo sincronizado: ${activeUnitIds.length}/${raw.units.length} unidades, ${lessonCount} lições, ${exerciseCount} exercícios`,
    );
    return course.slug;
  }

  private async upsertUnit(
    manager: EntityManager,
    course: Course,
    file: UnitFile,
    order: number,
  ): Promise<Unit> {
    const repo = manager.getRepository(Unit);
    const existing = await repo.findOne({
      where: { courseId: course.id, slug: file.slug },
    });
    return repo.save(
      repo.merge(existing ?? repo.create(), {
        courseId: course.id,
        slug: file.slug,
        title: file.title,
        description: file.description ?? '',
        color: file.color ?? '#58CC02',
        icon: file.icon ?? 'book',
        order,
        active: true,
      }),
    );
  }

  private async upsertLesson(
    manager: EntityManager,
    unit: Unit,
    file: LessonFile,
    order: number,
  ): Promise<Lesson> {
    const repo = manager.getRepository(Lesson);
    const existing = await repo.findOne({ where: { slug: file.slug } });
    return repo.save(
      repo.merge(existing ?? repo.create(), {
        unitId: unit.id,
        slug: file.slug,
        title: file.title,
        order,
        xp: typeof file.xp === 'number' ? file.xp : 10,
        active: true,
      }),
    );
  }

  private async syncExercises(
    manager: EntityManager,
    lesson: Lesson,
    files: ExerciseFile[],
  ): Promise<number> {
    const repo = manager.getRepository(Exercise);
    const existing = await repo.find({ where: { lessonId: lesson.id } });
    const byPosition = new Map(existing.map(e => [e.position, e]));

    const toSave = files.map((file, i) => {
      const position = i + 1;
      const data: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(file)) {
        if (!COMMON_EXERCISE_FIELDS.includes(key)) data[key] = value;
      }
      return repo.merge(byPosition.get(position) ?? repo.create(), {
        lessonId: lesson.id,
        position,
        type: file.type,
        prompt: file.prompt,
        explanation: file.explanation ?? '',
        code: typeof file.code === 'string' ? file.code : null,
        data,
      });
    });
    await repo.save(toSave);

    const stale = existing.filter(e => e.position > files.length);
    if (stale.length) {
      await repo.remove(stale);
    }
    return files.length;
  }
}
