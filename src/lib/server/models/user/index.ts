import { ValidationError } from '$lib/errors';
import type { UserRow } from '$lib/server/db/schema';
import { Roles } from '$lib/types';
import { z, ZodError } from 'zod';

const userSchema = z.object({
	id: z.string().length(36),
	role: z.nativeEnum(Roles),
	email: z.string().email(),
	verified: z.boolean(),
	token_version: z.number()
});

export class User {
	private readonly token_version: number;

	constructor(
		private readonly id: string,
		private readonly role: Roles,
		private readonly email: string,
		private readonly verified: boolean
	) {
		this.token_version = 1;
		this.validateEntity();
	}
	getId() {
		return this.id;
	}
	getName() {
		if (this.email) return this.email.split('@')[0];
		return 'User';
	}
	getEmail() {
		return this.email;
	}
	getTokenVersion() {
		return this.token_version;
	}
	getRole() {
		return this.role;
	}
	isVerified() {
		return this.verified;
	}
	private validateEntity() {
		try {
			userSchema.safeParse(this);
		} catch (err) {
			const error = err as ZodError;
			throw new ValidationError('Invalid user', error);
		}
	}
}

export type MappedUser = UserRow;
