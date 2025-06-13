import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { dev } from '$app/environment';

export function validateEnvironment() {
	const errors = [];
	
	if (!PUBLIC_SUPABASE_URL) {
		errors.push('PUBLIC_SUPABASE_URL is missing');
	} else if (!isValidURL(PUBLIC_SUPABASE_URL)) {
		errors.push('PUBLIC_SUPABASE_URL is not a valid URL');
	}
	
	if (!PUBLIC_SUPABASE_ANON_KEY) {
		errors.push('PUBLIC_SUPABASE_ANON_KEY is missing');
	}
	
	if (errors.length > 0) {
		const message = `Environment configuration errors:\n${errors.join('\n')}`;
		if (dev) {
			console.error(message);
			throw new Error(message);
		} else {
			console.error(message);
		}
	}
	
	return true;
}

function isValidURL(string) {
	try {
		new URL(string);
		return true;
	} catch (_) {
		return false;
	}
}

export const config = {
	supabase: {
		url: PUBLIC_SUPABASE_URL,
		anonKey: PUBLIC_SUPABASE_ANON_KEY
	},
	app: {
		name: 'FreeWebGames Store',
		version: '1.0.0',
		isDev: dev
	}
};
