import { eq } from 'drizzle-orm';
import { db } from '../db';
import { usersTable, type UserRow } from '../db/schema';
import type { Roles } from '$lib/types';
import type { MappedUser } from '../models/user';

export async function getUserRole(user: string): Promise<Roles> {
	try {
		return await db
			.select({ role: usersTable.role })
			.from(usersTable)
			.where(eq(usersTable.id, user))
			.then((res) => res[0].role ?? null);
	} catch (err) {
		const error = err as any;
		// Custom DB error from errors.ts?
		throw error;
	}
}

export async function getUserById(id: string): Promise<UserRow | null> {
	try {
		return await db
			.select()
			.from(usersTable)
			.where(eq(usersTable.id, id))
			.then((res) => res[0] ?? null);
	} catch (err) {
		const error = err as any;
		// Custom DB error from errors.ts?
		throw error;
	}
}

export async function createUser(user: MappedUser): Promise<void> {
	try {
		await db
			.insert(usersTable)
			.values(user)
			.returning()
			.then((res) => res[0]);
	} catch (err) {
		const error = err as any;
		// Custom DB error from errors.ts?
		throw error;
	}
}
