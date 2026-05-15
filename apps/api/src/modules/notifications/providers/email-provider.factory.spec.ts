import { ConsoleEmailProvider } from './console-email.provider';
import { EmailProviderFactory } from './email-provider.factory';
import { ResendEmailProvider } from './resend-email.provider';
import { SmtpEmailProvider } from './smtp-email.provider';

describe('EmailProviderFactory', () => {
  const factory = new EmailProviderFactory(
    new ConsoleEmailProvider(),
    new SmtpEmailProvider(),
    new ResendEmailProvider(),
  );

  const originalProvider = process.env.EMAIL_PROVIDER;

  afterEach(() => {
    if (originalProvider === undefined) {
      delete process.env.EMAIL_PROVIDER;
    } else {
      process.env.EMAIL_PROVIDER = originalProvider;
    }
  });

  it('returns console provider by default', () => {
    delete process.env.EMAIL_PROVIDER;
    expect(factory.getProvider()).toBeInstanceOf(ConsoleEmailProvider);
  });

  it('returns smtp provider when configured', () => {
    process.env.EMAIL_PROVIDER = 'smtp';
    expect(factory.getProvider()).toBeInstanceOf(SmtpEmailProvider);
  });

  it('returns resend provider when configured', () => {
    process.env.EMAIL_PROVIDER = 'resend';
    expect(factory.getProvider()).toBeInstanceOf(ResendEmailProvider);
  });
});
