import { db } from '@lib/db';
import { emails, parserFeedback } from '@lib/db/schema';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { DISCORD_WEBHOOK_URL } from '$env/static/private';

const tryStringify = (data: string) => {
  try {
    return JSON.stringify(JSON.parse(data), null, 2);
  } catch {
    return data;
  }
};

export const POST: RequestHandler = async ({ cookies, request }) => {
  const token = cookies.get('token');
  if (!token) {
    error(401, 'Unauthorized');
  }
  const email = await db.query.emails.findFirst({
    where: and(eq(emails.token, token)),
    columns: {
      id: true,
      emailReceived: true
    },
    with: {
      feedback: {
        columns: {
          createdAt: true
        }
      }
    }
  });

  if (!email || !email.emailReceived) {
    error(401, 'You are not authorized to submit feedback for this email.');
  }

  if (email?.feedback?.createdAt) {
    return json({ success: false, message: 'Feedback already submitted' });
  }

  const body = await request.json();
  if (body.feedback.length > 1024) {
    return json({
      success: false,
      message: 'Feedback too long (max 1024 characters)'
    });
  }

  await db.insert(parserFeedback).values({
    emailId: email.id,
    feedback: body.feedback,
    options: body.options,
    type: body.type
  });

  if (DISCORD_WEBHOOK_URL) {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: null,
        embeds: [
          {
            title: 'New Feedback Received',
            description: `**Email ID: ${email.id}**\n` + body.feedback,
            color: body.type === 'correct' ? 6281755 : 14297627,
            fields: [
              {
                name: 'Type',
                value: body.type
              },
              {
                name: 'Options',
                value: `\`\`\`json\n${tryStringify(body.options)}\n\`\`\``
              }
            ]
          }
        ],
        username: 'Mailtools Feedback',
        avatar_url:
          'https://cdn.discordapp.com/icons/1223684143787937863/5c9be16d31e034a1531bfa195a986c2f.webp?size=96',
        attachments: []
      })
    });
    if (!response.ok) {
      console.error('Failed to send feedback to Discord');
    }
  }
  cookies.delete('token', { path: '/' });
  return json({ success: true });
};
