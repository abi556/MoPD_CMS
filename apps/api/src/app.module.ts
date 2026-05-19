import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppThrottlerGuard } from './common/guards/app-throttler.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { CaseModule } from './modules/case/case.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { SlaModule } from './modules/sla/sla.module';
import { UserModule } from './modules/user/user.module';
import { ReferenceDataModule } from './modules/reference-data/reference-data.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { BullBoardAdminModule } from './queue/bull-board.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    QueueModule,
    BullBoardAdminModule,
    AuthModule,
    AuditModule,
    AdminModule,
    ComplaintsModule,
    CaseModule,
    SlaModule,
    ReferenceDataModule,
    NotificationsModule,
    DocumentsModule,
    UserModule,
    PrismaModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60000,
          limit: 300,
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
