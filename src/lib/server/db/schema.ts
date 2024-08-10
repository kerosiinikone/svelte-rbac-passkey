import type { Roles } from '$lib/types';
import { boolean, index, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['DEFAULT', 'PREMIUM', 'ADMIN']);

export const usersTable = pgTable(
	'users',
	{
		id: text('id').primaryKey(),
		email: text('email').notNull(),
		verified: boolean('verified').notNull().default(false),
		role: roleEnum('role').$type<Roles>().notNull(),
		token_version: integer('token_version').notNull().default(1)
	},
	(table) => {
		return {
			email: index('user_email_idx').on(table.email)
		};
	}
);

export const webPasskeyTable = pgTable(
	'webPasskeys',
	{
		credId: text('cred_id').notNull().primaryKey(),
		credPublicKey: text('cred_public_key').notNull(),
		internalUserId: text('internal_user_id')
			.notNull()
			.references(() => usersTable.id),
		webauthnUserId: text('webauthn_user_id').notNull(),
		counter: integer('counter').notNull(),
		backupEligible: boolean('backup_eligible').notNull().default(false),
		backupStatus: boolean('backup_status').notNull().default(false),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		lastUsed: timestamp('last_used')
	},
	(table) => {
		return {
			email: index('internalUserId_idx').on(table.internalUserId)
		};
	}
);

export const userPasskeyOptions = pgTable('passkeyOptions', {
	id: text('id').primaryKey().notNull(),
	challenge: text('challenge').notNull(),
	webauthnUserId: text('webauthn_user_id').notNull(),
	userId: text('usedId')
		.notNull()
		.references(() => usersTable.id),
	created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
});

export const userAuthOptions = pgTable('authOptions', {
	id: text('id').primaryKey().notNull(),
	challenge: text('challenge').notNull(),
	userId: text('usedId')
		.notNull()
		.references(() => usersTable.id),
	created_at: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
});

export const passcodeTable = pgTable(
	'passcodes',
	{
		id: text('id').primaryKey(),
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
