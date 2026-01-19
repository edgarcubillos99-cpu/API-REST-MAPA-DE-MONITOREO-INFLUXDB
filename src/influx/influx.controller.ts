import { Controller, Get, Query } from '@nestjs/common';
import { InfluxService } from './influx.service';

// Controlador para las metricas de trafico
@Controller('metrics')
export class InfluxController {
  constructor(private readonly influxService: InfluxService) {}

  // Metodo para obtener el trafico de la red
  @Get('traffic')
  async getTraffic(
    @Query('range') range: string,
    @Query('interfaceId') interfaceId: string,
  ) {
    // convertimos el parametro hours a numero
    const r = range || '1h';

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.influxService.getTrafficHistory(r, interfaceId);
  }
}
