/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InfluxDB, QueryApi } from '@influxdata/influxdb-client';
import { ConfigService } from '@nestjs/config';
import { envs } from 'src/conf';

// declaramos la clase InfluxService que implementa OnModuleInit
// OnModuleInit es una interfaz de NestJS que nos permite inicializar el modulo
@Injectable()
export class InfluxService implements OnModuleInit {
  private queryApi: QueryApi;
  private organization: string;
  private bucket: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // inicializamos el cliente de InfluxDB
    const url = envs.influxUrl;
    const token = envs.influxToken;
    const org = envs.influxOrg;
    const bucket = envs.influxBucket;

    if (!url || !token || !org || !bucket) {
      throw new Error('Missing InfluxDB configuration variable.');
    }

    // asignamos los valores a las propiedades
    this.organization = org;
    this.bucket = bucket;

    const influxDB = new InfluxDB({ url, token });
    this.queryApi = influxDB.getQueryApi(this.organization);
  }

  // Metodo auxiliar para convertir el rango (ej: "2d", "1w") a horas totales
  // Esto nos sirve para calcular la ventana de agrupación 'every'
  private parseDurationToHours(duration: string): number {
    const match = duration.match(/^(\d+)([a-zA-Z]+)$/);
    if (!match) return 1; // Default a 1 hora si no hace match

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'h':
        return value;
      case 'd':
        return value * 24;
      case 'w':
        return value * 24 * 7;
      case 'mo':
        return value * 24 * 30; // Aproximado
      case 'y':
        return value * 24 * 365;
      case 'm':
        return value / 60; // Minutos a horas
      default:
        return value;
    }
  }

  // Metodo para consultar trafico
  async getTrafficHistory(
    range: string = '1h',
    interfaceId?: string,
  ): Promise<any[]> {
    // convertimos el rango a horas
    const totalHours = this.parseDurationToHours(range);

    // Lógica para determinar el 'every' (windowPeriod) automáticamente
    let every = '1m'; // Por defecto minutos (para consultas de horas)

    if (totalHours >= 720) {
      // Si es un mes (30 dias * 24h = 720h) o más -> Semanas
      every = '1w';
    } else if (totalHours >= 168) {
      // Si es una semana (7 dias * 24h = 168h) o más -> Dias
      every = '1d';
    } else if (totalHours >= 24) {
      // Si es un dia (24h) o más -> Horas
      every = '1h';
    }
    // Si es menos de 24h, se queda en '1m' (minutos)
    // construimos la consulta
    let query = `
    from(bucket: "${this.bucket}")
    |> range(start: -${range})
    |> filter(fn: (r) => r["_measurement"] == "network_traffic")
    `;
    // agregamos filtros dependiendo de los parametros recibidos
    if (interfaceId) {
      query += `|> filter(fn: (r) => r["interface"] == "${interfaceId}")`;
    }

    // agregamos el 'every' a la consulta
    query += `|> aggregateWindow(every: ${every}, fn: mean, createEmpty: false)`;

    // usamos 'pivot' para agrupar temp y temperature en un solo objeto JSON
    //pivot es una funcion de InfluxDB que nos permite agrupar los datos por time y field y el valor de la columna _value
    //rowKey es el nombre de la columna que usaremos para agrupar los datos
    //columnKey es el nombre de las columnas que usaremos para agrupar los datos
    //valueColumn es el nombre de la columna que usaremos para el valor de la columna _value
    //sort es una funcion de InfluxDB que nos permite ordenar los datos por time en orden descendente
    //limit es una funcion de InfluxDB que nos permite limitar el numero de datos devueltos
    query += `
    |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
    |> sort(columns: ["_time"], desc: true)
    `;

    // ejecutamos la consulta
    const results: any[] = [];
    return new Promise((resolve, reject) => {
      this.queryApi.queryRows(query, {
        next: (row, tableMeta) => {
          const o = tableMeta.toObject(row);
          //mapeamos un objeto limpio para la API
          results.push({
            time: o._time,
            value: o.value,
            interface: o.interface,
            in_mbps: o.in_rate_mbps,
            out_mbps: o.out_rate_mbps,
          });
        },
        error: (error) => {
          reject(error);
        },
        complete: () => {
          resolve(results);
        },
      });
    });
  }
}
