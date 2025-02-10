import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';

@Injectable()
export class CommonService {
  handleExceptions(error: any) {
    if (error instanceof NotFoundException) {
      throw error;
    }

    if (error.code === 11000) {
      throw new ConflictException(
        `exists in db ${JSON.stringify(error.keyValue)}`,
      );
    }

    console.log(error);
    throw new InternalServerErrorException(`Can't process request - Check server logs`);
  }
}
