import { db } from '$lib/server/db/index.js';
import { itemsTable, usersTable } from '$lib/server/db/schema.js';
import { Roles } from '$lib/types.js';
import { eq, or } from 'drizzle-orm';

const premiumList = [Roles.DEFAULT, Roles.PREMIUM];
const defaultList = [Roles.DEFAULT];

export const load = async ({ parent }) => {
	const data = await parent();

	if (!data.user) {
		return;
	}

	// Fetch all and hide some on the client side?

	const { role } = await db
		.select({ role: usersTable.role })
		.from(usersTable)
		.where(eq(usersTable.id, data.user))
		.then((res) => res[0] ?? null);

	const items = await db
		.select()
		.from(itemsTable)
		.where(
			or(
				...(role === Roles.DEFAULT
					? defaultList.map((r) => {
							return eq(itemsTable.role, r);
						})
					: premiumList.map((r) => {
							return eq(itemsTable.role, r);
						}))
			)
		);

	return { items };
};
