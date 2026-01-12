import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CommonService } from 'src/common/common.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private _userModel: Model<User>,
    private readonly commonService: CommonService,
  ) {}

  async onModuleInit() {
    await this._userModel.ensureIndexes();

    const firstUserSystemFound = await this._userModel.findOne({
      email: 'developers@osnetpr.com',
    });

    if (!firstUserSystemFound) {
      const password = uuidv4();

      //CREANDO EL USUARIO
      console.log(`CREANDO EL PRIMER USUARIO DEL SISTEMA USUARIO: ${password}`);

      const DataFirstUserSystem: CreateUserDto = {
        firstName: 'Developers',
        lastName: 'Developers2',
        email: 'developers@osnetpr.com',
        password,
      };

      const newUser = new this._userModel(DataFirstUserSystem);

      const firstUserInDatabase = await newUser.save();
    }
  }

  async create(createUserDto: CreateUserDto) {
    try {
      // BUSCANDO SI EL USUARIO ESTA DESACTIVADO
      const foundUserDesactivate = await this._userModel.findOne({
        isActive: false,
        email: createUserDto.email,
      });

      if (foundUserDesactivate) {
        // ACTUALIZANDO EL USUARIO DESACTIVADO
        await foundUserDesactivate.updateOne({
          isActive: true,
          ...createUserDto,
        });
        // RETORNAMOS EL USUARIO ACTUALIZADO
        return await this._userModel.findById(foundUserDesactivate._id);
      }

      // SI NO EXISTE, INSTANCIAMOS Y GUARDAMOS EL OBJETO NUEVO
      const user = await this._userModel.create(createUserDto);

      return user;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0, name } = paginationDto;
    let result: any;

    if (name) {
      result = await this._userModel
        .find({
          isActive: true,
          $or: [
            { email: { $regex: `^${name}`, $options: 'i' } },
            { firstName: { $regex: `^${name}`, $options: 'i' } },
            { lastName: { $regex: `^${name}`, $options: 'i' } },
          ],
        })
        .select(['-password', '-__v'])
        .skip(offset)
        .limit(limit)
        .exec();

      return result;
    }

    result = await this._userModel
      .find({ isActive: true })
      .select(['-password', '-__v'])
      .skip(offset)
      .limit(limit)
      .exec();

    return result;
  }

  async findById(id: string) {
    const user = await this._userModel
      .findOne({
        _id: id,
        isActive: true,
      })
      .select(['-password', '-__v'])
      .exec();

    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      //VALIDAR QUE EL USUARIO EXISTA
      const user = await this.findById(id);

      //ACTUALIZAR EL USUARIO
      const updatedUser = await this._userModel.findOneAndUpdate(
        { _id: id },
        updateUserDto,
        { new: true },
      );

      return updatedUser;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async remove(id: string) {
    const user = await this.findById(id);

    // ELIMINADO EL USUARIO ENCONTRADO
    await user.updateOne({ isActive: false });

    return `User ${user.email} Delete!`;
  }
}
