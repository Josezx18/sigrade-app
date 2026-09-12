import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { ExportQueueService } from './export-queue.service';

@Module({
  controllers: [ExportController],
  providers: [ExportService, ExportQueueService],
  exports: [ExportService, ExportQueueService],
})
export class ExportModule {}
