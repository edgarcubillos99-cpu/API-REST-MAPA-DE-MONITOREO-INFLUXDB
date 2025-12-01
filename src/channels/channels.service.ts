import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Channel } from './entities/channel.entity';
import { Model } from 'mongoose';
import { CommonService } from 'src/common/common.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectModel(Channel.name) private _channelModel: Model<Channel>,
    private readonly commonService: CommonService,
  ) {}

  async create(createChannelDto: CreateChannelDto) {
    try {
      //CREAR EL CANAL
      const channel = await this._channelModel.create(createChannelDto);

      //RETORNAR EL CANAL CREADO
      return channel;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0, name } = paginationDto;

    //FILTRO PARA LA BÚSQUEDAS
    const filter = {
      ...(name && {
        name: { $regex: name, $options: 'i' },
      }),
    };

    try {
      //OBTENER TODOS LOS CANALES
      const channels = await this._channelModel
        .find(filter)
        .skip(offset)
        .limit(limit);

      return channels;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async findById(id: string) {
    const channel = await this._channelModel.findOne({ _id: id });

    //SI NO SE ENCUENTRA EL CANAL, LANZAR UN ERROR
    if (!channel) {
      throw new NotFoundException(`Channel with id ${id} not found`);
    }

    //RETORNAR EL CANAL
    return channel;
  }

  async update(id: string, updateChannelDto: UpdateChannelDto) {
    try {
      //VALIDAR QUE EL CANAL EXISTA
      const channel = await this.findById(id);

      //ACTUALIZAR EL CANAL
      const updatedChannel = await this._channelModel.findOneAndUpdate(
        { _id: id },
        updateChannelDto,
        { new: true },
      );

      return updatedChannel;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async remove(id: string) {
    try {
      //BUSCAR EL CANAL
      const channel = await this.findById(id);

      //ELIMINAR EL CANAL
      await this._channelModel.deleteOne({ _id: id });

      //CHANNEL ELIMINADO
      return `Channel ${channel.name} Deleted!`;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }
}
