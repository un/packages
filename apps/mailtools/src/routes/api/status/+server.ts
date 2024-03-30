import { db } from '@lib/db';
import { emails } from '@lib/db/schema';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ cookies }) => {
  const token = cookies.get('token');
  if (!token) {
    error(401, 'Unauthorized');
  }
  const email = await db.query.emails.findFirst({
    where: and(eq(emails.token, token)),
    columns: {
      emailReceived: true
    }
  });

  if (!email) {
    error(401, 'Unauthorized');
  }

  return json({
    received: email.emailReceived
  });
};
