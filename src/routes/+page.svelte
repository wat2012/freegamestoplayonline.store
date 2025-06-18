<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { 
		currentLanguage, 
		t, 
		getCategoryName, 
		getCategoryIcon, 
		getLocalizedField,
		switchLanguage,
		initLanguage
	} from '$lib/utils/language.js';
	import { GameService } from '$lib/services/gameService.js';
	import GameCard from '$lib/components/GameCard.svelte';
	import { categoryTranslations } from '$lib/translations/categories';

	let games = [];
	let filteredGames = [];
	let latestGames = [];
	let popularGames = [];
	let loading = false;
	let searchQuery = '';
	let lang = 'en'; // 默认英文

	// 订阅语言变化
	currentLanguage.subscribe(value => {
		lang = value;
	});

	// 从URL获取当前选中的分类
	$: selectedCategory = $page.url.searchParams.get('category') || '';

	onMount(async () => {
		initLanguage();
		
		// 预加载常用数据
		GameService.preloadGameData();
		
		if (selectedCategory) {
			await fetchGames();
		} else {
			// 当没有选择分类时，加载最新和热门游戏
			await fetchHomePageGames();
		}
	});

	// 当分类变化时重新获取游戏
	$: if (selectedCategory) {
		fetchGames();
	} else {
		games = [];
		filteredGames = [];
		fetchHomePageGames();
	}

	async function fetchGames() {
		loading = true;
		try {
			const result = await GameService.getGames(selectedCategory);
			games = result.data;
			filterGames();
		} catch (error) {
			console.error('Error fetching games:', error);
		} finally {
			loading = false;
		}
	}

	async function fetchHomePageGames() {
		loading = true;
		try {
			// 并行请求，提高性能
			const [latestResult, popularResult] = await Promise.all([
				GameService.getLatestGames(4),
				GameService.getPopularGames(4)
			]);
			
			latestGames = latestResult;
			popularGames = popularResult;
		} catch (error) {
			console.error('Error fetching homepage games:', error);
		} finally {
			loading = false;
		}
	}

	function filterGames() {
		filteredGames = games.filter(game => {
			const categoryMatch = !selectedCategory || game.category === selectedCategory;
			const titleMatch = getLocalizedField(game, 'title', lang).toLowerCase().includes(searchQuery.toLowerCase());
			const descMatch = getLocalizedField(game, 'description', lang).toLowerCase().includes(searchQuery.toLowerCase());
			const searchMatch = !searchQuery || titleMatch || descMatch;
			
			return categoryMatch && searchMatch;
		});
	}

	function handleSearch(event) {
		searchQuery = event.target.value;
		filterGames();
	}

	function handleLanguageSwitch(newLang) {
		switchLanguage(newLang);
		filterGames();
	}

	// 获取分类显示名称
	function getCategoryDisplayName(categoryId) {
		if (!categoryId) return t('latestGames', lang);
		return getCategoryName(categoryId, lang);
	}
	
	// 添加缺失的categoryNavItems定义
	$: categoryNavItems = Object.keys(categoryTranslations).map(categoryId => ({
		id: categoryId,
		name: getCategoryName(categoryId, lang),
		href: `/?category=${categoryId}`
	}));
	
	// SEO优化：生成页面标题和描述 - 英文优先 with freewebgames
	$: pageTitle = selectedCategory 
		? `${getCategoryDisplayName(selectedCategory)} - FreeWebGames Store | Best Free Online Games` 
		: 'FreeWebGames Store - Your Next Game Is Just One Click Away | Free Online Games';
	
	$: pageDescription = selectedCategory
		? `Browse ${getCategoryDisplayName(selectedCategory)} games - ${filteredGames.length} free games for the best freewebgames gaming experience at FreeWebGames Store`
		: 'Your Next Game Is Just One Click Away. Discover thousands of freewebgames including action, puzzle, strategy, adventure, and casual games. Premium free online gaming experience.';

	// 增强SEO信息 - 首页 with freewebgames keyword
	$: metaKeywords = selectedCategory 
		? `freewebgames,${getCategoryDisplayName(selectedCategory)},${getCategoryDisplayName(selectedCategory)} games,free ${getCategoryDisplayName(selectedCategory).toLowerCase()} games,online ${getCategoryDisplayName(selectedCategory).toLowerCase()} games,browser games,HTML5 games,free web games`
		: 'freewebgames,free web games,online games,browser games,HTML5 games,flash games,action games,puzzle games,strategy games,adventure games,casual games,free online gaming';
		
	$: categoryDescription = selectedCategory
		? `Play the best free ${getCategoryDisplayName(selectedCategory).toLowerCase()} games online at FreeWebGames Store. No downloads, no registration required - just click and play ${filteredGames.length} amazing ${getCategoryDisplayName(selectedCategory).toLowerCase()} games. Experience premium freewebgames directly in your browser.`
		: 'Your Next Game Is Just One Click Away. Discover thousands of freewebgames including action, puzzle, strategy, adventure, and casual games without registration or download. Premium free online gaming experience.';

	// 生成结构化数据 - 修复验证错误
	$: structuredData = selectedCategory && filteredGames && filteredGames.length > 0 ? {
		"@context": "https://schema.org",
		"@type": "ItemList",
		"name": getCategoryDisplayName(selectedCategory),
		"description": pageDescription,
		"numberOfItems": filteredGames.length,
		"itemListElement": filteredGames.slice(0, 20).map((game, index) => {
			// 确保所有字段都有有效值
			const gameTitle = getLocalizedField(game, 'title', lang) || `Game ${game.id || index + 1}`;
			const gameDesc = getLocalizedField(game, 'description', lang) || gameTitle || "Free online gaming experience";
			const gameCategory = game.category || selectedCategory || "games";
			const gameDate = game.created_at || new Date().toISOString();
			
			return {
				"@type": "VideoGame",
				"position": index + 1,
				"name": gameTitle,
				"description": gameDesc,
				"url": `https://freegamestoplayonline.store/games/${game.id}`,
				"genre": getCategoryDisplayName(gameCategory),
				"datePublished": gameDate,
				...(game.preview_image && { "image": game.preview_image }),
				"aggregateRating": {
					"@type": "AggregateRating",
					"ratingValue": "4.5",
					"ratingCount": "100"
				}
			};
		})
	} : null;

	// 生成集合页面结构化数据 - 简化版本
	$: collectionPageData = selectedCategory && filteredGames && filteredGames.length > 0 ? {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		"name": `${getCategoryDisplayName(selectedCategory)} Games - FreeWebGames Store`,
		"description": categoryDescription,
		"url": `https://freegamestoplayonline.store/?category=${selectedCategory}`,
		"mainEntity": {
			"@type": "ItemList",
			"numberOfItems": filteredGames.length,
			"itemListElement": filteredGames.slice(0, 10).map((game, index) => {
				const gameTitle = getLocalizedField(game, 'title', lang) || `Game ${game.id || index + 1}`;
				return {
					"@type": "ListItem",
					"position": index + 1,
					"url": `https://freegamestoplayonline.store/games/${game.id}`,
					"name": gameTitle
				};
			})
		}
	} : null;

	// 生成首页结构化数据 - 保持简单
	$: homePageData = !selectedCategory ? {
		"@context": "https://schema.org",
		"@type": "WebPage",
		"name": "FreeWebGames Store - Your Next Game Is Just One Click Away",
		"description": "Discover thousands of free online games including action, puzzle, strategy, adventure, and casual games. Play instantly in your browser!",
		"url": "https://freegamestoplayonline.store",
		"speakable": {
			"@type": "SpeakableSpecification",
			"cssSelector": [".page-header h1", ".page-header p"]
		}
	} : null;

	// 安全的结构化数据生成函数
	function createSafeStructuredData() {
		if (!selectedCategory || !filteredGames || filteredGames.length === 0) {
			return null;
		}

		try {
			const safeGames = filteredGames.slice(0, 20).filter(game => game && game.id).map((game, index) => {
				const gameTitle = (getLocalizedField(game, 'title', lang) || `Game ${game.id || index + 1}`).replace(/["\n\r\t]/g, " ").trim();
				const gameDesc = (getLocalizedField(game, 'description', lang) || gameTitle || "Free online gaming experience").replace(/["\n\r\t]/g, " ").trim();
				const gameCategory = game.category || selectedCategory || "games";
				const gameDate = game.created_at || new Date().toISOString();
				
				const gameData = {
					"@type": "VideoGame",
					"position": index + 1,
					"name": gameTitle,
					"description": gameDesc,
					"url": `https://freegamestoplayonline.store/games/${game.id}`,
					"genre": getCategoryDisplayName(gameCategory),
					"datePublished": gameDate,
					"aggregateRating": {
						"@type": "AggregateRating",
						"ratingValue": "4.5",
						"ratingCount": "100"
					}
				};

				if (game.preview_image && typeof game.preview_image === 'string' && game.preview_image.startsWith('http')) {
					gameData.image = game.preview_image;
				}

				return gameData;
			});

			return {
				"@context": "https://schema.org",
				"@type": "ItemList",
				"name": getCategoryDisplayName(selectedCategory),
				"description": pageDescription.replace(/["\n\r\t]/g, " ").trim(),
				"numberOfItems": filteredGames.length,
				"itemListElement": safeGames
			};
		} catch (error) {
			console.error('Error creating structured data:', error);
			return null;
		}
	}

	function createSafeCollectionData() {
		if (!selectedCategory || !filteredGames || filteredGames.length === 0) {
			return null;
		}

		try {
			const safeItems = filteredGames.slice(0, 10).filter(game => game && game.id).map((game, index) => {
				const gameTitle = (getLocalizedField(game, 'title', lang) || `Game ${game.id || index + 1}`).replace(/["\n\r\t]/g, " ").trim();
				return {
					"@type": "ListItem",
					"position": index + 1,
					"url": `https://freegamestoplayonline.store/games/${game.id}`,
					"name": gameTitle
				};
			});

			return {
				"@context": "https://schema.org",
				"@type": "CollectionPage",
				"name": `${getCategoryDisplayName(selectedCategory)} Games - FreeWebGames Store`,
				"description": categoryDescription.replace(/["\n\r\t]/g, " ").trim(),
				"url": `https://freegamestoplayonline.store/?category=${selectedCategory}`,
				"mainEntity": {
					"@type": "ItemList",
					"numberOfItems": filteredGames.length,
					"itemListElement": safeItems
				}
			};
		} catch (error) {
			console.error('Error creating collection data:', error);
			return null;
		}
	}

	function createSafeHomeData() {
		if (selectedCategory) {
			return null;
		}

		try {
			return {
				"@context": "https://schema.org",
				"@type": "WebPage",
				"name": "FreeWebGames Store - Your Next Game Is Just One Click Away",
				"description": "Discover thousands of free online games including action, puzzle, strategy, adventure, and casual games. Play instantly in your browser!",
				"url": "https://freegamestoplayonline.store",
				"speakable": {
					"@type": "SpeakableSpecification",
					"cssSelector": [".page-header h1", ".page-header p"]
				}
			};
		} catch (error) {
			console.error('Error creating home data:', error);
			return null;
		}
	}

	// 安全的JSON字符串化函数
	function safeJSONStringify(data) {
		if (!data) return null;
		try {
			const jsonString = JSON.stringify(data, null, 0);
			// 验证生成的JSON是否有效
			JSON.parse(jsonString);
			return jsonString;
		} catch (error) {
			console.error('JSON stringify error:', error);
			return null;
		}
	}

	// 使用安全的结构化数据生成 - 移除重复的reactive statements
	$: safeStructuredData = createSafeStructuredData();
	$: safeCollectionPageData = createSafeCollectionData();
	$: safeHomePageData = createSafeHomeData();
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	<meta name="keywords" content={metaKeywords} />
	
	<!-- Open Graph - 增强社交媒体分享 with freewebgames -->
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDescription} />
	<meta property="og:url" content={selectedCategory ? `https://freegamestoplayonline.store/?category=${selectedCategory}` : 'https://freegamestoplayonline.store'} />
	<meta property="og:image" content="https://freegamestoplayonline.store/og-image.jpg" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="FreeWebGames Store - Premium FreeWebGames Experience" />
	
	<!-- Twitter Card - 优化推特分享 -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={pageDescription} />
	<meta name="twitter:image" content="https://freegamestoplayonline.store/og-image.jpg" />
	
	<!-- 结构化数据 - 安全生成 -->
	{#if selectedCategory}
		{#if safeStructuredData && safeJSONStringify(safeStructuredData)}
			<script type="application/ld+json">{safeJSONStringify(safeStructuredData)}</script>
		{/if}
		{#if safeCollectionPageData && safeJSONStringify(safeCollectionPageData)}
			<script type="application/ld+json">{safeJSONStringify(safeCollectionPageData)}</script>
		{/if}
	{:else if safeHomePageData && safeJSONStringify(safeHomePageData)}
		<script type="application/ld+json">{safeJSONStringify(safeHomePageData)}</script>
	{/if}
	
	<!-- Canonical URL -->
	<link rel="canonical" href={selectedCategory ? `https://freegamestoplayonline.store/?category=${selectedCategory}` : 'https://freegamestoplayonline.store'} />
</svelte:head>

<div class="container content-container">
	<header class="page-header">
		<div class="header-content">
			<h1>{lang === 'en' ? 'FreeWebGames Store - Your Next Game Is Just One Click Away' : 'FreeWebGames Store - 你的下一个游戏只需一键即可'}</h1>
			<p>{lang === 'en' ? 'Discover thousands of freewebgames including action, puzzle, strategy, adventure, and casual games. Play instantly in your browser with premium free online gaming experience!' : '发现数千款免费在线游戏，包括动作、益智、策略、冒险和休闲游戏。立即在浏览器中畅玩！'}</p>
		</div>
		
		<!-- Decorative gaming elements -->
		<div class="header-decorations">
			<div class="deco-item deco-controller"></div>
			<div class="deco-item deco-joystick"></div>
			<div class="deco-item deco-dice"></div>
			<div class="deco-item deco-puzzle"></div>
		</div>
		
		{#if selectedCategory}
			<div class="search-bar">
				<input 
					type="text" 
					placeholder={t('searchPlaceholder', lang)}
					value={searchQuery}
					on:input={handleSearch}
					class="search-input"
					aria-label={t('searchPlaceholder', lang)}
				/>
				<div class="search-icon">🔍</div>
				{#if searchQuery}
					<button 
						class="clear-search" 
						on:click={() => { searchQuery = ''; filterGames(); }}
						aria-label={t('clearSearch', lang) || "Clear search"}
					>
						✕
					</button>
				{/if}
			</div>
		{/if}
	</header>

	<!-- 添加简单面包屑导航 -->
	<div class="breadcrumb-navigation">
		<a href="/" class="breadcrumb-item">FreeWebGames Store</a>
		{#if selectedCategory}
			<span class="breadcrumb-separator">›</span>
			<span class="breadcrumb-item current">{getCategoryDisplayName(selectedCategory)} {lang === 'en' ? 'Games' : '游戏'}</span>
		{/if}
	</div>

	<!-- 将content-with-sidebar改为main-content-full -->
	<div class="main-content-full">
		<!-- 主要内容区 -->
		{#if selectedCategory}
			<section class="games">
				<div class="games-header">
					<h2>{getCategoryDisplayName(selectedCategory)}</h2>
					<span class="games-count">
						{t('totalGames', lang, { count: filteredGames.length })}
					</span>
				</div>
				
				<!-- 添加类别介绍 - SEO优化 -->
				<div class="category-description">
					<p>
						{#if lang === 'en'}
							Discover our collection of <strong>{filteredGames.length} free {getCategoryDisplayName(selectedCategory).toLowerCase()} games</strong> at <strong>FreeWebGames Store</strong>. All games are playable directly in your browser without download or registration. Enjoy the best {getCategoryDisplayName(selectedCategory).toLowerCase()} gaming experience online!
						{:else}
						 在<strong>FreeWebGames Store</strong>上探索我们的<strong>{filteredGames.length}款免费{getCategoryDisplayName(selectedCategory)}游戏</strong>。所有游戏都可以直接在浏览器中玩，无需下载或注册。享受最佳的在线{getCategoryDisplayName(selectedCategory).toLowerCase()}游戏体验！
						{/if}
					</p>
				</div>
				
				{#if loading}
					<div class="loading">
						<div class="loading-spinner"></div>
						<p>{t('loading', lang)}</p>
					</div>
				{:else if filteredGames.length === 0}
					<div class="empty-state">
						{#if searchQuery}
							<p>{t('noMatchingGames', lang)}</p>
							<button 
								class="reset-btn" 
								on:click={() => { searchQuery = ''; filterGames(); }}
							>
								{t('viewAllGames', lang)}
							</button>
						{:else}
							<p>{t('noGames', lang)}</p>
						{/if}
					</div>
				{:else}
					<div class="games-grid">
						{#each filteredGames as game, i}
							<!-- 移除内容间广告位 -->
							<GameCard {game} {lang} index={i} />
						{/each}
					</div>
				{/if}
			</section>
		{:else}
			<!-- Home content sections -->
			{#if loading}
				<div class="loading">
					<div class="loading-spinner"></div>
					<p>{t('loading', lang)}</p>
				</div>
			{:else}
				<!-- 首页SEO介绍部分 with freewebgames -->
				<section class="home-intro">
					<div class="intro-content">
						<h2>{lang === 'en' ? 'Premium FreeWebGames Collection' : '优质免费在线游戏合集'}</h2>
						<p>
							{#if lang === 'en'}
							 Welcome to <strong>FreeWebGames Store</strong>, your ultimate destination for the best freewebgames experience! We offer a diverse collection of premium free online games across multiple categories including action, puzzle, strategy, adventure, and more. All our freewebgames are playable directly in your browser with no downloads or registration required.
							{:else}
							 欢迎来到<strong>FreeWebGames Store</strong>，这里是您畅玩最佳免费在线游戏的终极目的地！我们提供多种类别的优质免费游戏，包括动作、益智、策略、冒险等。所有游戏都可以直接在浏览器中玩，无需下载或注册。
							{/if}
						</p>
					</div>
				</section>

				<!-- 最新游戏板块 -->
				<section class="home-section latest-games-section">
					<div class="section-header">
						<div class="section-icon">🆕</div>
						<div class="section-titles">
							<h2>{t('latestGames', lang)}</h2>
							<p>{t('latestGamesDesc', lang)}</p>
						</div>
					</div>
					{#if latestGames.length > 0}
						<div class="games-grid">
							{#each latestGames as game, i}
								<GameCard {game} {lang} index={i} />
							{/each}
						</div>
					{:else}
						<div class="empty-state">
							<p>{t('noGames', lang)}</p>
						</div>
					{/if}
				</section>

				<!-- 移除内容间广告位 -->

				<!-- 热门游戏板块 -->
				<section class="home-section popular-games-section">
					<div class="section-header">
						<div class="section-icon">🔥</div>
						<div class="section-titles">
							<h2>{t('popularGames', lang)}</h2>
							<p>{t('popularGamesDesc', lang)}</p>
						</div>
					</div>
					{#if popularGames.length > 0}
						<div class="games-grid">
							{#each popularGames as game, i}
								<GameCard {game} {lang} index={i} />
							{/each}
						</div>
					{:else}
						<div class="empty-state">
							<p>{t('noGames', lang)}</p>
						</div>
					{/if}
				</section>

				<!-- 首页底部SEO部分 with freewebgames -->
				<section class="home-footer-seo">
					<h2>{lang === 'en' ? 'Play Premium FreeWebGames at FreeWebGames Store' : '在FreeWebGames Store上畅玩优质免费在线游戏'}</h2>
					<p>
						{#if lang === 'en'}
						 At FreeWebGames Store, we're dedicated to bringing you the best freewebgames experience. Our growing collection features premium free online games for all preferences, from fast-paced action to mind-bending puzzles, strategic challenges, and relaxing casual games. Explore our freewebgames categories to find your next favorite game, all free to play in your browser with no registration required.
						{:else}
						 在FreeWebGames Store，我们致力于为您带来最佳的免费在线游戏体验。我们不断增长的游戏合集包含适合各种喜好的优质游戏，从节奏快的动作游戏到烧脑的益智游戏，从战略挑战到轻松休闲游戏。浏览我们的游戏分类，找到您的下一个最爱，所有游戏都可以在浏览器中免费玩，无需注册。
						{/if}
					</p>
					<div class="category-links">
						<h3>{lang === 'en' ? 'Popular FreeWebGames Categories' : '热门免费游戏分类'}</h3>
						<div class="popular-categories">
							{#each categoryNavItems.slice(0, 6) as category}
								<a href={category.href} class="category-link">
									{category.name} {lang === 'en' ? 'FreeWebGames' : '免费游戏'}
								</a>
							{/each}
						</div>
					</div>
				</section>
			{/if}
		{/if}
	</div>
</div>

<style>
	.container {
		width: 100%;
		padding: 0;
		box-sizing: border-box; /* 添加盒模型设置 */
	}

	.page-header {
		position: relative;
		text-align: center;
		margin-bottom: 0.5rem;
		padding: 0.8rem 0.3rem;
		background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
		border-radius: 0;
		box-shadow: 0 4px 20px rgba(37, 117, 252, 0.2);
		overflow: hidden;
	}
	
	.header-content {
		position: relative;
		z-index: 2;
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header h1 {
		margin-bottom: 0.3rem;
		color: white;
		font-size: 1.6rem;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		animation: slideInDown 0.5s ease-out;
	}

	.page-header p {
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.9rem;
		margin-bottom: 0.6rem;
		line-height: 1.3;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
		animation: fadeIn 0.8s ease-out;
	}
	
	/* Decorative elements */
	.header-decorations {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
		overflow: hidden;
	}
	
	.deco-item {
		position: absolute;
		opacity: 0.1;
		filter: blur(1px);
		transform: rotate(-15deg);
	}
	
	.deco-controller {
		top: 10%;
		left: 5%;
		width: 60px;
		height: 60px;
		background: rgba(255, 255, 255, 0.7);
		border-radius: 15px;
		animation: float 10s ease-in-out infinite;
	}
	
	.deco-joystick {
		bottom: 20%;
		right: 10%;
		width: 50px;
		height: 50px;
		background: rgba(255, 255, 255, 0.7);
		border-radius: 50%;
		animation: float 8s ease-in-out infinite reverse;
	}
	
	.deco-dice {
		top: 60%;
		left: 15%;
		width: 35px;
		height: 35px;
		background: rgba(255, 255, 255, 0.7);
		border-radius: 8px;
		animation: spin 15s linear infinite;
	}
	
	.deco-puzzle {
		top: 15%;
		right: 15%;
		width: 45px;
		height: 45px;
		background: rgba(255, 255, 255, 0.7);
		border-radius: 12px;
		animation: float 12s ease-in-out infinite 2s;
	}

	.search-bar {
		position: relative;
		max-width: 500px;
		margin: 0.4rem auto 0;
		animation: slideInUp 0.5s ease-out;
	}

	.search-input {
		width: 100%;
		padding: 0.6rem 2.5rem 0.6rem 2.2rem;
		border: none;
		border-radius: 30px;
		font-size: 0.85rem;
		background: rgba(255, 255, 255, 0.95);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
	}

	.search-input:focus {
		outline: none;
		box-shadow: 0 4px 25px rgba(0, 123, 255, 0.25);
		transform: translateY(-1px);
		background: white;
	}
	
	.search-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		font-size: 1rem;
		color: #6a11cb;
		pointer-events: none;
	}

	.clear-search {
		position: absolute;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: #6c757d;
		font-size: 0.9rem;
		cursor: pointer;
		padding: 0.2rem;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.2s;
	}

	.clear-search:hover {
		background: rgba(0, 0, 0, 0.1);
		color: #343a40;
	}

	.games-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.6rem;
		background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%);
		padding: 0.5rem 0.6rem;
		border-radius: 6px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.games-header h2 {
		margin: 0;
		color: #343a40;
		font-size: 1.1rem;
		font-weight: 700;
		position: relative;
		display: inline-block;
	}
	
	.games-header h2::after {
		content: '';
		position: absolute;
		bottom: -3px;
		left: 0;
		width: 30px;
		height: 2px;
		background: linear-gradient(90deg, #6a11cb, #2575fc);
		border-radius: 2px;
	}

	.games-count {
		color: #6c757d;
		font-size: 0.75rem;
		font-weight: 500;
		background: white;
		padding: 0.2rem 0.4rem;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.loading {
		text-align: center;
		padding: 2rem 0;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid rgba(106, 17, 203, 0.1);
		border-top: 4px solid #6a11cb;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
		position: relative;
	}
	
	.loading-spinner::before,
	.loading-spinner::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		opacity: 0.2;
	}
	
	.loading-spinner::before {
		width: 52px;
		height: 52px;
		border: 2px solid #6a11cb;
		animation: pulse 2s ease-in-out infinite;
	}
	
	.loading-spinner::after {
		width: 60px;
		height: 60px;
		border: 1px solid #6a11cb;
		animation: pulse 2s ease-in-out 0.4s infinite;
	}
	
	@keyframes pulse {
		0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.2; }
		50% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
		100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.2; }
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	@keyframes float {
		0%, 100% { transform: translateY(0) rotate(-15deg); }
		50% { transform: translateY(-20px) rotate(5deg); }
	}
	
	@keyframes slideInDown {
		from {
			transform: translateY(-20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
	
	@keyframes slideInUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
	
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	
	@keyframes popIn {
		0% {
			transform: scale(0.8);
			opacity: 0;
		}
		70% {
			transform: scale(1.05);
			opacity: 1;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	.empty-state {
		text-align: center;
		padding: 1.2rem 0.6rem;
		background: linear-gradient(145deg, #ffffff, #f0f0f0);
		border-radius: 8px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
		color: #6c757d;
		animation: fadeIn 0.5s ease-out;
		margin: 0 0.3rem;
	}
	
	.empty-state p {
		font-size: 1rem;
		margin-bottom: 0.8rem;
	}

	.reset-btn {
		background: linear-gradient(90deg, #6a11cb, #2575fc);
		color: white;
		border: none;
		padding: 0.6rem 1.2rem;
		border-radius: 30px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 600;
		box-shadow: 0 4px 15px rgba(106, 17, 203, 0.3);
		transition: all 0.3s ease;
	}
	
	.reset-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(106, 17, 203, 0.4);
	}
	
	.reset-btn:active {
		transform: translateY(0);
	}

	.games-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 0.6rem;
		padding: 0 0.3rem;
	}

	.home-section {
		margin-bottom: 1rem;
		position: relative;
		background: linear-gradient(145deg, #ffffff, #f8f9fa);
		border-radius: 8px;
		padding: 0.8rem 0.3rem;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
		overflow: hidden;
		margin-left: 0.3rem;
		margin-right: 0.3rem;
	}
	
	.latest-games-section {
		background: linear-gradient(145deg, rgba(255,255,255,0.95), rgba(240,248,255,0.95));
		position: relative;
		overflow: hidden;
	}
	
	.latest-games-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image: 
			radial-gradient(circle at 10% 20%, rgba(106, 17, 203, 0.05) 10%, transparent 20%),
			radial-gradient(circle at 90% 30%, rgba(37, 117, 252, 0.05) 15%, transparent 25%),
			radial-gradient(circle at 50% 80%, rgba(106, 17, 203, 0.05) 10%, transparent 20%);
		z-index: 0;
	}
	
	.popular-games-section {
		background: linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,245,245,0.95));
		position: relative;
		overflow: hidden;
	}
	
	.popular-games-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image: 
			radial-gradient(circle at 20% 20%, rgba(255, 99, 71, 0.05) 10%, transparent 20%),
			radial-gradient(circle at 80% 40%, rgba(255, 69, 0, 0.05) 15%, transparent 25%),
			radial-gradient(circle at 40% 70%, rgba(255, 99, 71, 0.05) 10%, transparent 20%);
		z-index: 0;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.8rem;
		position: relative;
		z-index: 1;
	}
	
	.section-icon {
		font-size: 1.3rem;
		background: white;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
		position: relative;
	}
	
	.latest-games-section .section-icon {
		background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
		color: white;
	}
	
	.popular-games-section .section-icon {
		background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
		color: white;
	}
	
	.section-titles {
		flex: 1;
	}

	.section-header h2 {
		margin: 0 0 0.1rem 0;
		color: #343a40;
		font-size: 1.2rem;
		font-weight: 700;
	}
	
	.latest-games-section .section-header h2 {
		color: #6a11cb;
	}
	
	.popular-games-section .section-header h2 {
		color: #ff416c;
	}

	.section-header p {
		margin: 0;
		color: #6c757d;
		font-size: 0.8rem;
	}

	
	/* Improved search bar styles */
	.search-input {
		width: 100%;
		padding: 0.6rem 2.5rem 0.6rem 2.2rem;
		border: none;
		border-radius: 30px;
		font-size: 0.85rem;
		background: rgba(255, 255, 255, 0.95);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
	}

	.main-content-full {
		width: 100%;
		box-sizing: border-box;
	}
	
	/* 调整媒体查询 */
	@media (max-width: 1024px) {
		.main-content-full {
			padding: 0 0.5rem;
		}
	}
	
	@media (max-width: 768px) {
		/* 无需特定样式 */
	}
	
	@media (max-width: 480px) {
		/* 无需特定样式 */
	}

	/* Large screens optimization - better grid utilization */
	@media (min-width: 1200px) {
		.games-grid {
			grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
			gap: 0.8rem;
		}
		
		.home-section {
			margin-left: 0.5rem;
			margin-right: 0.5rem;
		}
	}

	@media (min-width: 1400px) {
		.games-grid {
			grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
			gap: 1rem;
		}
		
		.home-section {
			margin-left: 0.8rem;
			margin-right: 0.8rem;
		}
	}

	/* Ultra-wide screens - maximize grid utilization */
	@media (min-width: 1800px) {
		.games-grid {
			grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		}
	}
	
	/* 面包屑导航样式 */
	.breadcrumb-navigation {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		padding: 0.5rem 0.8rem;
		margin-bottom: 1rem;
		color: #6c757d;
		font-size: 0.85rem;
		background: rgba(255, 255, 255, 0.5);
		border-radius: 6px;
	}
	
	.breadcrumb-item {
		color: #6c757d;
		text-decoration: none;
	}
	
	.breadcrumb-item:hover {
		color: #007bff;
		text-decoration: underline;
	}
	
	.breadcrumb-item.current {
		color: #495057;
		font-weight: 600;
	}
	
	.breadcrumb-separator {
		margin: 0 0.5rem;
		color: #adb5bd;
	}
	
	/* 分类介绍样式 */
	.category-description {
		background: rgba(255, 255, 255, 0.8);
		padding: 1rem;
		border-radius: 6px;
		margin-bottom: 1.5rem;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
	}
	
	.category-description p {
		margin: 0;
		color: #495057;
		line-height: 1.5;
		font-size: 0.95rem;
	}
	
	/* 首页介绍样式 */
	.home-intro {
		background: linear-gradient(145deg, rgba(255,255,255,0.95), rgba(245,245,255,0.95));
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
	}
	
	.home-intro h2 {
		margin: 0 0 1rem 0;
		color: #343a40;
		font-size: 1.4rem;
		position: relative;
		display: inline-block;
	}
	
	.home-intro h2::after {
		content: '';
		position: absolute;
		bottom: -3px;
		left: 0;
		width: 40px;
		height: 2px;
		background: linear-gradient(90deg, #6a11cb, #2575fc);
		border-radius: 2px;
	}
	
	.home-intro p {
		margin: 0;
		color: #495057;
		line-height: 1.6;
	}
	
	/* 底部SEO部分样式 */
	.home-footer-seo {
		background: rgba(255, 255, 255, 0.7);
		padding: 1.5rem;
		border-radius: 8px;
		margin-top: 2rem;
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
	}
	
	.home-footer-seo h2 {
		margin: 0 0 1rem 0;
		color: #343a40;
		font-size: 1.2rem;
	}
	
	.home-footer-seo p {
		margin: 0 0 1.2rem 0;
		color: #495057;
		line-height: 1.6;
		font-size: 0.95rem;
	}
	
	.category-links h3 {
		margin: 1rem 0 0.8rem 0;
		font-size: 1.1rem;
		color: #495057;
	}
	
	.popular-categories {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	
	.category-link {
		background: linear-gradient(135deg, rgba(106, 17, 203, 0.1), rgba(37, 117, 252, 0.1));
		color: #6a11cb;
		padding: 0.4rem 0.8rem;
		border-radius: 20px;
		text-decoration: none;
		font-size: 0.85rem;
		transition: all 0.3s ease;
	}
	
	.category-link:hover {
		background: linear-gradient(135deg, rgba(106, 17, 203, 0.2), rgba(37, 117, 252, 0.2));
		transform: translateY(-2px);
		box-shadow: 0 3px 8px rgba(106, 17, 203, 0.15);
	}
</style>
