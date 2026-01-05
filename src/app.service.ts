import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getDescription(): string {
    return 'Welcome to Mapa de Monitoreo API';
  }
}
