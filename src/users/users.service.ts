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
import { CommonService } from 'src/common/common.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private _userModel: Model<User>,
    private readonly commonService: CommonService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
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
            { nombre: { $regex: `^${name}`, $options: 'i' } },
            { apellido: { $regex: `^${name}`, $options: 'i' } },
          ],
        })
        .skip(offset)
        .limit(limit)
        .exec();

      return result;
    }

    result = await this._userModel
      .find({ isActive: true })
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
      .exec();

    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.findById(id);
      const updatedUser = await user.updateOne(updateUserDto);

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
