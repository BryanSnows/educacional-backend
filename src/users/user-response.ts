import { ApiProperty } from '@nestjs/swagger';

/** Formato de `User` do contrato (docs/CONTRATO.md). */
export class UserResponse {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty() xp: number;
  @ApiProperty() xpToday: number;
  @ApiProperty() dailyGoal: number;
  @ApiProperty() streak: number;
  @ApiProperty() longestStreak: number;
  @ApiProperty({ type: String, nullable: true, example: '2026-10-27' })
  lastActiveDate: string | null;
  @ApiProperty() hearts: number;
  @ApiProperty() maxHearts: number;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' })
  nextHeartAt: string | null;
  @ApiProperty() gems: number;
  @ApiProperty({ format: 'date-time' }) createdAt: string;
}
