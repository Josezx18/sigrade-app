import { Injectable, Logger } from '@nestjs/common';

export interface ExportJob {
  id: string;
  type: 'csv' | 'xlsx' | 'pdf';
  data: Record<string, unknown>[];
  filename: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  createdAt: Date;
}

@Injectable()
export class ExportQueueService {
  private readonly logger = new Logger(ExportQueueService.name);
  private jobs = new Map<string, ExportJob>();

  async enqueue(job: Omit<ExportJob, 'status' | 'createdAt'>): Promise<string> {
    const id = job.id;

    this.jobs.set(id, { ...job, status: 'pending', createdAt: new Date() });
    process.nextTick(() => this.processFallback(id));
    return id;
  }

  getJob(id: string): ExportJob | undefined {
    return this.jobs.get(id);
  }

  private async processFallback(id: string): Promise<void> {
    const job = this.jobs.get(id);
    if (!job) return;
    job.status = 'processing';
    this.logger.log(`Processing export ${id} (${job.type}) — fallback mode`);
    job.status = 'done';
  }
}