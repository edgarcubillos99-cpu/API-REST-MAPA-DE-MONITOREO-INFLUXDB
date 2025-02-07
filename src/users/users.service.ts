import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private _UserModel: Model<User>) {}

  async create(createUserDto: CreateUserDto) {
    const alredyExist = await this._UserModel.findOne({
      email: createUserDto.email,
    });

    if (alredyExist) {
      throw new ConflictException(
        `User with email ${createUserDto.email} already exists`,
      );
    }

    return this._UserModel.create(createUserDto);
  }

  findAll() {
    return this._UserModel.find({ isActive: true });
  }

  async findById(id: string) {
    const user = await this._UserModel.findOne({
      _id: id,
      isActive: true,
    });

    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);

    //EXCLUIR AL USUARIO ACTUAL DE LA COMPROBACIÓN DE CORREOS DUPLICADOS
    if (updateUserDto.email) {
      const alredyExist = await this._UserModel.findOne({
        email: updateUserDto.email,
        _id: { $ne: id }
      });
  
      if (alredyExist) {
        throw new ConflictException(`User with email ${updateUserDto.email} already exists`);
      }
    }

    const updatedUser = await user.updateOne(updateUserDto);

    return updatedUser;
  }

  async remove(id: string) {
    const user = await this.findById(id);

    //ELIMINADO EL USUARIO ENCONTRADO
    await user.updateOne({ isActive: false });

    return `User ${user.email} Delete!`;
  }
}
