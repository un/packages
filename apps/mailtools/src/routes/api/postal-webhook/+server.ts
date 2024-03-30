import { error } from '@sveltejs/kit';
import { POSTAL_PUBLIC_KEYS } from '$env/static/private';
import type { RequestHandler } from './$types';
import { validatePostalWebhookSignature } from '@lib/postal/validateSignature';
import { db } from '@lib/db';
import { eq, and } from 'drizzle-orm';
import { emailStorage, emails } from '@lib/db/schema';
import { simpleParser } from 'mailparser';

const postalPublicKeys = JSON.parse(POSTAL_PUBLIC_KEYS) as string[];

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.text();
  const signature = request.headers.get('x-postal-signature') || '';
  const valid = await validatePostalWebhookSignature(
    body,
    signature,
    postalPublicKeys
  );
  if (!valid) {
    error(401, 'Invalid signature');
  }
  const { message, id, rcpt_to, mail_from } = JSON.parse(body) as {
    message: string;
    id: string;
    rcpt_to: string;
    mail_from: string;
  };

  console.log(`Email received: ${id} from ${mail_from} to ${rcpt_to}`);
  const email = await db.query.emails.findFirst({
    where: and(
      eq(emails.emailAddress, rcpt_to),
      eq(emails.emailReceived, false)
    )
  });
  if (!email) {
    console.log(
      `Email not found or has already been used: ${rcpt_to}, Dropping email.`
    );
    return new Response(null);
  }
  const parsedMessage = await simpleParser(message);
  const bodyHtml = parsedMessage.html || parsedMessage.textAsHtml;
  if (!bodyHtml) {
    console.log(`Email has no body: ${id}, Dropping email.`);
    return new Response(null);
  }
  await db.insert(emailStorage).values({
    emailId: email.id,
    emailFrom: mail_from,
    emailContent: bodyHtml
  });
  await db
    .update(emails)
    .set({
      emailReceived: true
    })
    .where(eq(emails.id, email.id));
  return new Response(null);
};
