import { Resend } from "resend";
import { z } from "zod";

// Defer client initialization until an email is sent so public pages can build
// without email credentials. Resend still validates the key at send time.
export function getResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(key);
}

export function getEmailSender() {
  const sender = process.env.EMAIL_FROM?.trim();
  const address = sender?.match(/<([^<>]+)>$/)?.[1] || sender;
  if (
    !address ||
    !z.email().safeParse(address).success ||
    /[\r\n]/.test(sender!)
  ) {
    throw new Error(
      "EMAIL_FROM must contain a full email address on a verified domain",
    );
  }
  return sender!;
}
