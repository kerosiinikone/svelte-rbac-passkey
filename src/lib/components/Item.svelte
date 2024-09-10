<script lang="ts">
	import type { Roles } from '$lib/types';

	const { item }: { item: { role: Roles } } = $props();
</script>

<div class="flex flex-col justify-around p-6 h-64 w-64 shrink rounded-xl border-2">
	<h3 class="text-h3">Item</h3>
	<p>Tämä on item</p>
	<p class="py-2 px-5 rounded-lg bg-slate-100 w-fit">{item.role}</p>
</div>
