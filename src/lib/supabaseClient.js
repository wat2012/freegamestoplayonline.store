import { createClient } from '@supabase/supabase-js';
import { validateEnvironment, config } from '$lib/config/environment.js';

// 验证环境变量
validateEnvironment();

const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
		detectSessionInUrl: false
	},
	global: {
		headers: {
			'X-Client-Info': 'vipgame-web@1.0.0'
		}
	}
});
