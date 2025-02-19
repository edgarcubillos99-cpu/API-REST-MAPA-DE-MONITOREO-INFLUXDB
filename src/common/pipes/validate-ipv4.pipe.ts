import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { isIPv4 } from 'net';

@Injectable()
export class ValidateIpv4Pipe implements PipeTransform {
  transform(value: any) {
    if (typeof value !== 'string' || !isIPv4(value)) {
      throw new BadRequestException(
        `El valor '${value}' no es una dirección IPv4 válida.`,
      );
    }
    return value;
  }
}
