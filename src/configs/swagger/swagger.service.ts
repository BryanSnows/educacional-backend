import { INestApplication, Injectable } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

@Injectable()
export class SwaggerService {
  init(app: INestApplication) {
    const config = new DocumentBuilder()
      .setTitle(process.env.SWAGGER_TITLE || 'INDT Educacional')
      .setDescription(
        process.env.SWAGGER_DESCRIPTION || 'API do INDT Educacional',
      )
      .setVersion(process.env.SWAGGER_VERSION || '1.0')
      .addBearerAuth()
      .addServer(process.env.SWAGGER_API_URL || 'http://localhost:3010')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/swagger', app, document);
  }
}
