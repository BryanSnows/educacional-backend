import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserResponse } from '../users/user-response';
import { MAX_HEARTS, UsersService } from '../users/users.service';

export const REFILL_COST = 350;

@Injectable()
export class HeartsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
  ) {}

  lose(userId: string): Promise<UserResponse> {
    return this.dataSource.transaction(async manager => {
      const now = new Date();
      const user = await this.usersService.findByIdForUpdate(userId, manager);
      this.usersService.applyHeartRegen(user, now);
      if (user.hearts > 0) {
        // Saindo do cheio, o relógio da recarga começa agora.
        if (user.hearts >= MAX_HEARTS) user.heartsUpdatedAt = now;
        user.hearts -= 1;
      }
      await manager.getRepository(User).update(user.id, {
        hearts: user.hearts,
        heartsUpdatedAt: user.heartsUpdatedAt,
      });
      return this.usersService.toResponse(user, manager);
    });
  }

  refill(userId: string): Promise<UserResponse> {
    return this.dataSource.transaction(async manager => {
      const now = new Date();
      const user = await this.usersService.findByIdForUpdate(userId, manager);
      this.usersService.applyHeartRegen(user, now);
      if (user.hearts >= MAX_HEARTS) {
        throw new BadRequestException('Corações já estão cheios');
      }
      if (user.gems < REFILL_COST) {
        throw new BadRequestException('Gemas insuficientes');
      }
      user.gems -= REFILL_COST;
      user.hearts = MAX_HEARTS;
      user.heartsUpdatedAt = now;
      await manager.getRepository(User).update(user.id, {
        gems: user.gems,
        hearts: user.hearts,
        heartsUpdatedAt: user.heartsUpdatedAt,
      });
      return this.usersService.toResponse(user, manager);
    });
  }
}
