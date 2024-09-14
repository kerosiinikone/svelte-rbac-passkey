import { eq } from 'drizzle-orm';
import { db } from '../db';
import { webPasskeyTable, type PasskeyRow } from '../db/schema';

export async function getUserPasskeys(user: string): Promise<PasskeyRow[]> {
	try {
		return await db.select().from(webPasskeyTable).where(eq(webPasskeyTable.internalUserId, user));
	} catch (err) {
		const error = err as any;
		// Custom DB error from errors.ts?
		throw error;
	}
}

export async function deletePasskey(pid: string): Promise<void> {
	try {
		await db.delete(webPasskeyTable).where(eq(webPasskeyTable.credId, pid));
	} catch (err) {
		const error = err as any;
		// Custom DB error from errors.ts?
		throw error;
	}
}
