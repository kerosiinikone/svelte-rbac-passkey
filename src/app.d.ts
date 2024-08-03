// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: {
				email: string;
				id: string;
				role: Roles;
				token_version: number;
			};
		}
		interface LayoutData {
			user?: {
				email: string;
				id: string;
				role: Roles;
				token_version: number;
			};
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
