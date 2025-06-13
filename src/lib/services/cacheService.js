import { browser } from '$app/environment';

class CacheService {
	constructor() {
		this.memoryCache = new Map();
		this.maxMemoryItems = 100; // Prevent memory leaks
		this.cacheConfig = {
			games: { ttl: 5 * 60 * 1000 }, // 5分钟
			popularGames: { ttl: 10 * 60 * 1000 }, // 10分钟
			categories: { ttl: 30 * 60 * 1000 }, // 30分钟
			gameDetail: { ttl: 15 * 60 * 1000 }, // 15分钟
		};
		
		// 定期清理过期缓存
		if (browser) {
			setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
		}
	}

	generateKey(prefix, params = {}) {
		const paramString = Object.keys(params)
			.sort()
			.map(key => `${key}:${JSON.stringify(params[key])}`)
			.join('|');
		return `${prefix}${paramString ? `_${paramString}` : ''}`;
	}

	set(key, data, ttl = 5 * 60 * 1000) {
		try {
			// 内存缓存大小限制
			if (this.memoryCache.size >= this.maxMemoryItems) {
				this.cleanupOldest();
			}
			
			const expiry = Date.now() + ttl;
			const cacheItem = { data, expiry, accessTime: Date.now() };
			
			this.memoryCache.set(key, cacheItem);
			
			// 浏览器端同时存储到localStorage (仅存储小数据)
			if (browser && this.shouldPersist(key)) {
				try {
					const serialized = JSON.stringify(cacheItem);
					if (serialized.length < 50000) { // 限制localStorage存储大小
						localStorage.setItem(`cache_${key}`, serialized);
					}
				} catch (e) {
					console.warn('Cache localStorage error:', e.message);
				}
			}
		} catch (error) {
			console.error('Cache set error:', error);
		}
	}

	get(key) {
		try {
			// 先检查内存缓存
			let cached = this.memoryCache.get(key);
			
			// 如果内存中没有，检查localStorage
			if (!cached && browser && this.shouldPersist(key)) {
				try {
					const stored = localStorage.getItem(`cache_${key}`);
					if (stored) {
						cached = JSON.parse(stored);
					}
				} catch (e) {
					localStorage.removeItem(`cache_${key}`);
				}
			}

			if (!cached) return null;

			// 检查是否过期
			if (Date.now() > cached.expiry) {
				this.delete(key);
				return null;
			}

			// 更新访问时间
			if (cached.accessTime) {
				cached.accessTime = Date.now();
			}

			// 如果从localStorage恢复，同时放入内存缓存
			if (!this.memoryCache.has(key)) {
				this.memoryCache.set(key, cached);
			}

			return cached.data;
		} catch (error) {
			console.error('Cache get error:', error);
			return null;
		}
	}

	delete(key) {
		this.memoryCache.delete(key);
		if (browser) {
			localStorage.removeItem(`cache_${key}`);
		}
	}

	clear() {
		this.memoryCache.clear();
		if (browser) {
			// 清除所有缓存相关的localStorage项
			Object.keys(localStorage)
				.filter(key => key.startsWith('cache_'))
				.forEach(key => localStorage.removeItem(key));
		}
	}

	cleanupExpired() {
		const now = Date.now();
		for (const [key, value] of this.memoryCache) {
			if (value.expiry && now > value.expiry) {
				this.delete(key);
			}
		}
	}

	cleanupOldest() {
		// 清理最老的20%缓存项
		const entries = Array.from(this.memoryCache.entries())
			.sort((a, b) => (a[1].accessTime || 0) - (b[1].accessTime || 0));
		
		const toRemove = Math.floor(entries.length * 0.2);
		for (let i = 0; i < toRemove; i++) {
			this.delete(entries[i][0]);
		}
	}

	shouldPersist(key) {
		// 只持久化某些类型的缓存
		return key.includes('popularGames') || key.includes('categories') || key.includes('gameStats');
	}

	// 批量操作优化
	async getOrSet(key, fetchFn, ttl) {
		const cached = this.get(key);
		if (cached) return cached;

		try {
			const data = await fetchFn();
			this.set(key, data, ttl);
			return data;
		} catch (error) {
			console.error('Cache fetch error:', error);
			throw error;
		}
	}

	// 获取缓存统计信息
	getStats() {
		return {
			memoryItems: this.memoryCache.size,
			maxItems: this.maxMemoryItems
		};
	}
}

export const cacheService = new CacheService();
