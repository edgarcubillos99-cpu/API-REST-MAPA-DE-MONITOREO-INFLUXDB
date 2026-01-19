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
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsModule } from './alerts/alerts.module';
import { ChannelsModule } from './channels/channels.module';
import { LabelsModule } from './labels/labels.module';
import { UbersmithModule } from './ubersmith/ubersmith.module';
import { ClasificationsModule } from './clasifications/clasifications.module';
import { InfluxModule } from './influx/influx.module';

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
    ScheduleModule.forRoot(),
    /*
    TypeOrmModule.forRoot({
//..      type: 'mysql',
      host: process.env.DB_HOST,
      port: +(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      synchronize: false, //NO MODIFICA LA DB
      extra: {
        connectTimeout: 30000, //30 segundos
      },
    }),*/
    AlertsModule,
    ChannelsModule,
    LabelsModule,
    UbersmithModule,
    ClasificationsModule,
    InfluxModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
