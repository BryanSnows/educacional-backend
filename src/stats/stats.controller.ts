import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../shared/decorators/user.decorator';
import type { AuthUser } from '../shared/jwt/jwt.strategy';
import { StatsService } from './stats.service';

@ApiTags('Social e estatísticas')
@ApiBearerAuth()
@Controller()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('leaderboard')
  @ApiOperation({ summary: 'Liga semanal (top 30 + o próprio usuário)' })
  leaderboard(@CurrentUser() user: AuthUser) {
    return this.statsService.leaderboard(user.id);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Estatísticas do usuário (XP dos últimos 7 dias)' })
  stats(@CurrentUser() user: AuthUser) {
    return this.statsService.myStats(user.id);
  }
}
