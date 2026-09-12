import { Module } from '@nestjs/common';
import { SchoolEventsService } from './school-events.service';
import { SchoolEventsController } from './school-events.controller';

@Module({
  controllers: [SchoolEventsController],
  providers: [SchoolEventsService],
  exports: [SchoolEventsService],
})
export class SchoolEventsModule {}
