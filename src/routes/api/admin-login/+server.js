import { json } from '@sveltejs/kit';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '$env/static/private';

// 简单的内存速率限制（生产环境应使用Redis等）
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15分钟

function getRateLimitKey(request) {
	return request.headers.get('x-forwarded-for') || 
		   request.headers.get('x-real-ip') || 
		   'unknown';
}

function isRateLimited(key) {
	const attempts = loginAttempts.get(key);
	if (!attempts) return false;
	
	const now = Date.now();
	if (now - attempts.lastAttempt > LOCKOUT_TIME) {
		loginAttempts.delete(key);
		return false;
	}
	
	return attempts.count >= MAX_ATTEMPTS;
}

function recordAttempt(key, success) {
	const now = Date.now();
	const attempts = loginAttempts.get(key) || { count: 0, lastAttempt: 0 };
	
	if (success) {
		loginAttempts.delete(key);
	} else {
		attempts.count++;
		attempts.lastAttempt = now;
		loginAttempts.set(key, attempts);
	}
}

export async function POST({ request }) {
	try {
		const rateLimitKey = getRateLimitKey(request);
		
		// 检查速率限制
		if (isRateLimited(rateLimitKey)) {
			return json({ 
				success: false, 
				message: 'Too many login attempts. Please try again later.' 
			}, { status: 429 });
		}

		const { email, password } = await request.json();

		// 输入验证
		if (!email || !password) {
			recordAttempt(rateLimitKey, false);
			return json({ 
				success: false, 
				message: 'Email and password are required' 
			}, { status: 400 });
		}

		// 验证邮箱格式
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			recordAttempt(rateLimitKey, false);
			return json({ 
				success: false, 
				message: 'Invalid email format' 
			}, { status: 400 });
		}

		// 验证凭据（生产环境应使用bcrypt等安全哈希）
		if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
			recordAttempt(rateLimitKey, true);
			console.log(`Admin login successful from IP: ${rateLimitKey} at ${new Date().toISOString()}`);
			return json({ success: true });
		} else {
			recordAttempt(rateLimitKey, false);
			console.log(`Failed admin login attempt from IP: ${rateLimitKey}, email: ${email} at ${new Date().toISOString()}`);
			return json({ 
				success: false, 
				message: 'Invalid credentials' 
			}, { status: 401 });
		}
	} catch (error) {
		console.error('Admin login error:', error);
		return json({ 
			success: false, 
			message: 'Internal server error' 
		}, { status: 500 });
	}
}

export async function GET({ url }) {
	try {
		const email = url.searchParams.get('email');
		
		if (!email) {
			return json({ success: false, isAdmin: false }, { status: 400 });
		}
		
		// 验证邮箱格式
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return json({ success: false, isAdmin: false }, { status: 400 });
		}
		
		const isAdmin = email === ADMIN_EMAIL;
		return json({ success: true, isAdmin });
	} catch (error) {
		console.error('Admin validation error:', error);
		return json({ 
			success: false, 
			message: 'Internal server error' 
		}, { status: 500 });
	}
}
