import { desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { passcodeTable, usersTable, type PasscodeRow, type UserRow } from '../db/schema';
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

export async function getUserByEmail(email: string): Promise<UserRow> {
	try {
		return await db
			.select()
			.from(usersTable)
			.where(eq(usersTable.email, email))
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

export async function setIsVerifiedUser(user: string) {
	try {
		await db
			.update(usersTable)
			.set({
				verified: true
			})
			.where(eq(usersTable.id, user));
	} catch (err) {
		const error = err as any;
		// Custom DB error from errors.ts?
		throw error;
	}
}

export async function updateUserRole(role: Roles, loggedInUser: string): Promise<void> {
	try {
		await db
			.update(usersTable)
			.set({
				role
			})
			.where(eq(usersTable.id, loggedInUser));
	} catch (err) {
		const error = err as any;
		// Custom DB error from errors.ts?
		throw error;
	}
}

export async function createPasscodeEntry(hashedCode: string, email: string): Promise<void> {
	try {
		await db.insert(passcodeTable).values({
			id: crypto.randomUUID(),
			email,
			passcode: hashedCode
		});
	} catch (err) {
		const error = err as any;
		// Custom DB error from errors.ts?
		throw error;
	}
}

export async function getPasscodeEntry(email: string): Promise<PasscodeRow> {
	try {
		return await db
			.select()
			.from(passcodeTable)
			.orderBy(desc(passcodeTable.created_at))
			.where(eq(passcodeTable.email, email))
			.then((res) => res[0] ?? null);
	} catch (err) {
		const error = err as any;
		// Custom DB error from errors.ts?
		throw error;
	}
}

export async function deletePasscodeEntry(code: PasscodeRow): Promise<void> {
	try {
		await db.delete(passcodeTable).where(eq(passcodeTable.id, code.id));
	} catch (err) {
		const error = err as any;
		// Custom DB error from errors.ts?
		throw error;
	}
}
