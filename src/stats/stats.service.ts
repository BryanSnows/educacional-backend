import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  addDays,
  APP_TIMEZONE,
  localDate,
  weekStart,
} from '../shared/utils/date.util';

const LEADERBOARD_SIZE = 30;

@Injectable()
export class StatsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** Liga semanal: XP desde segunda 00:00 (America/Manaus). */
  async leaderboard(userId: string) {
    const start = weekStart(localDate());
    const rows: { userId: string; name: string; xp: number; rank: string }[] =
      await this.dataSource.query(
        `WITH totals AS (
           SELECT u.id, u.name, COALESCE(SUM(e.amount), 0)::int AS xp
             FROM users u
             LEFT JOIN xp_events e
               ON e."userId" = u.id
              AND e."createdAt" >= ($1::date::timestamp AT TIME ZONE '${APP_TIMEZONE}')
            GROUP BY u.id, u.name
         ), ranked AS (
           SELECT id, name, xp,
                  ROW_NUMBER() OVER (ORDER BY xp DESC, name ASC, id ASC) AS rank
             FROM totals
         )
         SELECT id AS "userId", name, xp, rank
           FROM ranked
          WHERE rank <= $2 OR id = $3
          ORDER BY rank`,
        [start, LEADERBOARD_SIZE, userId],
      );

    return {
      weekStart: start,
      entries: rows.map(r => ({
        rank: Number(r.rank),
        userId: r.userId,
        name: r.name,
        xp: Number(r.xp),
        isMe: r.userId === userId,
      })),
    };
  }

  async myStats(userId: string) {
    const [counts]: { lessonsCompleted: string; perfectLessons: string }[] =
      await this.dataSource.query(
        `SELECT COUNT(*) AS "lessonsCompleted",
                COUNT(*) FILTER (WHERE "bestStars" = 3) AS "perfectLessons"
           FROM lesson_completions
          WHERE "userId" = $1`,
        [userId],
      );

    const today = localDate();
    const from = addDays(today, -6);
    const days: { date: string; xp: number }[] = await this.dataSource.query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS date,
              COALESCE(SUM(e.amount), 0)::int AS xp
         FROM generate_series($2::date, $3::date, interval '1 day') AS d
         LEFT JOIN xp_events e
           ON e."userId" = $1
          AND (e."createdAt" AT TIME ZONE '${APP_TIMEZONE}')::date = d::date
        GROUP BY d
        ORDER BY d`,
      [userId, from, today],
    );

    return {
      lessonsCompleted: Number(counts.lessonsCompleted),
      perfectLessons: Number(counts.perfectLessons),
      xpLast7Days: days.map(d => ({ date: d.date, xp: Number(d.xp) })),
    };
  }
}
