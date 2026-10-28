import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentModule } from '../content/content.module';
import { LessonCompletion } from '../progress/entities/lesson-completion.entity';
import { XpEvent } from '../progress/entities/xp-event.entity';
import { UsersModule } from '../users/users.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { LessonsController } from './lessons.controller';
import { ProgressService } from './progress.service';

@Module({
  imports: [
    ContentModule,
    UsersModule,
    TypeOrmModule.forFeature([LessonCompletion, XpEvent]),
  ],
  controllers: [CoursesController, LessonsController],
  providers: [CoursesService, ProgressService],
})
export class CoursesModule {}
