export async function GET() {
	const robotsTxt = `User-agent: *
Allow: /
Allow: /games/*
Allow: /?category=*

# 禁止访问管理和私人区域
Disallow: /api/*

# 禁止访问技术文件
Disallow: /*.json$
Disallow: /*.xml$
Disallow: /static/
Disallow: /_app/

# 站点地图
Sitemap: https://freegamestoplayonline.store/sitemap.xml

# 针对特定搜索引擎的优化
User-agent: Googlebot
Allow: /
Crawl-delay: 1
Request-rate: 1/2s

User-agent: Bingbot
Allow: /
Crawl-delay: 1
Request-rate: 1/3s

User-agent: Baiduspider
Allow: /
Crawl-delay: 2
Request-rate: 1/5s

# 阻止恶意爬虫
User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /`;

	return new Response(robotsTxt, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=86400',
			'X-Robots-Tag': 'noindex'
		}
	});
}
