<script lang="ts">
	import '../app.css';
	const { children } = $props();
</script>

<div class="h-screen w-screen flex flex-col items-center bg-slate-100">
	<div class="flex flex-row justify-center items-center w-full h-16 bg-black">
		<h3 class="text-white">Kirjaudu!</h3>
	</div>
	<div id="container" class="w-full h-full bg-white rounded-3xl w-3/4 mt-10 mb-20 shadow">
		<!-- Verify these or use max-w or w- -->
		<nav class="flex flex-row justify-center items-center">
			<div
				class="w-[400px] shrink-1 mx-10 flex flex-row justify-between items-center gap-10 py-4 px-10 bg-slate-200 rounded-3xl mt-10"
			>
				<a><span class="font-bold">RBAC</span> Demo</a>
				<!-- <a>Profile</a> -->
				<a>Signin</a>
			</div>
		</nav>
		<div id="content" class="p-10">
			{@render children()}
		</div>
	</div>
</div>
