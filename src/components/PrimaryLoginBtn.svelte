<script lang="ts">
	const { children }: any = $props();
</script>

<div class="py-2 px-8 rounded-2xl bg-gradient-to-r from-yellow-100 to-yellow-50">
	{@render children()}
</div>
