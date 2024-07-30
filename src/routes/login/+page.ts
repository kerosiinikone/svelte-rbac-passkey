import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

export const load = async () => {
	const email = z.object({
		email: z.string().email()
	});
	const form = await superValidate(zod(email));

	return { form };
};
