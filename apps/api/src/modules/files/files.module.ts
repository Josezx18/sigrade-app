import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { MinioService } from './minio.service';

@Module({
  imports: [ConfigModule],
  controllers: [FilesController],
  providers: [MinioService, FilesService],
  exports: [MinioService, FilesService],
})
export class FilesModule {}
