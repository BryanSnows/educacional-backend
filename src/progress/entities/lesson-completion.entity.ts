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
import { Lesson } from '../../content/entities/lesson.entity';
import { User } from '../../users/entities/user.entity';

/** Uma linha por usuário + lição: melhor resultado e primeira conclusão. */
@Entity('lesson_completions')
@Unique('UQ_lesson_completions_user_lesson', ['userId', 'lessonId'])
export class LessonCompletion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  lessonId: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;

  @Column({ type: 'int' })
  bestStars: number;

  @Column({ type: 'int', default: 1 })
  timesCompleted: number;

  @Column({ type: 'timestamptz' })
  completedAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
