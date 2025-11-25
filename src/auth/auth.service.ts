import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/users/entities/user.entity';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private _userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginAuthDto: LoginAuthDto) {
    const { email, password } = loginAuthDto;

    const user = await this._userModel
      .findOne({ email })
      .select('+password');

    // SI NO SE ENCUENTRA UN USUARIO CON ESE EMAIL
    if (!user)
      throw new NotFoundException(`User not found with email ${email}`);

    // SI EL USUARIO ESTA INACTIVO 
    if (!user?.isActive)
      throw new ForbiddenException(`Your account ${email} is currently inactive`);

    const isMatch = await bcrypt.compare(password, user.password);

    //SI EL PASSWORD ES INCORRECTO
    if (!isMatch) {
      throw new UnauthorizedException('Credentials incorrect');
    }

    return {
      token: this.getJwtToken({
        uuid: user.id,
      }),
      userUUID: user.id,
    };
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN,
      secret: process.env.JWT_SECRET,
    });

    return token;
  }
}
