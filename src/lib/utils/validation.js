// 新建验证工具文件

export function validateEmail(email) {
	if (!email) return { valid: false, message: 'Email is required' };
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return {
		valid: emailRegex.test(email),
		message: emailRegex.test(email) ? '' : 'Please enter a valid email address'
	};
}

export function validatePassword(password) {
	if (!password) return { valid: false, message: 'Password is required' };
	if (password.length < 6) return { valid: false, message: 'Password must be at least 6 characters' };
	
	const hasLetter = /[A-Za-z]/.test(password);
	const hasNumber = /\d/.test(password);
	
	if (!hasLetter || !hasNumber) {
		return { valid: false, message: 'Password must contain at least one letter and one number' };
	}
	
	return { valid: true, message: '' };
}

export function sanitizeInput(input) {
	if (typeof input !== 'string') return '';
	return input.trim()
		.replace(/[<>]/g, '') // Remove potential XSS characters
		.replace(/\s+/g, ' '); // Normalize whitespace
}

export function validateGameData(gameData) {
	const errors = [];
	
	// Title validation
	if (!gameData.title_en || gameData.title_en.trim().length < 2) {
		errors.push('English title must be at least 2 characters');
	}
	
	if (gameData.title_en && gameData.title_en.length > 100) {
		errors.push('Title must be less than 100 characters');
	}
	
	// URL validation
	if (gameData.iframe_url && !isValidURL(gameData.iframe_url)) {
		errors.push('Invalid game URL format');
	}
	
	// Category validation
	const validCategories = ['action', 'puzzle', 'strategy', 'arcade', 'adventure', 'racing', 'sports', 'casual'];
	if (gameData.category && !validCategories.includes(gameData.category)) {
		errors.push('Invalid game category');
	}
	
	// Popularity score validation
	if (gameData.popularity_score !== undefined && (gameData.popularity_score < 0 || !Number.isInteger(gameData.popularity_score))) {
		errors.push('Popularity score must be a non-negative integer');
	}
	
	return {
		isValid: errors.length === 0,
		errors
	};
}

export function isValidURL(string) {
	try {
		const url = new URL(string);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch (_) {
		return false;
	}
}

export function validateImageFile(file) {
	const maxSize = 5 * 1024 * 1024; // 5MB
	const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
	
	if (!file) return { valid: false, message: 'No file selected' };
	if (file.size > maxSize) return { valid: false, message: 'File size must be less than 5MB' };
	if (!allowedTypes.includes(file.type)) return { valid: false, message: 'Only JPEG, PNG, WebP and GIF files are allowed' };
	
	return { valid: true, message: '' };
}
