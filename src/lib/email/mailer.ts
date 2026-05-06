import { Resend } from "resend";

const FROM = process.env.RESEND_FROM ?? "onboarding@resend.dev";

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendMail(opts: MailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[mailer] No RESEND_API_KEY — would send to ${opts.to}: ${opts.subject}`);
    return;
  }
  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({ from: FROM, ...opts });
  } catch (err) {
    console.error("[mailer] Failed to send email:", err);
  }
}
