import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
const cluster = require('cluster');

export const myclusterPrimary = 0;

async function bootstrap() {
  if (cluster.isPrimary) {
    for (let i = 0; i < 8; i++) {
      cluster.fork();
    }
    // Si un worker muere, lo reiniciamos
    cluster.on('exit', (worker) => {
      console.log(`Worker ${worker.process.pid} died. Restarting...`);
      cluster.fork();
    });
  } else {
    const app = await NestFactory.create(AppModule);

    //CONFIGURANDO PIPES GLOBALES
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    //SI EL ENTORNO ES DE DESARROLLO
    if (process.env.ENTORNO === 'DEV') {
      const config = new DocumentBuilder()
        .setTitle('MDM Documentation')
        .setDescription('Mapa de monitoreo api docs')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('docs', app, document);
    }

    await app.listen(process.env.PORT ?? 3000);

    console.log(
      `Worker server started on ${process.pid} cluster id ${cluster.worker.id}`,
    );
  }
}
bootstrap();
