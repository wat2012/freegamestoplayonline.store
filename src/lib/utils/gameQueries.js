// 新建数据库查询优化工具

import { supabase } from '$lib/supabaseClient.js';

export class GameQueryService {
	static async getGamesWithPagination(page = 1, limit = 12, category = null) {
		let query = supabase
			.from('games')
			.select('id, title, title_en, description, description_en, preview_image, preview_image_thumb, category, created_at, popularity_score', { count: 'exact' })
			.eq('published', true)
			.order('created_at', { ascending: false })
			.range((page - 1) * limit, page * limit - 1);
		
		if (category) {
			query = query.eq('category', category);
		}
		
		return await query;
	}
	
	static async getPopularGames(limit = 5) {
		return await supabase
			.from('games')
			.select('id, title, title_en, description, description_en, preview_image, preview_image_thumb, category, created_at, popularity_score')
			.eq('published', true)
			.order('popularity_score', { ascending: false })
			.order('created_at', { ascending: false })
			.limit(limit);
	}
	
	static async incrementGamePopularity(gameId) {
		// 使用RPC函数进行原子操作
		return await supabase.rpc('increment_game_popularity', {
			game_id: gameId
		});
	}
	
	static async searchGames(searchTerm, limit = 20) {
		return await supabase
			.from('games')
			.select('id, title, title_en, description, description_en, preview_image, preview_image_thumb, category, created_at, popularity_score')
			.eq('published', true)
			.or(`title.ilike.%${searchTerm}%,title_en.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,description_en.ilike.%${searchTerm}%`)
			.order('popularity_score', { ascending: false })
			.limit(limit);
	}
}
