import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  /** Sempre em minúsculas. */
  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ type: 'int', default: 0 })
  xp: number;

  @Column({ type: 'int', default: 30 })
  dailyGoal: number;

  @Column({ type: 'int', default: 0 })
  streak: number;

  @Column({ type: 'int', default: 0 })
  longestStreak: number;

  /** Último dia (America/Manaus) com lição concluída. */
  @Column({ type: 'date', nullable: true })
  lastActiveDate: string | null;

  /** Corações gravados em `heartsUpdatedAt`; a recarga é calculada na leitura. */
  @Column({ type: 'int', default: 5 })
  hearts: number;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  heartsUpdatedAt: Date;

  @Column({ type: 'int', default: 0 })
  gems: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
