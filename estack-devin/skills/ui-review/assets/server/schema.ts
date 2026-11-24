import { primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const uiReviewApprovals = sqliteTable('ui_review_approvals', {
  reviewer: text().notNull(),
  view: text().notNull(),
}, (table) => [primaryKey({ columns: [table.reviewer, table.view] })]);

export const uiReviewComments = sqliteTable('ui_review_comments', {
  id: text().primaryKey(),
  reviewer: text().notNull(),
  view: text().notNull(),
  text: text().notNull(),
  createdAt: text('created_at').notNull(),
});
