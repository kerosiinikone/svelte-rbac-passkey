<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { goto, invalidate, invalidateAll } from '$app/navigation';
	import { PasskeyError } from '$lib/errors';
	import { initiatePasskeyRegisterFlow } from '$lib/passkeys';
	import { Roles } from '$lib/types';
	import PrimaryAuthBtn from '../../lib/components/PrimaryAuthBtn.svelte';

	const { data } = $props();
	let role: Roles = $state(data.user!.role);

	async function handleClick() {
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

	function handleRoleSwitch(r: Roles) {
		role = r;
	}
</script>

<!-- Edit here -> remember to add a confirm delete prompt -->
{#snippet passkeyItem(passkey: any, _: number)}
	<div>
		<p>{passkey.id}</p>
		<p class="text-slate-200">{passkey.createdAt.toLocaleString()}</p>
		<form
			method="POST"
			use:enhance={({ formData }) => {
				formData.append('pid', passkey.id);
				return async ({ result }) => {
					if (result.type == 'success' && result.data?.error) {
						// Toast
					}
					invalidate('/');
					await applyAction(result);
				};
			}}
			action="?/deletePasskey"
		>
			<button type="submit" class="text-red-400">Delete</button>
		</form>
	</div>
{/snippet}

<div class="h-full w-full flex flex-col justify-center items-center">
	<div
		id="dash-container"
		class="flex flex-col border-2 items-center border-slate-150 rounded-[80px] py-10 px-20 border-dashed gap-10"
	>
		<div id="email-img-section" class="flex flex-row items-center jusitfy-center gap-5">
			<span
				><svg
					xmlns="http://www.w3.org/2000/svg"
					width="60"
					height="60"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-user"
					><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle
						cx="12"
						cy="7"
						r="4"
					/></svg
				></span
			>
			<h4 class="text-h4">
				{data.user?.name}
			</h4>
		</div>
		<div id="role-section" class="w-full flex flex-col gap-5 justify-center">
			<h4 class="text-h4 font-semibold">Roolit</h4>
			<form
				method="POST"
				action="?/switchRole"
				use:enhance={({ submitter, formData }) => {
					switch (submitter?.getAttribute('name') as Roles) {
						case Roles.DEFAULT:
							formData.append('role', Roles.DEFAULT);
							break;
						case Roles.PREMIUM:
							formData.append('role', Roles.PREMIUM);
							break;
						default:
							break;
					}
					return async ({ result }) => {
						if (result.type == 'success' && result.data?.error) {
							// Toast
						}
						invalidate('/');
						await applyAction(result);
					};
				}}
				class="flex flex-row gap-4"
			>
				<button
					name={Roles.DEFAULT}
					type="submit"
					onclick={() => handleRoleSwitch(Roles.DEFAULT)}
					class={role === Roles.DEFAULT
						? 'py-2 px-5 bg-slate-100 rounded-lg border-2 border-slate-300'
						: 'py-2 px-5 bg-slate-50 rounded-lg'}>Tavallinen</button
				>
				<button
					name={Roles.PREMIUM}
					type="submit"
					onclick={() => handleRoleSwitch(Roles.PREMIUM)}
					class={role === Roles.PREMIUM
						? 'py-2 px-5 bg-slate-100 rounded-lg border-2 border-slate-300'
						: 'py-2 px-5 bg-slate-50 rounded-lg'}>Premium</button
				>
			</form>
		</div>
		<div id="passkey-section" class="w-full flex flex-col gap-4 justify-center">
			<h4 class="text-h4 font-semibold">Pääsyavaimet</h4>
			{#if data.verifiedPasskeys?.length! > 0}
				{#each data.verifiedPasskeys! as passkey, i}
					{@render passkeyItem(passkey, i)}
				{/each}
			{:else}
				<p>No passkeys</p>
			{/if}
			<button onclick={handleClick} class="flex flex-row gap-2 cursor-pointer text-slate-300">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg
				>
				Lisää pääsyavain
			</button>
		</div>
		<div id="logout-btn-section" class="w-full flex flex-col gap-2 items-center justify-center">
			<PrimaryAuthBtn extraClass="w-full">
				<a onclick={() => invalidateAll()} href="/api/auth/logout">Kirjaudu ulos</a>
			</PrimaryAuthBtn>
		</div>
	</div>
</div>
