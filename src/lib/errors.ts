import type { DrizzleError } from 'drizzle-orm';
import { ZodError } from 'zod';

export class AuthenticationError extends Error {
	constructor(msg: string, opts?: ErrorOptions) {
		super(msg, opts);
		this.name = 'AuthenticationError';
		this.__formatErrorMsg();
	}

	__formatErrorMsg(): void {
		this.message = `${this.name}: ${this.message}`;
	}
}

export class PasskeyError extends AuthenticationError {
	constructor(msg: string, opts?: ErrorOptions) {
		super(msg, opts);
		this.name = 'PasskeyError';
		this.__formatErrorMsg();
	}
}

export class ValidationError {
	static parseZodError(err: ZodError): string {
		return err.message;
	}
}

export class DatabaseError extends Error {
	constructor(dbErr: DrizzleError) {
		super(dbErr.message);
		this.name = 'DatabaseError';
		this.__formatErrorMsg();
	}

	__formatErrorMsg(): void {
		this.message = `DatabaseError: ${this.message}`;
	}
}
