import { Module } from '@nestjs/common';
import { InfluxService } from './influx.service';
import { InfluxController } from './influx.controller';
import { ConfigModule } from '@nestjs/config'; // Importar si usas ConfigService dentro de InfluxService

@Module({
  imports: [ConfigModule], // Asegúrate de importar módulos necesarios
  controllers: [InfluxController],
  providers: [InfluxService],
  exports: [InfluxService], // Exportar si otros módulos necesitan usar InfluxService
})
export class InfluxModule {}
