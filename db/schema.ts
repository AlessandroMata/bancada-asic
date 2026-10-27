// © 2026 Alessandro Mata · alessandro.mata@gmail.com · github.com/AlessandroMata/bancada-asic · licença em LICENSE (mantenha este crédito)
import { sqliteTable, text, integer,primaryKey,index } from 'drizzle-orm/sqlite-core';
export const store = sqliteTable('store', { id: integer('id').primaryKey(), version: integer('version').notNull().default(0), data: text('data').notNull() });
export const records = sqliteTable('records',{collection:text('collection').notNull(),id:text('id').notNull(),data:text('data').notNull()},t=>[primaryKey({columns:[t.collection,t.id]})]);
export const credentials = sqliteTable('credentials',{email:text('email').primaryKey(),hash:text('hash').notNull(),salt:text('salt').notNull(),updated:integer('updated').notNull()});
export const tokens = sqliteTable('tokens',{hash:text('hash').primaryKey(),email:text('email').notNull(),kind:text('kind').notNull(),expires:integer('expires').notNull()},t=>[index('tokens_email_idx').on(t.email)]);
export const attempts = sqliteTable('attempts',{key:text('key').primaryKey(),count:integer('count').notNull(),reset:integer('reset').notNull()});
