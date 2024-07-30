<script lang="ts">
	let inputs = $state(Array(6).fill('') as string[]);
	let inputRefs = $state(Array(6).fill(null));
	let focusedIndex = $state(0);

	const handleInput = (
		event: Event & {
			currentTarget: EventTarget & HTMLInputElement;
		},
		index: number
	) => {
		inputs[index] = event.currentTarget?.value[0] || '';
		if (event.currentTarget?.value && index < 5) {
			focusedIndex = index + 1;
			inputRefs[focusedIndex].focus();
		}
	};

	$effect(() => {
		if (focusedIndex === inputs.length - 1 && inputs[focusedIndex]) {
			focusedIndex = 0;
			inputRefs[focusedIndex].focus();
		}
	});
</script>

<div class="h-full w-full flex flex-col justify-center items-center">
	<div
		id="dash-container"
		class="flex flex-col border-2 items-center border-slate-150 rounded-[80px] p-20 border-dashed gap-10"
	>
		<div>
			<h3 class="text-h3">Anna pääsykoodi</h3>
			<h4 class="text-h4 text-slate-300">Anna sähköpostiisi tullut pääsykoodi</h4>
		</div>
		<div class="w-full flex flex-col gap-3">
			<form method="POST" class="flex flex-col gap-8">
				<!-- Autofill -->
				<div class="flex flex-row w-full justify-between items-center">
					{#each inputs as _, index}
						<input
							bind:value={inputs[index]}
							bind:this={inputRefs[index]}
							oninput={(e) => handleInput(e, index)}
							class="w-[45px] border-2 border-slate-150 rounded-2xl text-h3 text-center"
							maxlength="1"
							name="code-{index}"
						/>
					{/each}
				</div>
				<button class="w-full py-2 px-10 rounded-2xl bg-gradient-to-r from-yellow-100 to-yellow-50">
					Jatka
				</button>
			</form>
			<button class="text-slate-300 font-light">Lähetä uudelleen</button>
		</div>
	</div>
</div>
