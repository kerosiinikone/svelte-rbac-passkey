<script lang="ts">
	import type { LayoutData } from '../../routes/$types';

	const { data }: { data: LayoutData } = $props();
</script>

<div class="flex flex-row justify-center items-center w-full h-16 bg-black">
	{#if !data.user}
		<h3 class="text-white">🎉 Kirjaudu sisään</h3>
	{:else}
		<h3 class="text-white">🎉 RBAC</h3>
	{/if}
</div>
