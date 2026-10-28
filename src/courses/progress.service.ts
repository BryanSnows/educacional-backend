import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { LessonCompletion } from '../progress/entities/lesson-completion.entity';
import { XpEvent } from '../progress/entities/xp-event.entity';
import { addDays, localDate } from '../shared/utils/date.util';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { CoursesService, LESSON_LOCKED } from './courses.service';

export const PRACTICE_XP = 5;
export const PERFECT_BONUS_XP = 5;
export const GEMS_COMPLETED = 5;
export const GEMS_PERFECT = 10;

/** 3 = sem erros, 2 = até 2 erros, 1 = concluída. */
export function starsFor(mistakes: number): number {
  if (mistakes === 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}

@Injectable()
export class ProgressService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly coursesService: CoursesService,
    private readonly usersService: UsersService,
  ) {}

  async completeLesson(
    lessonId: string,
    userId: string,
    dto: CompleteLessonDto,
  ) {
    return this.dataSource.transaction(async manager => {
      // Lock no usuário serializa conclusões simultâneas do mesmo usuário.
      const user = await this.usersService.findByIdForUpdate(userId, manager);
      const { current, next } = await this.coursesService.locate(
        lessonId,
        userId,
        manager,
      );
      if (current.status === 'locked') {
        throw new ForbiddenException(LESSON_LOCKED);
      }

      const practice = current.status === 'completed';
      const perfect = dto.mistakes === 0;
      const stars = starsFor(dto.mistakes);
      const xpEarned = practice
        ? PRACTICE_XP
        : current.lesson.xp + (perfect ? PERFECT_BONUS_XP : 0);
      const gemsEarned = perfect ? GEMS_PERFECT : GEMS_COMPLETED;

      // Ofensiva (America/Manaus): ontem → +1; hoje → mantém; antes → 1.
      const today = localDate();
      const streakExtended = user.lastActiveDate !== today;
      if (streakExtended) {
        user.streak =
          user.lastActiveDate === addDays(today, -1) ? user.streak + 1 : 1;
        user.lastActiveDate = today;
        user.longestStreak = Math.max(user.longestStreak, user.streak);
      }

      user.xp += xpEarned;
      user.gems += gemsEarned;
      this.usersService.applyHeartRegen(user);

      await manager.getRepository(User).update(user.id, {
        xp: user.xp,
        gems: user.gems,
        streak: user.streak,
        longestStreak: user.longestStreak,
        lastActiveDate: user.lastActiveDate,
        hearts: user.hearts,
        heartsUpdatedAt: user.heartsUpdatedAt,
      });

      const completions = manager.getRepository(LessonCompletion);
      const completion = await completions.findOne({
        where: { userId, lessonId },
      });
      if (completion) {
        completion.bestStars = Math.max(completion.bestStars, stars);
        completion.timesCompleted += 1;
        await completions.save(completion);
      } else {
        await completions.save(
          completions.create({
            userId,
            lessonId,
            bestStars: stars,
            timesCompleted: 1,
            completedAt: new Date(),
          }),
        );
      }

      await manager.getRepository(XpEvent).save({
        userId,
        lessonId,
        amount: xpEarned,
        source: practice ? 'practice' : 'lesson',
      });

      return {
        xpEarned,
        gemsEarned,
        stars,
        perfect,
        streakExtended,
        nextLessonId: next?.lesson.id ?? null,
        user: await this.usersService.toResponse(user, manager),
      };
    });
  }
}
