import { db } from '@lib/db';
import { emails } from '@lib/db/schema';
import { and, eq } from 'drizzle-orm';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('token');
  const email = await db.query.emails.findFirst({
    where: and(eq(emails.token, token || ''), eq(emails.emailReceived, false))
  });
  if (!email) {
    return { email: null };
  }
  return { email: email.emailAddress };
};
