import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const DAILY_GOALS = [10, 20, 30, 50];

export class UpdateMeDto {
  @ApiPropertyOptional({ example: 'Ana' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Nome deve ser um texto' })
  @IsNotEmpty({ message: 'Nome não pode ser vazio' })
  @MaxLength(80, { message: 'Nome deve ter no máximo 80 caracteres' })
  name?: string;

  @ApiPropertyOptional({ enum: DAILY_GOALS, example: 30 })
  @IsOptional()
  @IsIn(DAILY_GOALS, { message: 'Meta diária deve ser 10, 20, 30 ou 50' })
  dailyGoal?: number;
}
