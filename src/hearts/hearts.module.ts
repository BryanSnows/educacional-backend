import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { HeartsController } from './hearts.controller';
import { HeartsService } from './hearts.service';

@Module({
  imports: [UsersModule],
  controllers: [HeartsController],
  providers: [HeartsService],
})
export class HeartsModule {}
