import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Course } from './course.entity';
import { Lesson } from './lesson.entity';

@Entity('units')
@Unique('UQ_units_course_slug', ['courseId', 'slug'])
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  courseId: string;

  @ManyToOne(() => Course, course => course.units, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column()
  slug: string;

  @Column()
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ default: '#58CC02' })
  color: string;

  @Column({ default: 'book' })
  icon: string;

  /** Posição (1-based) na lista `units` do course.json. */
  @Column({ type: 'int' })
  order: number;

  /** Falso quando o arquivo da unidade não existe/está inválido no conteúdo. */
  @Column({ default: true })
  active: boolean;

  @OneToMany(() => Lesson, lesson => lesson.unit)
  lessons: Lesson[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
