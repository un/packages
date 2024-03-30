import { db } from '@lib/db';
import { emails } from '@lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { customAlphabet, nanoid } from 'nanoid';
import { EMAIL_DOMAIN } from '$env/static/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('token');
  const email = await db.query.emails.findFirst({
    where: and(eq(emails.token, token || ''), eq(emails.emailReceived, false))
  });
  if (!email) {
    const token = nanoid();
    const email = `${customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10)()}@${EMAIL_DOMAIN}`;
    await db.insert(emails).values({ emailAddress: email, token });
    cookies.set('token', token, { path: '/' });
    return { email };
  }
  return { email: email.emailAddress };
};
