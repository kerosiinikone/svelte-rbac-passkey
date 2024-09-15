<script lang="ts">
	import { goto } from '$app/navigation';
	import { PasskeyError } from '$lib/errors';
	import { initiatePasskeyRegisterFlow } from '$lib/passkeys';

	async function handleClick(
		_: MouseEvent & {
			currentTarget: EventTarget & HTMLButtonElement;
		}
	) {
		try {
			if (await initiatePasskeyRegisterFlow())
				goto('/profile', {
					invalidateAll: true
				});
		} catch (error) {
			let err = error as any;
			if (err instanceof PasskeyError) {
				// Toast
			}
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
