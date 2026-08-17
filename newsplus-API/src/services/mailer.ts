export type ResetMail = {
  to: string;
  subject: string;
  text: string;
};

export interface IMailer {
  send(mail: ResetMail): Promise<void>;
}

type Logger = {
  info: (obj: unknown, msg?: string) => void;
};

export class LogMailer implements IMailer {
  constructor(private readonly log: Logger) {}

  async send(mail: ResetMail): Promise<void> {
    this.log.info({ to: mail.to, subject: mail.subject }, "auth.mail.queued");
  }
}