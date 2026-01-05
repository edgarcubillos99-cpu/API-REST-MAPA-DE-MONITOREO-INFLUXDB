import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/users/entities/user.entity';
import { Model } from 'mongoose';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@InjectModel(User.name) private _userModel: Model<User>) {
    super({
      secretOrKey: process.env.JWT_SECRET ?? '',
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload) {
    const { uuid } = payload;

    const user = await this._userModel.findById(uuid);

    if (!user) throw new UnauthorizedException('Token not valid');

    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive!');
    }

    return user;
  }
}
