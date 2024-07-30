/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		fontFamily: {
			sans: [
				'"Inter var", sans-serif',
				{
					fontFeatureSettings: '"cv11", "ss01"',
					fontVariationSettings: '"opsz" 32'
				}
			]
		},
		extend: {
			fontSize: {
				h1: 'var(--h1-font-size)',
				h2: 'var(--h2-font-size)',
				h3: 'var(--h3-font-size)',
				h4: 'var(--h4-font-size)'
			}
		}
	},
	plugins: []
};
