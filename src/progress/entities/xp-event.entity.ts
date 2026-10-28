import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Lesson } from '../../content/entities/lesson.entity';
import { User } from '../../users/entities/user.entity';

export type XpSource = 'lesson' | 'practice';

/** Histórico de XP: base para xpToday, liga semanal e estatísticas. */
@Entity('xp_events')
@Index('IDX_xp_events_user_created', ['userId', 'createdAt'])
export class XpEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'varchar' })
  source: XpSource;

  @Column({ type: 'uuid', nullable: true })
  lessonId: string | null;

  @ManyToOne(() => Lesson, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
