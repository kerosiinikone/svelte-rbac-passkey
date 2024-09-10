<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { startRegistration } from '@simplewebauthn/browser';
	import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types';

	// GET registration options from the endpoint that calls
	// @simplewebauthn/server -> generateRegistrationOptions()

	// Pass the options to the authenticator and wait for a response
	// attResp = await startRegistration(await resp.json());

	// Wait for the results of verification
	// const verificationJSON = await verificationResp.json();

	async function handleClientRegistration(res: PublicKeyCredentialCreationOptionsJSON) {
		try {
			return await startRegistration(res);
		} catch (error) {
			// Some basic error handling
			let err = error as any;
			if (err.name === 'InvalidStateError') {
				console.log('Error: Authenticator was probably already registered by user');
			} else {
				console.log(error);
			}
			throw error;
		}
	}

	async function handleClick(e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		e.preventDefault();

		const res = await fetch('/api/auth/passkeys/register/options');
		if (!res.ok) {
			// Handle error
			return;
		}
		const r = await handleClientRegistration(await res.json());
		const verificationResp = await fetch('/api/auth/passkeys/register/verify', {
			method: 'POST',
			body: JSON.stringify(r)
		});
		const verificationJSON = await verificationResp.json();

		if (verificationJSON && verificationJSON.verified) {
			goto('/profile', {
				invalidateAll: true
			});
		}
	}
</script>

<div class="h-full w-full flex flex-col justify-center items-center">
	<div
		id="dash-container"
		class="flex flex-col border-2 items-center border-slate-150 rounded-[80px] p-20 border-dashed gap-10"
	>
		<div>
			<h3 class="text-h3">Luo pääsyavain</h3>
			<h4 class="text-h4 text-slate-300">Turvallinen tapa kirjautua</h4>
		</div>
		<div class="w-full flex flex-col gap-3 items-center">
			<button
				onclick={handleClick}
				class="w-full py-2 px-10 rounded-2xl bg-gradient-to-r from-yellow-100 to-yellow-50"
			>
				<div class="flex flex-row justify-center items-center gap-3">
					<span><img width="30" alt="passkey-icon" src="/pass.png" /></span>
					Luo pääsyavain
				</div>
			</button>
			<a href="/profile" class="text-slate-300 font-light">Ohita</a>
		</div>
	</div>
</div>
