import { db } from '@lib/db';
import { emails } from '@lib/db/schema';
import { customAlphabet, nanoid } from 'nanoid';
import { EMAIL_DOMAIN } from '$env/static/private';
import { error, json, type RequestHandler } from '@sveltejs/kit';

import verifyTurnstileToken from '@lib/turnstile';
import { TURNSTILE_SECRET_KEY } from '$env/static/private';

const emailDisabled = true;

export const POST: RequestHandler = async ({
  cookies,
  request,
  getClientAddress
}) => {
  if (emailDisabled) return error(404, 'Email generation is disabled');

  const body = await request.json();
  if (!body.token) {
    error(400, 'Missing turnstile response');
  }
  const valid = await verifyTurnstileToken({
    response: body.token,
    secretKey: TURNSTILE_SECRET_KEY,
    remoteIp: getClientAddress()
  });
  if (!valid) {
    error(400, 'Invalid turnstile response');
  }
  const token = nanoid();
  const email = `${customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10)()}@${EMAIL_DOMAIN}`;
  await db.insert(emails).values({ emailAddress: email, token });
  cookies.set('token', token, { path: '/' });
  return json({ email });
};
