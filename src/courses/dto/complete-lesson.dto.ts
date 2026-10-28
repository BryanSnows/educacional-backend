import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class CompleteLessonDto {
  @ApiProperty({ example: 0, description: 'Quantidade de erros na lição' })
  @IsInt({ message: 'mistakes deve ser um número inteiro' })
  @Min(0, { message: 'mistakes não pode ser negativo' })
  @Max(1000, { message: 'mistakes deve ser no máximo 1000' })
  mistakes: number;

  @ApiProperty({ example: 95, description: 'Duração da lição em segundos' })
  @IsInt({ message: 'durationSeconds deve ser um número inteiro' })
  @Min(0, { message: 'durationSeconds não pode ser negativo' })
  durationSeconds: number;
}
