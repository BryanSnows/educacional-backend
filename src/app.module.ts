import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './configs/config.module';
import { AppDataSource } from './configs/database/typeorm.config';
import { ContentModule } from './content/content.module';
import { CoursesModule } from './courses/courses.module';
import { HeartsModule } from './hearts/hearts.module';
import { TransformInterceptor } from './shared/interceptors/transformer.interceptor';
import { JwtAuthGuard } from './shared/jwt/jwt-auth.guard';
import { StatsModule } from './stats/stats.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => ({ ...AppDataSource.options }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 1000, limit: 20 }],
      errorMessage: 'Muitas requisições; tente novamente em instantes',
    }),
    UsersModule,
    AuthModule,
    ContentModule,
    CoursesModule,
    HeartsModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
