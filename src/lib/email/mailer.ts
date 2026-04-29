import nodemailer from "nodemailer";

const FROM = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@property-crm.local";

function getTransport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? 587);

  if (!user || !pass) {
    // No credentials — use ethereal-style test account stub (logs only)
    return null;
  }

  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendMail(opts: MailOptions): Promise<void> {
  try {
    const transport = getTransport();
    if (!transport) {
      console.log(`[mailer] No SMTP credentials — would send to ${opts.to}: ${opts.subject}`);
      return;
    }
    await transport.sendMail({ from: FROM, ...opts });
  } catch (err) {
    console.error("[mailer] Failed to send email:", err);
  }
}
