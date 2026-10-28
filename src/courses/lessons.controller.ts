import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../shared/decorators/user.decorator';
import type { AuthUser } from '../shared/jwt/jwt.strategy';
import { uuidOr404 } from '../shared/pipes/uuid.pipe';
import { LESSON_NOT_FOUND, CoursesService } from './courses.service';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { ProgressService } from './progress.service';

@ApiTags('Lições')
@ApiBearerAuth()
@Controller('lessons')
export class LessonsController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly progressService: ProgressService,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Lição com exercícios e respostas (403 se locked)' })
  get(
    @Param('id', uuidOr404(LESSON_NOT_FOUND)) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.coursesService.getLesson(id, user.id);
  }

  @Post(':id/complete')
  @HttpCode(200)
  @ApiOperation({ summary: 'Conclui a lição: XP, gemas, estrelas, ofensiva' })
  complete(
    @Param('id', uuidOr404(LESSON_NOT_FOUND)) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CompleteLessonDto,
  ) {
    return this.progressService.completeLesson(id, user.id, dto);
  }
}
