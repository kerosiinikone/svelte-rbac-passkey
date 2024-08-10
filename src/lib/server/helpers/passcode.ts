export function createPasscode() {
	const array = new Uint32Array(6);
	crypto.getRandomValues(array);
	// Take some random index from the generated integer ?
	return array.map((i) => parseFloat(JSON.stringify(i)[0])).join('');
}
