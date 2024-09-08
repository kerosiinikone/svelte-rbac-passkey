<script lang="ts">
	import type { Roles } from '$lib/types';
	import Item from './Item.svelte';

	const {
		items
	}: {
		items: {
			id: string;
			role: Roles;
		}[];
	} = $props();
</script>

<div class="w-3/4 flex flex-row flex-wrap gap-10 justify-center">
	{#each items as item}
		<Item {item} />
	{/each}
</div>
