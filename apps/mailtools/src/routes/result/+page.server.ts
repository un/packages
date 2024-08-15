import { db } from '@lib/db';
import { emails } from '@lib/db/schema';
import { and, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies, url }) => {
  const token = url.searchParams.get('token') || cookies.get('token');
  const email = await db.query.emails.findFirst({
    where: and(eq(emails.token, token || 'none')),
    columns: {
      emailReceived: true
    },
    with: {
      content: {
        columns: {
          emailContent: true
        }
      }
    }
  });
  if (!email) {
    cookies.delete('token', { path: '/' });
    error(401, 'Unauthorized');
  }

  if (!email.emailReceived) {
    return {
      received: false,
      content: ''
    };
  } else {
    return {
      received: true,
      content: email.content?.emailContent as string
    };
  }
};
