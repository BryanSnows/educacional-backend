import { Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../shared/decorators/user.decorator';
import type { AuthUser } from '../shared/jwt/jwt.strategy';
import { UserResponse } from '../users/user-response';
import { HeartsService } from './hearts.service';

@ApiTags('Corações')
@ApiBearerAuth()
@Controller('hearts')
export class HeartsController {
  constructor(private readonly heartsService: HeartsService) {}

  @Post('lose')
  @HttpCode(200)
  @ApiOperation({ summary: 'Perde 1 coração (nunca abaixo de 0)' })
  @ApiOkResponse({ type: UserResponse })
  lose(@CurrentUser() user: AuthUser) {
    return this.heartsService.lose(user.id);
  }

  @Post('refill')
  @HttpCode(200)
  @ApiOperation({ summary: 'Recarga completa por 350 gemas' })
  @ApiOkResponse({ type: UserResponse })
  refill(@CurrentUser() user: AuthUser) {
    return this.heartsService.refill(user.id);
  }
}
