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

  findAll() {
    return this._userModel.find({ isActive: true });
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
