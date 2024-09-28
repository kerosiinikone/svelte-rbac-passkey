import { DatabaseError } from '$lib/errors';
import type { VerifiedRegistrationResponse } from '@simplewebauthn/server';
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types';
import { desc, DrizzleError, eq } from 'drizzle-orm';
import db from '../db';
import {
	userPasskeyOptions,
	webPasskeyTable,
	type PasskeyOptionsRow,
	type PasskeyRow
} from '../db/schema';

interface PasskeyCreateParameters {
	base64Data: string;
	verification: VerifiedRegistrationResponse;
	user: string;
	latestOption: PasskeyOptionsRow;
}

export async function getUserPasskeys(user: string): Promise<PasskeyRow[]> {
	try {
		return await db.select().from(webPasskeyTable).where(eq(webPasskeyTable.internalUserId, user));
	} catch (err) {
		const error = err as DrizzleError;
		throw new DatabaseError(error);
	}
}

export async function deletePasskey(pid: string): Promise<void> {
	try {
		await db.delete(webPasskeyTable).where(eq(webPasskeyTable.credId, pid));
	} catch (err) {
		const error = err as DrizzleError;
		throw new DatabaseError(error);
	}
}

export async function saveUserPasskeyOptions(
	user: string,
	options: PublicKeyCredentialCreationOptionsJSON
): Promise<void> {
	try {
		await db.insert(userPasskeyOptions).values({
			challenge: options.challenge,
			id: crypto.randomUUID(),
			userId: user,
			webauthnUserId: options.user.id
		});
	} catch (err) {
		const error = err as DrizzleError;
		throw new DatabaseError(error);
	}
}

export async function getLatestOptions(user: string): Promise<PasskeyOptionsRow> {
	try {
		return await db
			.select()
			.from(userPasskeyOptions)
			.orderBy(desc(userPasskeyOptions.created_at))
			.where(eq(userPasskeyOptions.userId, user))
			.then((res) => res[0] ?? null);
	} catch (err) {
		const error = err as DrizzleError;
		throw new DatabaseError(error);
	}
}

export async function createPasskeyEntry({
	base64Data,
	verification,
	user,
	latestOption
}: PasskeyCreateParameters) {
	try {
		await db.insert(webPasskeyTable).values({
			credPublicKey: base64Data,
			credId: verification.registrationInfo?.credentialID!,
			internalUserId: user,
			webauthnUserId: latestOption.webauthnUserId,
			counter: verification.registrationInfo?.counter!,
			backupStatus: verification.registrationInfo?.credentialBackedUp!
		});
	} catch (err) {
		const error = err as DrizzleError;
		throw new DatabaseError(error);
	}
}

export async function deleteLatestOptions(latestOption: string): Promise<void> {
	try {
		await db.delete(userPasskeyOptions).where(eq(userPasskeyOptions.id, latestOption));
	} catch (err) {
		const error = err as DrizzleError;
		throw new DatabaseError(error);
	}
}

export async function getPasskeyById(pid: string): Promise<PasskeyRow> {
	try {
		return await db
			.select()
			.from(webPasskeyTable)
			.where(eq(webPasskeyTable.credId, pid))
			.then((res) => res[0] ?? null);
	} catch (err) {
		const error = err as DrizzleError;
		throw new DatabaseError(error);
	}
}
