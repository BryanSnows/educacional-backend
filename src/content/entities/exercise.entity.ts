import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Lesson } from './lesson.entity';

export const EXERCISE_TYPES = [
  'multiple_choice',
  'true_false',
  'fill_blank',
  'order',
  'match',
  'type_answer',
] as const;

export type ExerciseType = (typeof EXERCISE_TYPES)[number];

/** Identidade = lição + posição. Campos específicos do tipo ficam em `data`. */
@Entity('exercises')
@Unique('UQ_exercises_lesson_position', ['lessonId', 'position'])
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  lessonId: string;

  @ManyToOne(() => Lesson, lesson => lesson.exercises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;

  @Column({ type: 'int' })
  position: number;

  @Column({ type: 'varchar' })
  type: ExerciseType;

  @Column({ type: 'text' })
  prompt: string;

  @Column({ type: 'text', default: '' })
  explanation: string;

  @Column({ type: 'text', nullable: true })
  code: string | null;

  /** options / answer / tokens / pairs, conforme o tipo. */
  @Column({ type: 'jsonb', default: () => `'{}'::jsonb` })
  data: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
