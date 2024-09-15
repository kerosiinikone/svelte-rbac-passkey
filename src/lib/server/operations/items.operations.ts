import { Roles } from '$lib/types';
import { DrizzleError, eq, or } from 'drizzle-orm';
import db from '../db';
import { itemsTable, type ItemRow } from '../db/schema';
import { DatabaseError } from '../../errors';

const premiumList = [Roles.DEFAULT, Roles.PREMIUM];
const defaultList = [Roles.DEFAULT];

export async function getItemsByRole(role: Roles): Promise<ItemRow[]> {
	try {
		return await db
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
	} catch (err) {
		const error = err as DrizzleError;
		throw new DatabaseError(error);
	}
}
