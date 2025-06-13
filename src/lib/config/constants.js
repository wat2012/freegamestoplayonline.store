// 新建配置常量文件

export const APP_CONFIG = {
	name: 'FreeWebGames Store',
	description: 'Your Next Game Is Just One Click Away',
	url: 'https://freegamestoplayonline.store',
	defaultLanguage: 'en',
	supportedLanguages: ['en', 'zh'],
	pagination: {
		gamesPerPage: 12,
		maxPopularGames: 6
	},
	cache: {
		sitemapTTL: 3600, // 1 hour
		gameDataTTL: 300  // 5 minutes
	},
	validation: {
		minTitleLength: 2,
		maxTitleLength: 100,
		minDescriptionLength: 10,
		maxDescriptionLength: 500
	}
};

export const GAME_CATEGORIES = [
	'action', 'puzzle', 'strategy', 'arcade', 
	'adventure', 'racing', 'sports', 'casual'
];
