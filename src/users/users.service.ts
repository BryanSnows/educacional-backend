import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { addDays, APP_TIMEZONE, localDate } from '../shared/utils/date.util';
import { User } from './entities/user.entity';
import { UserResponse } from './user-response';

export const MAX_HEARTS = 5;
export const HEART_REGEN_MS = 30 * 60 * 1000;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findById(id: string, manager?: EntityManager): Promise<User> {
    const repo = manager ? manager.getRepository(User) : this.usersRepository;
    const user = await repo.findOne({ where: { id } });
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    return user;
  }

  /** Lê o usuário com lock de linha (usar dentro de transação). */
  async findByIdForUpdate(id: string, manager: EntityManager): Promise<User> {
    const user = await manager
      .getRepository(User)
      .createQueryBuilder('u')
      .setLock('pessimistic_write')
      .where('u.id = :id', { id })
      .getOne();
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    return user;
  }

  /**
   * Aplica a recarga de corações (1 a cada 30 min) em memória. Mantém
   * `heartsUpdatedAt` como âncora do próximo coração enquanto não estiver cheio.
   */
  applyHeartRegen(user: User, now: Date = new Date()): User {
    if (user.hearts >= MAX_HEARTS) {
      user.hearts = MAX_HEARTS;
      return user;
    }
    const anchor = new Date(user.heartsUpdatedAt).getTime();
    const gained = Math.floor((now.getTime() - anchor) / HEART_REGEN_MS);
    if (gained <= 0) {
      return user;
    }
    user.hearts = Math.min(MAX_HEARTS, user.hearts + gained);
    user.heartsUpdatedAt =
      user.hearts >= MAX_HEARTS
        ? now
        : new Date(anchor + gained * HEART_REGEN_MS);
    return user;
  }

  async xpToday(userId: string, manager?: EntityManager): Promise<number> {
    const runner = manager ?? this.usersRepository.manager;
    const rows: { total: string | null }[] = await runner.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
         FROM xp_events
        WHERE "userId" = $1
          AND "createdAt" >= ($2::date::timestamp AT TIME ZONE '${APP_TIMEZONE}')`,
      [userId, localDate()],
    );
    return Number(rows[0]?.total ?? 0);
  }

  async toResponse(user: User, manager?: EntityManager): Promise<UserResponse> {
    const now = new Date();
    this.applyHeartRegen(user, now);

    // Ofensiva quebrada (último dia ativo antes de ontem) aparece como 0.
    const yesterday = addDays(localDate(now), -1);
    const streak =
      user.lastActiveDate && user.lastActiveDate >= yesterday ? user.streak : 0;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      xp: user.xp,
      xpToday: await this.xpToday(user.id, manager),
      dailyGoal: user.dailyGoal,
      streak,
      longestStreak: user.longestStreak,
      lastActiveDate: user.lastActiveDate,
      hearts: user.hearts,
      maxHearts: MAX_HEARTS,
      nextHeartAt:
        user.hearts < MAX_HEARTS
          ? new Date(
              new Date(user.heartsUpdatedAt).getTime() + HEART_REGEN_MS,
            ).toISOString()
          : null,
      gems: user.gems,
      createdAt: new Date(user.createdAt).toISOString(),
    };
  }

  async getResponse(id: string): Promise<UserResponse> {
    return this.toResponse(await this.findById(id));
  }
}
