import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASSWORD || '',
        },
      },
      defaults: {
        from:
          process.env.SMTP_FROM ||
          '"EM NexaCore" <noreply@emillionnetworking.com>',
      },
      template: {
        dir: join(__dirname, 'templates'),
        // @nestjs-modules/mailer's HandlebarsAdapter has weak constructor types
        // (TemplateAdapter resolves to `any`). The NestJS docs use exactly this
        // construction; suppress unsafe-* at this single boundary site.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
