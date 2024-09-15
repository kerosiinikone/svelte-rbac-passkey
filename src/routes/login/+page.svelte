<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { PasskeyError } from '$lib/errors.js';
	import { initiatePasskeyAuthFlow } from '$lib/passkeys.js';

	const { form } = $props();
	let isPending = $state(false);

	async function handleClick(
		_: MouseEvent & {
			currentTarget: EventTarget & HTMLButtonElement;
		}
	) {
		try {
			if (await initiatePasskeyAuthFlow())
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

	$effect(() => {
		if (form) {
			isPending = false;
		}
	});
</script>

<div class="h-full w-full flex flex-col justify-center items-center">
	<div
		id="dash-container"
		class="flex flex-col border-2 items-center border-slate-150 rounded-[80px] p-20 border-dashed gap-10"
	>
		<div><h3 class="text-h3">Kirjaudu tai luo tili</h3></div>
		<div class="w-[350px]">
			<form
				method="POST"
				onsubmit={() => {
					isPending = true;
				}}
				use:enhance={() => {
					return ({ result }) => {
						if (result.type == 'success' && result.data?.error) {
							// Toast
						}
					};
				}}
				action="?/signin"
				class="flex flex-col gap-8"
			>
				<!-- Autofill -->
				<input
					type="email"
					minlength="5"
					maxlength="100"
					placeholder="Sähköposti"
					class="py-2 px-4 border-2 border-slate-150 rounded-3xl w-full bg-slate-50"
					name="email"
				/>
				<button
					disabled={isPending}
					type="submit"
					class="w-full py-2 px-10 rounded-2xl bg-gradient-to-r from-yellow-100 to-yellow-50"
				>
					{#if isPending}
						<span>Lataa...</span>
					{:else}
						<span>Jatka</span>
					{/if}
				</button>
			</form>
		</div>
		<div id="gap" class="flex flex-row gap-4 justify-center items-center">
			<span class="w-[100px] border-t-2 border-slate-150"></span><span class="text-slate-150"
				>tai</span
			><span class="w-[100px] border-t-2 border-slate-150"></span>
		</div>
		<div class="w-[350px]">
			<button
				onclick={handleClick}
				class="w-full py-2 px-10 rounded-2xl border-yellow-100 border-2"
			>
				<div class="flex flex-row justify-center items-center gap-3">
					<span><img width="30" alt="passkey-icon" src="/pass.png" /></span>
					Kirjaudu pääsyavaimella
				</div>
			</button>
		</div>
	</div>
</div>
