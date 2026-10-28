import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../shared/decorators/user.decorator';
import type { AuthUser } from '../shared/jwt/jwt.strategy';
import { CoursesService } from './courses.service';

@ApiTags('Cursos')
@ApiBearerAuth()
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista cursos com progresso do usuário' })
  list(@CurrentUser() user: AuthUser) {
    return this.coursesService.listCourses(user.id);
  }

  @Get(':slug/path')
  @ApiOperation({ summary: 'Trilha do curso: unidades e lições com status' })
  path(@Param('slug') slug: string, @CurrentUser() user: AuthUser) {
    return this.coursesService.getPath(slug, user.id);
  }
}
