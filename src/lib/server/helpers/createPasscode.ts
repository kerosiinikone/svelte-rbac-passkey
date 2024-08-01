export default function createPasscode() {
	const array = new Uint32Array(6);
	crypto.getRandomValues(array);
	return array.map((i) => parseFloat(JSON.stringify(i)[0])).join('');
}
