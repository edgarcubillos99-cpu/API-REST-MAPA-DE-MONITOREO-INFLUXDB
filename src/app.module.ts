import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guard/jwt-auth.guard';
import { MapasModule } from './mapas/mapas.module';
import { DevicesModule } from './devices/devices.module';
import { EnlacesModule } from './enlaces/enlaces.module';
import { EventLogsModule } from './event-logs/event-logs.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_CONNECT ?? ''),
    UsersModule,
    CommonModule,
    AuthModule,
    MapasModule,
    DevicesModule,
    EnlacesModule,
    EventEmitterModule.forRoot(),
    EventLogsModule,
    ScheduleModule.forRoot()
  ],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
