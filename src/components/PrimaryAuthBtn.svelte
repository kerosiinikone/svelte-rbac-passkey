<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	const { children, extraClass }: any = $props();
</script>

<div
	class={twMerge(
		'flex flex-row justify-center items-center py-2 px-8 rounded-2xl bg-gradient-to-r from-yellow-100 to-yellow-50',
		extraClass as string
	)}
>
	{@render children()}
</div>
