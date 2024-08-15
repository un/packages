import { db } from '@lib/db';
import { emails, emailStorage } from '@lib/db/schema';
import { nanoid } from 'nanoid';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import verifyTurnstileToken from '@lib/turnstile';
import { TURNSTILE_SECRET_KEY } from '$env/static/private';
import { simpleParser } from 'mailparser';

export const POST: RequestHandler = async ({
  cookies,
  request,
  getClientAddress
}) => {
  const body = await request.formData();
  const cloudflareToken = body.get('token');

  if (typeof cloudflareToken !== 'string' || !cloudflareToken) {
    error(400, 'Missing turnstile response');
  }
  const valid = await verifyTurnstileToken({
    response: cloudflareToken,
    secretKey: TURNSTILE_SECRET_KEY,
    remoteIp: getClientAddress()
  });
  if (!valid) {
    error(400, 'Invalid turnstile response');
  }
  const email = body.get('file');
  if (!(email instanceof File)) {
    error(400, 'Missing email file');
  }

  const rawEmail = await email.text();

  const parsedEmail = await simpleParser(rawEmail).catch((err) => {
    if (err instanceof Error) {
      return { error: err.message };
    } else {
      return { error: 'Unknown error' };
    }
  });

  if ('error' in parsedEmail) {
    error(400, parsedEmail.error);
  }
  console.log(parsedEmail);

  const bodyHtml = parsedEmail.html || parsedEmail.textAsHtml;
  if (!bodyHtml) {
    error(400, 'Email has no body');
  }

  const token = nanoid();
  const insert = await db.insert(emails).values({
    emailAddress: 'uploaded-email',
    token,
    emailReceived: true
  });

  await db.insert(emailStorage).values({
    emailId: Number(insert.lastInsertRowid ?? 0),
    emailFrom: parsedEmail.from?.value[0].address || 'unknown',
    emailContent: bodyHtml
  });

  cookies.set('token', token, { path: '/' });
  return json({ success: true });
};
