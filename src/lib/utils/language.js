import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// 语言状态存储 - 默认英文
export const currentLanguage = writable('en');

// 游戏分类的双语映射 - 英文优先
export const categoryTranslations = {
	action: { en: 'Action Games', zh: '动作游戏', icon: '⚔️' },
	puzzle: { en: 'Puzzle Games', zh: '益智游戏', icon: '🧩' },
	strategy: { en: 'Strategy Games', zh: '策略游戏', icon: '♟️' },
	arcade: { en: 'Arcade Games', zh: '街机游戏', icon: '🕹️' },
	adventure: { en: 'Adventure Games', zh: '冒险游戏', icon: '🗺️' },
	racing: { en: 'Racing Games', zh: '竞速游戏', icon: '🏎️' },
	sports: { en: 'Sports Games', zh: '体育游戏', icon: '⚽' },
	casual: { en: 'Casual Games', zh: '休闲游戏', icon: '🎯' }
};

// 界面文本的双语映射 - 英文优先
export const uiTranslations = {
	en: {
		// 通用
		allGames: 'All Games',
		searchPlaceholder: 'Search games...',
		loading: 'Loading...',
		noGames: 'No games available',
		noMatchingGames: 'No matching games found',
		viewAllGames: 'View All Games',
		startGame: 'Play Now',
		publishedOn: 'Published on',
		totalGames: '{count} free games',
		
		// 首页SEO优化
		welcomeTitle: 'FreeWebGames Store - Your Next Game Is Just One Click Away',
		welcomeDescription: 'Discover thousands of free online games including action, puzzle, strategy, adventure, and casual games. Play instantly in your browser!',
		latestGames: 'Latest Games',
		latestGamesDesc: 'Discover our newest free games, fresh additions to our collection',
		popularGames: 'Popular Games',
		popularGamesDesc: 'Most loved games by our community - join the fun!',
		gameCategories: 'Game Categories',
		noDescription: 'Free online gaming experience',
		gameHomepage: 'Home',
		views: 'views',
		viewsCount: '{count} views',
		
		// 管理后台
		adminTitle: 'Game Management Dashboard',
		addNewGame: 'Add New Game',
		gameManagement: 'Game Management',
		gameTitle: 'Game Title',
		category: 'Category',
		gameDescription: 'Description',
		status: 'Status',
		createTime: 'Created',
		actions: 'Actions',
		published: 'Published',
		draft: 'Draft',
		online: 'Online',
		offline: 'Offline',
		edit: 'Edit',
		preview: 'Preview',
		delete: 'Delete',
		confirmDelete: 'Are you sure you want to delete this game?',
		deleteSuccess: 'Deleted successfully',
		deleteFailed: 'Delete failed',
		updateStatusFailed: 'Update status failed',
		uncategorized: 'Uncategorized',
		popularity: 'Popularity',
		totalViews: 'Total Views',
		mostPopular: 'Most Popular',
		viewCount: 'views',
		popularityEditable: 'Editable',
		initialPopularity: 'Initial Popularity Score',
		popularityHelp: 'Set the initial view count for this game (default: 9)',
		popularityEditHelp: 'Set the view count, manually adjustable to affect game ranking'
	},
	zh: {
		// 通用
		allGames: '全部游戏',
		searchPlaceholder: '搜索游戏名称...',
		loading: '加载中...',
		noGames: '暂无游戏',
		noMatchingGames: '没有找到符合条件的游戏',
		viewAllGames: '查看全部游戏',
		startGame: '开始游戏',
		publishedOn: '发布时间',
		totalGames: '共 {count} 款免费游戏',
		
		// 首页SEO优化
		welcomeTitle: 'FreeWebGames Store - 你的下一个游戏只需一键即可',
		welcomeDescription: '发现数千款免费在线游戏，包括动作、益智、策略、冒险和休闲游戏。立即在浏览器中畅玩！',
		latestGames: '最新游戏',
		latestGamesDesc: '发现我们最新的免费游戏，最新添加到我们的收藏中',
		popularGames: '热门游戏',
		popularGamesDesc: '社区最受欢迎的游戏 - 快来加入游戏的乐趣！',
		gameCategories: '游戏分类',
		noDescription: '免费在线游戏体验',
		gameHomepage: '游戏首页',
		views: '次浏览',
		viewsCount: '{count} 次浏览',
		
		// 管理后台
		adminTitle: '游戏管理后台',
		addNewGame: '添加新游戏',
		gameManagement: '游戏管理',
		gameTitle: '游戏标题',
		category: '分类',
		gameDescription: '游戏简介',
		status: '状态',
		createTime: '创建时间',
		actions: '操作',
		published: '已发布',
		draft: '草稿',
		online: '上线',
		offline: '下线',
		edit: '编辑',
		preview: '预览',
		delete: '删除',
		confirmDelete: '确定要删除这个游戏吗？',
		deleteSuccess: '删除成功',
		deleteFailed: '删除失败',
		updateStatusFailed: '更新状态失败',
		uncategorized: '未分类',
		popularity: '流行度',
		totalViews: '总浏览量',
		mostPopular: '最受欢迎',
		viewCount: '次浏览',
		popularityEditable: '可编辑',
		initialPopularity: '初始流行度分数',
		popularityHelp: '设置游戏的初始浏览次数（默认：9）',
		popularityEditHelp: '设置游戏的浏览次数，可以手动调整以影响游戏排序'
	}
};

// 获取翻译文本 - 默认英文
export function t(key, lang = 'en', params = {}) {
	let text = uiTranslations[lang]?.[key] || uiTranslations.en[key] || key;
	
	// 替换参数
	Object.keys(params).forEach(param => {
		text = text.replace(`{${param}}`, params[param]);
	});
	
	return text;
}

// 获取分类名称 - 默认英文
export function getCategoryName(categoryId, lang = 'en') {
	return categoryTranslations[categoryId]?.[lang] || categoryId;
}

// 获取分类图标
export function getCategoryIcon(categoryId) {
	return categoryTranslations[categoryId]?.icon || '🎮';
}

// 获取游戏字段的本地化版本 - 英文优先
export function getLocalizedField(game, fieldName, lang = 'en') {
	if (!game) return '';
	
	// 如果是中文，先尝试中文字段
	if (lang === 'zh') {
		if (game[fieldName] && fieldName !== 'title_en' && fieldName !== 'description_en' && fieldName !== 'instructions_en') {
			return game[fieldName];
		}
		if (game[`${fieldName}_zh`]) {
			return game[`${fieldName}_zh`];
		}
	}
	
	// 英文优先逻辑
	if (game[`${fieldName}_en`]) {
		return game[`${fieldName}_en`];
	}
	
	// 回退到默认字段
	return game[fieldName] || '';
}

// 切换语言
export function switchLanguage(lang) {
	currentLanguage.set(lang);
	if (browser) {
		localStorage.setItem('preferred-language', lang);
	}
}

// 初始化语言设置 - 默认英文
export function initLanguage() {
	if (browser) {
		const savedLang = localStorage.getItem('preferred-language');
		const browserLang = navigator.language.startsWith('zh') ? 'zh' : 'en';
		const defaultLang = savedLang || 'en'; // 默认英文，不跟随浏览器
		currentLanguage.set(defaultLang);
	}
}
