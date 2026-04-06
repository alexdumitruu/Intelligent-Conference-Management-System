import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendDecisionEmail(
    recipientEmail: string,
    recipientName: string,
    paperTitle: string,
    decision: string,
    conferenceName: string,
  ): Promise<void> {
    const subject = `[${conferenceName}] Decision on your paper: ${paperTitle}`;
    const html = `
      <h2>Dear ${recipientName},</h2>
      <p>We are writing to inform you about the decision regarding your paper
      <strong>"${paperTitle}"</strong> submitted to <strong>${conferenceName}</strong>.</p>
      <p>The committee has reached the following decision: <strong>${decision}</strong></p>
      <p>Thank you for your submission.</p>
      <p>Best regards,<br/>${conferenceName} Committee</p>
    `;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_USER'),
        to: recipientEmail,
        subject,
        html,
      });
    } catch (error) {
      console.error(`Failed to send decision email to ${recipientEmail}:`, error);
    }
  }
}
