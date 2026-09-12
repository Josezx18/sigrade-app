import { Injectable, Logger } from '@nestjs/common';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: unknown = null;

  async send(options: EmailOptions): Promise<boolean> {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      this.logger.warn(
        `SMTP not configured. Email not sent to ${options.to}. ` +
        `Set SMTP_USER and SMTP_PASS in .env to enable email sending.`,
      );
      this.logger.log(`[EMAIL LOG] To: ${options.to} | Subject: ${options.subject} | Body: ${options.text.substring(0, 200)}...`);
      return false;
    }

    try {
      await this.ensureTransporter();
      if (!this.transporter) return false;

      await (this.transporter as { sendMail: (opts: Record<string, unknown>) => Promise<unknown> }).sendMail({
        from: process.env.EMAIL_FROM || 'noreply@sigrade.gob.do',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${(error as Error).message}`);
      return false;
    }
  }

  private async ensureTransporter(): Promise<void> {
    if (this.transporter) return;

    try {
      const mod = await Function('return import("nodemailer")')() as { default: { createTransport: (opts: Record<string, unknown>) => unknown } };
      const nodemailer = mod.default || mod;
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } catch {
      this.logger.warn('nodemailer not installed. Install with: npm install nodemailer');
    }
  }
}