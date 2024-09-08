<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import '../app.css';
	import PrimaryAuthBtn from '../lib/components/PrimaryAuthBtn.svelte';

	const { children, data } = $props();
</script>

<div class="h-screen w-screen flex flex-col items-center bg-slate-100">
	<div class="flex flex-row justify-center items-center w-full h-16 bg-black">
		<h3 class="text-white">🎉 Kirjaudu sisään</h3>
	</div>
	<div
		id="container"
		class="flex flex-col h-full bg-white rounded-[60px] w-full xl:w-3/4 mt-10 mb-20 mx-20 shadow"
	>
		<!-- Verify these or use max-w or w- -->
		<nav class="flex flex-row justify-center items-center">
			<div
				class="w-fit shrink-1 mx-10 flex flex-row justify-between items-center gap-10 py-4 px-10 bg-slate-100 rounded-3xl mt-10"
			>
				<a href="/"><span class="font-bold">RBAC</span> Demo</a>
				{#if data.user}
					<a href="/profile">Profile</a>
					<!-- Function or link or form submit? -->
					<PrimaryAuthBtn>
						<a onclick={() => invalidateAll()} href="/api/auth/logout">Kirjaudu ulos</a>
					</PrimaryAuthBtn>
				{:else}
					<PrimaryAuthBtn><a href="/login">Kirjaudu</a></PrimaryAuthBtn>
				{/if}

				<!--  -->
			</div>
		</nav>
		<div id="content" class="h-full w-full p-10">
			{@render children()}
		</div>
	</div>
</div>
