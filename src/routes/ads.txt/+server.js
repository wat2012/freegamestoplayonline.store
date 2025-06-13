export async function GET() {
	const adsTxt = `# ads.txt file for freegamestoplayonline.store
# This file authorizes digital advertising platforms to serve ads on this domain

# Google AdSense
google.com, pub-5646035224187434, DIRECT, f08c47fec0942fa0

# Google Ad Manager (optional, if using)
#google.com, pub-XXXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0

# Replace pub-XXXXXXXXXXXXXXXXX with your actual Google AdSense Publisher ID
# You can find your Publisher ID in your Google AdSense account under Account > Account information`;

	return new Response(adsTxt, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=86400', // 24小时缓存
			'X-Robots-Tag': 'noindex' // ads.txt本身不需要被索引
		}
	});
}
