import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export enum Roles {
	DEFAULT = 'DEFAULT',
	PREMIUM = 'PREMIUM',
	ADMIN = 'ADMIN'
}

export const roleEnum = pgEnum('role', ['DEFAULT', 'PREMIUM', 'ADMIN']);

export const usersTable = pgTable(
	'users',
	{
		id: uuid('id').primaryKey(),
		email: text('email').notNull(),
		role: roleEnum('role').$type<Roles>().notNull(),
		token_version: integer('token_version').notNull().default(1)
	},
	(table) => {
		return {
			email: index('user_email_idx').on(table.email)
		};
	}
);

export const passcodeTable = pgTable(
	'passcodes',
	{
		id: uuid('id').primaryKey(),
		email: text('email').notNull(),
		passcode: text('passcode').notNull(), // hashed -> not an integer
		created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
	},
	(table) => {
		return {
			email: index('pass_email_idx').on(table.email)
		};
	}
);
