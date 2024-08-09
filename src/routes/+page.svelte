<script lang="ts">
	// Welcome
	import PrimaryLoginBtn from '../components/PrimaryAuthBtn.svelte';
</script>

<div class="h-full w-full flex flex-col justify-center items-center">
	<h1 class="text-h1">Tervetuloa!</h1>
	<h3 class="text-h3 text-slate-300 font-light">Kirjaudu sisään aloittaaksesi</h3>
	<div class="mt-5">
		<PrimaryLoginBtn><h3 class="text-h4"><a href="/login">Kirjaudu</a></h3></PrimaryLoginBtn>
	</div>
</div>
