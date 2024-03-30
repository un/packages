import { relations } from 'drizzle-orm';
import { integer, text, sqliteTable, blob } from 'drizzle-orm/sqlite-core';

export const emails = sqliteTable('emails', {
  id: integer('id').primaryKey(),
  emailAddress: text('email_address').notNull(),
  token: text('token').notNull(),
  createdAt: integer('created_at').default(Date.now()),
  emailReceived: integer('email_received', { mode: 'boolean' })
    .notNull()
    .default(false)
});

export const emailRelations = relations(emails, ({ one }) => ({
  content: one(emailStorage, {
    fields: [emails.id],
    references: [emailStorage.emailId]
  }),
  feedback: one(parserFeedback, {
    fields: [emails.id],
    references: [parserFeedback.emailId]
  })
}));

export const emailStorage = sqliteTable('email_storage', {
  id: integer('id').primaryKey(),
  emailId: integer('email_id')
    .notNull()
    .references(() => emails.id),
  emailFrom: text('email_from').notNull(),
  emailContent: blob('email_content').notNull(),
  receivedAt: integer('received_at').default(Date.now())
});

export const parserFeedback = sqliteTable('parser_feedback', {
  id: integer('id').primaryKey(),
  emailId: integer('email_id')
    .notNull()
    .references(() => emails.id),
  feedback: text('feedback').notNull(),
  options: text('options').notNull(),
  type: text('type').notNull(),
  createdAt: integer('created_at').default(Date.now())
});

export const parserFeedbackRelations = relations(parserFeedback, ({ one }) => ({
  email: one(emails, {
    fields: [parserFeedback.emailId],
    references: [emails.id]
  })
}));
