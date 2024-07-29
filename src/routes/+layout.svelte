<script lang="ts">
	import '../app.css';
	const { children } = $props();
</script>

<div class="h-screen w-screen bg-slate-100">
	<nav>
		<a>Logo</a>
		<a>Profile</a>
		<a>Signin</a>
	</nav>
	<div>
		{@render children()}
	</div>
</div>
