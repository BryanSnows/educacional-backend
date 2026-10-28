import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentSyncService } from './content-sync.service';
import { Course } from './entities/course.entity';
import { Exercise } from './entities/exercise.entity';
import { Lesson } from './entities/lesson.entity';
import { Unit } from './entities/unit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Course, Unit, Lesson, Exercise])],
  providers: [ContentSyncService],
  exports: [TypeOrmModule],
})
export class ContentModule {}
