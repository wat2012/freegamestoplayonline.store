// 新建错误处理工具

export class ErrorHandler {
	static handle(error, context = '') {
		console.error(`Error in ${context}:`, error);
		
		// 根据错误类型返回用户友好的消息
		if (error.message?.includes('Network request failed')) {
			return 'Network connection error. Please check your internet connection.';
		}
		
		if (error.message?.includes('Invalid login credentials')) {
			return 'Invalid email or password.';
		}
		
		if (error.message?.includes('Email not confirmed')) {
			return 'Please check your email and confirm your account.';
		}
		
		// 默认错误消息
		return 'An unexpected error occurred. Please try again.';
	}
	
	static async withErrorHandling(asyncFn, context = '') {
		try {
			return await asyncFn();
		} catch (error) {
			const message = this.handle(error, context);
			throw new Error(message);
		}
	}
}
