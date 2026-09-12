import { Module, DynamicModule, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

function isSocketIoAvailable(): boolean {
  try {
    require.resolve('@nestjs/platform-socket.io');
    return true;
  } catch {
    return false;
  }
}

@Module({})
export class WsModule {
  static forRoot(): DynamicModule {
    const logger = new Logger('WsModule');

    if (!isSocketIoAvailable()) {
      logger.warn('@nestjs/platform-socket.io not installed. WebSocket disabled. Install with: npm install @nestjs/platform-socket.io');
      return {
        module: WsModule,
        providers: [],
        exports: [],
      };
    }

    // Dynamic import only if available
    const { EventsGateway } = require('./events.gateway');
    return {
      module: WsModule,
      imports: [
        // ConfigModule is global, so ConfigService is injectable here.
        JwtModule.registerAsync({
          useFactory: (configService: ConfigService) => ({
            secret: configService.getOrThrow<string>('JWT_SECRET'),
          }),
          inject: [ConfigService],
        }),
      ],
      providers: [EventsGateway],
      exports: [EventsGateway],
    };
  }
}
