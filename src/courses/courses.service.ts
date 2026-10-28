import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { COMMON_EXERCISE_FIELDS } from '../content/content-files';
import { Course } from '../content/entities/course.entity';
import { Exercise } from '../content/entities/exercise.entity';
import { Lesson } from '../content/entities/lesson.entity';
import { Unit } from '../content/entities/unit.entity';
import { LessonCompletion } from '../progress/entities/lesson-completion.entity';

export type LessonStatus = 'locked' | 'available' | 'completed';

export const LESSON_NOT_FOUND = 'Lição não encontrada';
export const LESSON_LOCKED = 'Lição bloqueada';

/** Lição na trilha do curso, já com status/estrelas do usuário. */
export interface TrackLesson {
  lesson: Lesson;
  unit: Unit;
  status: LessonStatus;
  stars: number;
}

@Injectable()
export class CoursesService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async listCourses(userId: string) {
    const courses = await this.dataSource.getRepository(Course).find({
      where: { active: true },
      order: { createdAt: 'ASC' },
    });

    return Promise.all(
      courses.map(async course => {
        const units = await this.activeUnits(course.id);
        const track = await this.track(course.id, userId);
        return {
          id: course.id,
          slug: course.slug,
          title: course.title,
          description: course.description,
          unitCount: units.length,
          lessonCount: track.length,
          completedLessons: track.filter(t => t.status === 'completed').length,
        };
      }),
    );
  }

  async getPath(slug: string, userId: string) {
    const course = await this.dataSource
      .getRepository(Course)
      .findOne({ where: { slug, active: true } });
    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    const units = await this.activeUnits(course.id);
    const track = await this.track(course.id, userId);
    const exerciseCounts = await this.exerciseCounts(
      track.map(t => t.lesson.id),
    );

    return {
      course: {
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description,
      },
      units: units.map(unit => ({
        id: unit.id,
        slug: unit.slug,
        title: unit.title,
        description: unit.description,
        color: unit.color,
        icon: unit.icon,
        order: unit.order,
        lessons: track
          .filter(t => t.unit.id === unit.id)
          .map(t => ({
            id: t.lesson.id,
            slug: t.lesson.slug,
            title: t.lesson.title,
            order: t.lesson.order,
            xp: t.lesson.xp,
            exerciseCount: exerciseCounts.get(t.lesson.id) ?? 0,
            status: t.status,
            stars: t.stars,
          })),
      })),
    };
  }

  async getLesson(id: string, userId: string) {
    const { current } = await this.locate(id, userId);
    if (current.status === 'locked') {
      throw new ForbiddenException(LESSON_LOCKED);
    }

    const exercises = await this.dataSource.getRepository(Exercise).find({
      where: { lessonId: id },
      order: { position: 'ASC' },
    });

    return {
      id: current.lesson.id,
      slug: current.lesson.slug,
      title: current.lesson.title,
      xp: current.lesson.xp,
      unit: {
        id: current.unit.id,
        title: current.unit.title,
        color: current.unit.color,
      },
      exercises: exercises.map(e => this.exerciseToResponse(e)),
    };
  }

  /**
   * Encontra a lição na trilha do curso dela. 404 se não existir/inativa.
   * `next` é a lição seguinte na trilha (ou null se for a última).
   */
  async locate(
    lessonId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<{ current: TrackLesson; next: TrackLesson | null }> {
    const m = manager ?? this.dataSource.manager;
    const lesson = await m.getRepository(Lesson).findOne({
      where: { id: lessonId, active: true },
      relations: { unit: { course: true } },
    });
    if (!lesson || !lesson.unit.active || !lesson.unit.course.active) {
      throw new NotFoundException(LESSON_NOT_FOUND);
    }

    const track = await this.track(lesson.unit.courseId, userId, m);
    const index = track.findIndex(t => t.lesson.id === lessonId);
    if (index < 0) {
      throw new NotFoundException(LESSON_NOT_FOUND);
    }
    return { current: track[index], next: track[index + 1] ?? null };
  }

  /**
   * Trilha do curso em ordem (unidade.order, lição.order). Regra: concluída se
   * houver conclusão; disponível se for a 1ª ou a anterior estiver concluída;
   * senão bloqueada.
   */
  async track(
    courseId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<TrackLesson[]> {
    const m = manager ?? this.dataSource.manager;
    const lessons = await m
      .getRepository(Lesson)
      .createQueryBuilder('l')
      .innerJoinAndSelect('l.unit', 'u')
      .where('u.courseId = :courseId', { courseId })
      .andWhere('u.active = true')
      .andWhere('l.active = true')
      .orderBy('u.order', 'ASC')
      .addOrderBy('l.order', 'ASC')
      .getMany();

    const completions = lessons.length
      ? await m
          .getRepository(LessonCompletion)
          .createQueryBuilder('c')
          .where('c.userId = :userId', { userId })
          .andWhere('c.lessonId IN (:...ids)', { ids: lessons.map(l => l.id) })
          .getMany()
      : [];
    const starsByLesson = new Map(
      completions.map(c => [c.lessonId, c.bestStars]),
    );

    let previousCompleted = true;
    return lessons.map(lesson => {
      const stars = starsByLesson.get(lesson.id);
      const status: LessonStatus =
        stars !== undefined
          ? 'completed'
          : previousCompleted
            ? 'available'
            : 'locked';
      previousCompleted = status === 'completed';
      return { lesson, unit: lesson.unit, status, stars: stars ?? 0 };
    });
  }

  private activeUnits(courseId: string): Promise<Unit[]> {
    return this.dataSource.getRepository(Unit).find({
      where: { courseId, active: true },
      order: { order: 'ASC' },
    });
  }

  private async exerciseCounts(lessonIds: string[]) {
    if (!lessonIds.length) return new Map<string, number>();
    const rows: { lessonId: string; count: string }[] = await this.dataSource
      .getRepository(Exercise)
      .createQueryBuilder('e')
      .select('e.lessonId', 'lessonId')
      .addSelect('COUNT(*)', 'count')
      .where('e.lessonId IN (:...lessonIds)', { lessonIds })
      .groupBy('e.lessonId')
      .getRawMany();
    return new Map(rows.map(r => [r.lessonId, Number(r.count)]));
  }

  /** `{ id, type, prompt, code?, ...campos do tipo, explanation }`. */
  private exerciseToResponse(e: Exercise) {
    const data = { ...e.data };
    for (const key of COMMON_EXERCISE_FIELDS) delete data[key];
    return {
      id: e.id,
      type: e.type,
      prompt: e.prompt,
      ...(e.code !== null ? { code: e.code } : {}),
      ...data,
      explanation: e.explanation,
    };
  }
}
