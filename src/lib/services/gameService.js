import { supabase } from '$lib/supabaseClient.js';
import { cacheService } from './cacheService.js';

export class GameService {
	static retryOptions = {
		maxRetries: 3,
		retryDelay: 1000
	};

	static async withRetry(operation, context = '') {
		let lastError;
		
		for (let i = 0; i < this.retryOptions.maxRetries; i++) {
			try {
				return await operation();
			} catch (error) {
				lastError = error;
				console.warn(`${context} attempt ${i + 1} failed:`, error.message);
				
				if (i < this.retryOptions.maxRetries - 1) {
					await new Promise(resolve => setTimeout(resolve, this.retryOptions.retryDelay * (i + 1)));
				}
			}
		}
		
		throw new Error(`${context} failed after ${this.retryOptions.maxRetries} attempts: ${lastError.message}`);
	}

	// 优化的游戏列表查询 - 只查询必要字段
	static async getGames(category = null, page = 1, limit = 12) {
		const cacheKey = cacheService.generateKey('games', { category, page, limit });
		
		return await cacheService.getOrSet(cacheKey, async () => {
			let query = supabase
				.from('games')
				.select(`
					id,
					title,
					title_en,
					description,
					description_en,
					preview_image,
					preview_image_thumb,
					category,
					created_at,
					popularity_score,
					iframe_url
				`)
				.eq('published', true);

			if (category) {
				query = query.eq('category', category);
			}

			const { data, error, count } = await query
				.order('created_at', { ascending: false })
				.range((page - 1) * limit, page * limit - 1);

			if (error) throw error;
			return { data: data || [], count };
		}, 5 * 60 * 1000); // 5分钟缓存
	}

	// 热门游戏 - 长缓存
	static async getPopularGames(limit = 5) {
		const cacheKey = cacheService.generateKey('popularGames', { limit });
		
		return await cacheService.getOrSet(cacheKey, async () => {
			const { data, error } = await supabase
				.from('games')
				.select(`
					id,
					title,
					title_en,
					description,
					description_en,
					preview_image,
					preview_image_thumb,
					category,
					created_at,
					popularity_score,
					iframe_url
				`)
				.eq('published', true)
				.order('popularity_score', { ascending: false })
				.order('created_at', { ascending: false })
				.limit(limit);

			if (error) throw error;
			return data || [];
		}, 10 * 60 * 1000); // 10分钟缓存
	}

	// 最新游戏
	static async getLatestGames(limit = 5) {
		const cacheKey = cacheService.generateKey('latestGames', { limit });
		
		return await cacheService.getOrSet(cacheKey, async () => {
			const { data, error } = await supabase
				.from('games')
				.select(`
					id,
					title,
					title_en,
					description,
					description_en,
					preview_image,
					preview_image_thumb,
					category,
					created_at,
					popularity_score,
					iframe_url
				`)
				.eq('published', true)
				.order('created_at', { ascending: false })
				.limit(limit);

			if (error) throw error;
			return data || [];
		}, 5 * 60 * 1000); // 5分钟缓存
	}

	// 游戏详情 - 包含完整信息
	static async getGameById(id) {
		if (!id) throw new Error('Game ID is required');
		
		const cacheKey = cacheService.generateKey('gameDetail', { id });
		
		return await cacheService.getOrSet(cacheKey, async () => {
			return await this.withRetry(async () => {
				const { data, error } = await supabase
					.from('games')
					.select('*')
					.eq('id', id)
					.eq('published', true)
					.single();

				if (error) {
					if (error.code === 'PGRST116') {
						throw new Error('Game not found');
					}
					throw error;
				}
				
				if (!data) {
					throw new Error('Game not found');
				}
				
				return data;
			}, `getGameById(${id})`);
		}, 15 * 60 * 1000); // 15分钟缓存
	}

	// 搜索游戏 - 短缓存
	static async searchGames(searchTerm, limit = 20) {
		const cacheKey = cacheService.generateKey('search', { searchTerm, limit });
		
		return await cacheService.getOrSet(cacheKey, async () => {
			const { data, error } = await supabase
				.from('games')
				.select(`
					id,
					title,
					title_en,
					description,
					description_en,
					preview_image,
					preview_image_thumb,
					category,
					created_at,
					popularity_score
				`)
				.eq('published', true)
				.or(`title.ilike.%${searchTerm}%,title_en.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,description_en.ilike.%${searchTerm}%`)
				.order('popularity_score', { ascending: false })
				.limit(limit);

			if (error) throw error;
			return data || [];
		}, 2 * 60 * 1000); // 2分钟缓存
	}

	// 游戏统计 - 长缓存
	static async getGameStats() {
		const cacheKey = 'gameStats';
		
		return await cacheService.getOrSet(cacheKey, async () => {
			const { data, error } = await supabase
				.from('games')
				.select('category, published, popularity_score');

			if (error) throw error;

			const stats = {
				total: data.length,
				published: data.filter(g => g.published).length,
				draft: data.filter(g => !g.published).length,
				totalViews: data.reduce((sum, game) => sum + (game.popularity_score || 0), 0),
				byCategory: {}
			};

			data.forEach(game => {
				const category = game.category || 'uncategorized';
				stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
			});

			return stats;
		}, 30 * 60 * 1000); // 30分钟缓存
	}

	// 批量预加载
	static async preloadGameData() {
		const promises = [
			this.getPopularGames(5),
			this.getLatestGames(5),
			this.getGameStats()
		];
		
		try {
			await Promise.allSettled(promises);
			console.log('Game data preloaded successfully');
		} catch (error) {
			console.warn('Preload warning:', error);
		}
	}

	// 清除特定缓存
	static clearCache(type = null) {
		if (type) {
			// 清除特定类型的缓存
			cacheService.memoryCache.forEach((_, key) => {
				if (key.includes(type)) {
					cacheService.delete(key);
				}
			});
		} else {
			cacheService.clear();
		}
	}

	// 增加游戏浏览量 - 防抖处理
	static async incrementPopularity(gameId) {
		if (!gameId) return;
		
		const throttleKey = `popularity_${gameId}`;
		const lastIncrement = this.lastIncrements?.[throttleKey];
		const now = Date.now();
		
		if (lastIncrement && now - lastIncrement < 60000) {
			return;
		}

		this.lastIncrements = this.lastIncrements || {};
		this.lastIncrements[throttleKey] = now;

		try {
			await this.withRetry(async () => {
				const { error } = await supabase.rpc('increment_game_popularity', { 
					game_id: gameId 
				});
				if (error) throw error;
			}, `incrementPopularity(${gameId})`);
			
			// 清除相关缓存
			this.clearCache('gameDetail');
			this.clearCache('popularGames');
		} catch (error) {
			console.error('Error incrementing popularity:', error);
		}
	}
}
