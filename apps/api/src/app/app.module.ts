import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from '@sigrade/shared-prisma';
import { AuthModule } from '../modules/auth/auth.module';
import { TenantsModule } from '../modules/tenants/tenants.module';
import { TeachersModule } from '../modules/teachers/teachers.module';
import { StudentsModule } from '../modules/students/students.module';
import { GradesModule } from '../modules/grades/grades.module';
import { AttendanceModule } from '../modules/attendance/attendance.module';
import { PeriodsModule } from '../modules/periods/periods.module';
import { ActivitiesModule } from '../modules/activities/activities.module';
import { EvidencesModule } from '../modules/evidences/evidences.module';
import { PlanningModule } from '../modules/planning/planning.module';
import { AnalyticsModule } from '../modules/analytics/analytics.module';
import { FilesModule } from '../modules/files/files.module';
import { AiModule } from '../modules/ai/ai.module';
import { AuditModule } from '../modules/audit/audit.module';
import { CounselingModule } from '../modules/counseling/counseling.module';
import { AcademicModule } from '../modules/academic/academic.module';
import { ExportModule } from '../modules/export/export.module';
import { WsModule } from '../modules/ws/ws.module';
import { EmailModule } from '../modules/email/email.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { SchoolEventsModule } from '../modules/school-events/school-events.module';
import { LoggerMiddleware } from '../common/logger.middleware';
import { TenantContextInterceptor } from '../common/interceptors/tenant-context.interceptor';
import { AppController } from './app.controller';
import { AppService } from './app.service';

function validateEnv(config: Record<string, unknown>) {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  return config;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    TenantsModule,
    TeachersModule,
    StudentsModule,
    GradesModule,
    AttendanceModule,
    PeriodsModule,
    ActivitiesModule,
    EvidencesModule,
    PlanningModule,
    AnalyticsModule,
    FilesModule,
    AiModule,
    AuditModule,
    CounselingModule,
    AcademicModule,
    ExportModule,
    WsModule.forRoot(),
    EmailModule,
    SchoolEventsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}