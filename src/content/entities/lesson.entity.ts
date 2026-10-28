import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exercise } from './exercise.entity';
import { Unit } from './unit.entity';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Identidade estável vinda do conteúdo (única no banco). */
  @Column({ unique: true })
  slug: string;

  @Column({ type: 'uuid' })
  unitId: string;

  @ManyToOne(() => Unit, unit => unit.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unitId' })
  unit: Unit;

  @Column()
  title: string;

  /** Posição (1-based) dentro da unidade. */
  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'int', default: 10 })
  xp: number;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => Exercise, exercise => exercise.lesson)
  exercises: Exercise[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
