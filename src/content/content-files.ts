import { EXERCISE_TYPES, ExerciseType } from './entities/exercise.entity';

/** Formato dos arquivos em content/<curso>/ (ver docs/CONTRATO.md). */
export interface CourseFile {
  slug: string;
  title: string;
  description?: string;
  units: string[];
}

export interface UnitFile {
  slug: string;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  lessons: LessonFile[];
}

export interface LessonFile {
  slug: string;
  title: string;
  xp?: number;
  exercises: ExerciseFile[];
}

export interface ExerciseFile {
  type: ExerciseType;
  prompt: string;
  explanation?: string;
  code?: string;
  [key: string]: unknown;
}

/** Campos comuns; o resto vai para a coluna jsonb `data`. */
export const COMMON_EXERCISE_FIELDS = ['type', 'prompt', 'explanation', 'code'];

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0;

export function assertCourseFile(v: unknown): asserts v is CourseFile {
  if (!isObj(v) || !isStr(v.slug) || !isStr(v.title)) {
    throw new Error('course.json precisa de slug e title');
  }
  if (!Array.isArray(v.units) || !v.units.every(isStr)) {
    throw new Error('course.json: units deve ser uma lista de nomes');
  }
}

export function assertUnitFile(v: unknown): asserts v is UnitFile {
  if (!isObj(v) || !isStr(v.slug) || !isStr(v.title)) {
    throw new Error('unidade precisa de slug e title');
  }
  if (!Array.isArray(v.lessons)) {
    throw new Error(`unidade ${v.slug}: lessons deve ser uma lista`);
  }
  const unitSlug = v.slug;
  v.lessons.forEach((lesson: unknown, i) => {
    if (!isObj(lesson) || !isStr(lesson.slug) || !isStr(lesson.title)) {
      throw new Error(`unidade ${unitSlug}: lição #${i + 1} sem slug/title`);
    }
    const lessonSlug = lesson.slug;
    if (!Array.isArray(lesson.exercises)) {
      throw new Error(`lição ${lessonSlug}: exercises deve ser uma lista`);
    }
    lesson.exercises.forEach((ex: unknown, j) => {
      if (
        !isObj(ex) ||
        !EXERCISE_TYPES.includes(ex.type as ExerciseType) ||
        !isStr(ex.prompt)
      ) {
        throw new Error(
          `lição ${lessonSlug}: exercício #${j + 1} com type/prompt inválido`,
        );
      }
    });
  });
}
