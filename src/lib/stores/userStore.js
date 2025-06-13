// 新建用户状态管理

import { writable, derived } from 'svelte/store';
import { supabase } from '$lib/supabaseClient.js';

export const user = writable(null);
export const userType = writable(null);
export const loading = writable(true);

// 派生状态
export const isLoggedIn = derived(user, $user => !!$user);
export const isAdmin = derived(userType, $userType => $userType === 'admin');
export const isUser = derived(userType, $userType => $userType === 'user');

// 初始化用户状态
export async function initializeAuth() {
	loading.set(true);
	
	try {
		const { data: { session } } = await supabase.auth.getSession();
		user.set(session?.user || null);
		
		// 监听认证状态变化
		supabase.auth.onAuthStateChange((event, session) => {
			user.set(session?.user || null);
			
			if (session?.user) {
				// 根据路径或其他逻辑确定用户类型
				const path = window.location.pathname;
				if (path.startsWith('/admin')) {
					userType.set('admin');
				} else if (path.startsWith('/user')) {
					userType.set('user');
				}
			} else {
				userType.set(null);
			}
		});
	} catch (error) {
		console.error('Auth initialization error:', error);
	} finally {
		loading.set(false);
	}
}
