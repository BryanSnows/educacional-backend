import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';

const envPath = join(
  process.cwd(),
  `.env.${process.env.NODE_ENV || 'development'}`,
);

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [envPath],
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),
  ],
})
export class AppConfigModule {}
