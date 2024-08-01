import { db } from '$lib/server/db/index.js';
import { passcodeTable } from '$lib/server/db/schema.js';
import { desc, eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { error, fail } from '@sveltejs/kit';

export const actions = {
	default: async (e) => {
		const formData = await e.request.formData();
		const inputCode = formData.get('code') as string;

		// Get the email from a secure cookie
		const email: string = JSON.parse(e.cookies.get('email') as string);

		if (!email) {
			error(500, 'No Email');
		}

		// Get the LATEST code for a particular email
		const code = await db
			.select({ code: passcodeTable.passcode, id: passcodeTable.id })
			.from(passcodeTable)
			.orderBy(desc(passcodeTable.created_at))
			.where(eq(passcodeTable.email, email))
			.then((res) => res[0] ?? null);

		// Compare codes
		const isValid = await bcrypt.compare(inputCode, code.code);

		if (!isValid) {
			fail(400);
		}

		// Clear cookie
		e.cookies.delete('email', {
			path: '/'
		});

		// Delete passcode entry
		await db.delete(passcodeTable).where(eq(passcodeTable.id, code.id));

		console.log('Code is correct');
	}
};
