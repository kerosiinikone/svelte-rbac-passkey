import type { PasskeyRow, ItemRow, UserRow } from '../db/schema';
import type { MappedUser, User } from '../models/user';

export function presentItems(items: ItemRow[]) {
	return {
		items: items.map((i) => {
			return {
				role: i.role
			};
		})
	};
}

export function presentPasskeys(passkeys: PasskeyRow[]) {
	return passkeys.map((p) => ({
		id: p.credId,
		createdAt: p.createdAt
	}));
}

export function presentUser(user: UserRow) {
	return {
		name: user.email.split('@')[0] || 'User',
		role: user.role,
		verified: user.verified
	};
}

export function saveUser(user: User): MappedUser {
	return {
		id: user.getId(),
		email: user.getEmail(),
		token_version: user.getTokenVersion(),
		role: user.getRole(),
		verified: user.isVerified()
	};
}
