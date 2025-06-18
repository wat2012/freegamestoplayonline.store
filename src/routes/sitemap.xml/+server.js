import { supabase } from '$lib/supabaseClient.js';

// 简单的内存缓存
let sitemapCache = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1小时缓存

export async function GET() {
	try {
		// 检查缓存
		const now = Date.now();
		if (sitemapCache && (now - cacheTime) < CACHE_DURATION) {
			return new Response(sitemapCache, {
				headers: {
					'Content-Type': 'application/xml; charset=utf-8',
					'Cache-Control': 'public, max-age=3600, s-maxage=3600',
					'Vary': 'Accept-Encoding'
				}
			});
		}

		// 获取所有已发布的游戏（优化查询）
		const { data: games, error } = await supabase
			.from('games')
			.select('id, created_at, updated_at, category, popularity_score')
			.eq('published', true)
			.order('popularity_score', { ascending: false })
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error fetching games for sitemap:', error);
		}

		const baseUrl = 'https://freegamestoplayonline.store';
		const currentDate = new Date().toISOString().split('T')[0];
		const categories = ['action', 'puzzle', 'strategy', 'arcade', 'adventure', 'racing', 'sports', 'casual'];
		
		let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
	<url>
		<loc>${baseUrl}</loc>
		<lastmod>${currentDate}</lastmod>
		<changefreq>daily</changefreq>
		<priority>1.0</priority>
		<xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/" />
		<xhtml:link rel="alternate" hreflang="zh" href="${baseUrl}/" />
	</url>`;

		// 添加分类页面 - 增强 freewebgames SEO
		categories.forEach(category => {
			sitemap += `
	<url>
		<loc>${baseUrl}/?category=${category}</loc>
		<lastmod>${currentDate}</lastmod>
		<changefreq>weekly</changefreq>
		<priority>0.8</priority>
		<xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/?category=${category}" />
		<xhtml:link rel="alternate" hreflang="zh" href="${baseUrl}/?category=${category}" />
	</url>`;
		});

		// 添加 freewebgames 主题页面
		sitemap += `
	<url>
		<loc>${baseUrl}/freewebgames</loc>
		<lastmod>${currentDate}</lastmod>
		<changefreq>weekly</changefreq>
		<priority>0.9</priority>
		<xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/freewebgames" />
		<xhtml:link rel="alternate" hreflang="zh" href="${baseUrl}/freewebgames" />
	</url>`;

		// 添加游戏详情页面
		if (games && games.length > 0) {
			games.forEach((game, index) => {
				const lastmod = game.updated_at ? 
					new Date(game.updated_at).toISOString().split('T')[0] :
					new Date(game.created_at).toISOString().split('T')[0];
				
				// 根据流行度和位置设置优先级
				let priority = '0.7';
				if (index < 10) priority = '0.9';
				else if (index < 50) priority = '0.8';
				else if (game.popularity_score > 100) priority = '0.8';
				
				sitemap += `
	<url>
		<loc>${baseUrl}/games/${game.id}</loc>
		<lastmod>${lastmod}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>${priority}</priority>
		<xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/games/${game.id}" />
		<xhtml:link rel="alternate" hreflang="zh" href="${baseUrl}/games/${game.id}" />
	</url>`;
			});
		}

		sitemap += `
</urlset>`;

		// 缓存sitemap
		sitemapCache = sitemap;
		cacheTime = now;

		return new Response(sitemap, {
			headers: {
				'Content-Type': 'application/xml; charset=utf-8',
				'Cache-Control': 'public, max-age=3600, s-maxage=3600',
				'Vary': 'Accept-Encoding',
				'X-Robots-Tag': 'noindex' // Sitemap本身不需要被索引
			}
		});
	} catch (error) {
		console.error('Error generating sitemap:', error);
		return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>https://freegamestoplayonline.store</loc>
		<lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
		<changefreq>daily</changefreq>
		<priority>1.0</priority>
	</url>
</urlset>`, { 
			status: 200, // 即使出错也返回基本的sitemap
			headers: {
				'Content-Type': 'application/xml; charset=utf-8'
			}
		});
	}
}
