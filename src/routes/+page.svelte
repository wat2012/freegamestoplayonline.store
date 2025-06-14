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

	// SEO优化：生成页面标题和描述 - 英文优先
	$: pageTitle = selectedCategory 
		? `${getCategoryDisplayName(selectedCategory)} - FreeWebGames Store` 
		: 'FreeWebGames Store - Your Next Game Is Just One Click Away | Free Online Games';
	
	$: pageDescription = selectedCategory
		? `Browse ${getCategoryDisplayName(selectedCategory)} games - ${filteredGames.length} free games for the best gaming experience`
		: 'Your Next Game Is Just One Click Away. Discover thousands of free online games including action, puzzle, strategy, adventure, and casual games.';

	// 生成结构化数据
	$: structuredData = {
		"@context": "https://schema.org",
		"@type": "ItemList",
		"name": selectedCategory ? getCategoryDisplayName(selectedCategory) : "Free Games",
		"description": pageDescription,
		"numberOfItems": filteredGames.length,
		"itemListElement": filteredGames.map((game, index) => ({
			"@type": "VideoGame",
			"position": index + 1,
			"name": getLocalizedField(game, 'title', lang),
			"description": getLocalizedField(game, 'description', lang) || "Free online gaming experience",
			"url": `https://freegamestoplayonline.store/games/${game.id}`,
			"genre": getCategoryDisplayName(game.category),
			"datePublished": game.created_at,
			"image": game.preview_image,
			"aggregateRating": {
				"@type": "AggregateRating",
				"ratingValue": "4.5",
				"ratingCount": "100"
			}
		}))
	};
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	<meta name="keywords" content={selectedCategory ? `${getCategoryDisplayName(selectedCategory)},${getCategoryDisplayName(selectedCategory)} games,online ${getCategoryDisplayName(selectedCategory)}` : 'VIP games,online games,free games,premium games'} />
	
	<!-- Open Graph -->
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDescription} />
	<meta property="og:url" content={selectedCategory ? `https://freegamestoplayonline.store/?category=${selectedCategory}` : 'https://freegamestoplayonline.store'} />
	<meta property="og:image" content="https://freegamestoplayonline.store/og-image.jpg" />
	
	<!-- Twitter Card -->
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={pageDescription} />
	<meta name="twitter:image" content="https://freegamestoplayonline.store/og-image.jpg" />
	
	<!-- 结构化数据 -->
	{#if filteredGames.length > 0}
		<script type="application/ld+json">{JSON.stringify(structuredData)}</script>
	{/if}
	
	<!-- Canonical URL -->
	<link rel="canonical" href={selectedCategory ? `https://freegamestoplayonline.store/?category=${selectedCategory}` : 'https://freegamestoplayonline.store'} />
</svelte:head>

<div class="container content-container">
	<header class="page-header">
		<div class="header-content">
			<h1>{lang === 'en' ? 'FreeWebGames Store - Your Next Game Is Just One Click Away' : 'FreeWebGames Store - 你的下一个游戏只需一键即可'}</h1>
			<p>{lang === 'en' ? 'Discover thousands of free online games including action, puzzle, strategy, adventure, and casual games. Play instantly in your browser!' : '发现数千款免费在线游戏，包括动作、益智、策略、冒险和休闲游戏。立即在浏览器中畅玩！'}</p>
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
			<!-- Home content sections with enhanced styling -->
			{#if loading}
				<div class="loading">
					<div class="loading-spinner"></div>
					<p>{t('loading', lang)}</p>
				</div>
			{:else}
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
</style>
