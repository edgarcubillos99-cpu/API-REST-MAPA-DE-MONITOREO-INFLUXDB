import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //CONFIGURANDO PIPES GLOBALES
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  //HABILITANDO LOS CORS
  app.enableCors();

  //SI EL ENTORNO ES DE DESARROLLO
  if (process.env.ENTORNO === 'DEV') {
    const config = new DocumentBuilder()
      .setTitle('MDM Documentation')
      .setDescription('Mapa de monitoreo de red api docs')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Application is running on PORT ${port}`);
}
bootstrap();
