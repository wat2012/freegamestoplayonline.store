import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		// Enable source maps for better debugging
		sourcemap: true,
		// Optimize for SEO and performance
		rollupOptions: {
			output: {
				// Better caching for static assets
				assetFileNames: 'assets/[name]-[hash][extname]',
				chunkFileNames: 'chunks/[name]-[hash].js',
				entryFileNames: 'entries/[name]-[hash].js'
			}
		}
	},
	// Optimize for better Core Web Vitals
	server: {
		// Enable compression
		compress: true
	}
});
