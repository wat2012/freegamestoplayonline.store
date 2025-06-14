<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { 
		currentLanguage, 
		t, 
		getCategoryName, 
		getCategoryIcon, 
		getLocalizedField,
		initLanguage
	} from '$lib/utils/language.js';
	import { GameService } from '$lib/services/gameService.js';
	import OptimizedImage from '$lib/components/OptimizedImage.svelte';

	let game = null;
	let loading = true;
	let error = null;
	let lang = 'en';

	currentLanguage.subscribe(value => {
		lang = value;
	});

	$: gameId = $page.params.id;

	onMount(async () => {
		initLanguage();
		await loadGame();
	});

	async function loadGame() {
		if (!gameId) {
			error = 'Invalid game ID';
			loading = false;
			return;
		}

		loading = true;
		error = null;

		try {
			game = await GameService.getGameById(gameId);
			
			if (!game) {
				error = 'Game not found';
				return;
			}
			
			GameService.incrementPopularity(gameId);
		} catch (err) {
			console.error('Error loading game:', err);
			error = 'Failed to load game';
		} finally {
			loading = false;
		}
	}

	function goBack() {
		if (game?.category) {
			goto(`/?category=${game.category}`);
		} else {
			goto('/');
		}
	}

	$: gameTitle = game ? `${getLocalizedField(game, 'title', lang)} - Free Online Game | FreeWebGames Store` : 'Game - FreeWebGames Store';
	$: gameDescription = game ? 
		`${getLocalizedField(game, 'description', lang) || getLocalizedField(game, 'title', lang)} - Play free online at FreeWebGames Store, ${getCategoryName(game.category, lang)} free gaming experience.` : 
		'Free online gaming experience - FreeWebGames Store';
</script>

<svelte:head>
	{#if game}
		<title>{gameTitle}</title>
		<meta name="description" content={gameDescription} />
		<meta name="keywords" content="{getLocalizedField(game, 'title', lang)},{getCategoryName(game.category, lang)},{getCategoryName(game.category, lang)} games,online games,free games,free web games" />
		{#if game.preview_image}
			<meta property="og:image" content={game.preview_image} />
			<meta property="twitter:image" content={game.preview_image} />
		{/if}
	{:else}
		<title>Game - FreeWebGames Store</title>
	{/if}
</svelte:head>

<div class="game-container content-container">
	{#if loading}
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<p>{t('loading', lang)}</p>
		</div>
	{:else if error}
		<div class="error-container">
			<div class="error-icon">❌</div>
			<h2>{lang === 'en' ? 'Game Not Found' : '游戏未找到'}</h2>
			<p>{lang === 'en' ? 'Sorry, the game you requested does not exist or has been removed.' : '抱歉，您请求的游戏不存在或已被删除。'}</p>
			<button class="btn-primary" on:click={goBack}>
				{lang === 'en' ? 'Back to Games' : '返回游戏列表'}
			</button>
		</div>
	{:else if game}
		<!-- 替换game-content-wrapper为game-content-full -->
		<div class="game-content-full">
			<div class="game-header">
				<button class="back-button" on:click={goBack}>
					← {lang === 'en' ? 'Back' : '返回'}
				</button>
				
				<div class="game-info">
					{#if game.preview_image}
						<div class="game-preview-banner">
							<OptimizedImage
								src={game.preview_image}
								thumbSrc={game.preview_image_thumb}
								alt={getLocalizedField(game, 'title', lang)}
								className="preview-image"
								lazy={false}
							/>
						</div>
					{/if}
					
					<h1>{getLocalizedField(game, 'title', lang)}</h1>
					
					<div class="game-meta">
						{#if game.category}
							<span class="category-tag">
								{getCategoryIcon(game.category)} {getCategoryName(game.category, lang)}
							</span>
						{/if}
						<div class="popularity-display">
							<span class="popularity-icon">👁️</span>
							<span class="popularity-count">{game.popularity_score || 0}</span>
							<span class="popularity-label">{lang === 'en' ? 'views' : '次浏览'}</span>
						</div>
						<span class="publish-date">
							{t('publishedOn', lang)}: {new Date(game.created_at).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')}
						</span>
					</div>
					
					{#if getLocalizedField(game, 'description', lang)}
						<p class="game-description">
							{getLocalizedField(game, 'description', lang)}
						</p>
					{/if}
					
					{#if getLocalizedField(game, 'instructions', lang)}
						<div class="game-instructions">
							<h3>{lang === 'en' ? 'Game Instructions' : '游戏说明'}</h3>
							<p>{getLocalizedField(game, 'instructions', lang)}</p>
						</div>
					{/if}
				</div>
			</div>

			{#if game.iframe_url}
				<div class="game-frame-container">
					<iframe 
						src={game.iframe_url}
						title={getLocalizedField(game, 'title', lang)}
						class="game-frame"
						frameborder="0"
						allowfullscreen
						loading="lazy"
					></iframe>
				</div>
			{:else}
				<div class="no-game-content">
					<div class="no-game-icon">🎮</div>
					<h3>{lang === 'en' ? 'Game Not Available' : '游戏暂不可用'}</h3>
					<p>{lang === 'en' ? 'This game is temporarily unavailable. Please try again later.' : '此游戏暂时无法加载，请稍后再试。'}</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.game-container {
		width: 100%;
		padding: 0.5rem;
		box-sizing: border-box;
	}

	.loading-container,
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		text-align: center;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #007bff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.error-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.error-container h2 {
		margin: 0 0 1rem 0;
		color: #dc3545;
	}

	.error-container p {
		margin: 0 0 2rem 0;
		color: #6c757d;
		max-width: 500px;
	}

	.btn-primary {
		background: #007bff;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		text-decoration: none;
		display: inline-block;
	}

	.btn-primary:hover {
		background: #0056b3;
	}

	.game-header {
		margin-bottom: 1rem;
	}

	.back-button {
		background: #6c757d;
		color: white;
		border: none;
		padding: 0.4rem 0.8rem;
		border-radius: 4px;
		cursor: pointer;
		margin-bottom: 0.8rem;
		font-size: 0.8rem;
	}

	.back-button:hover {
		background: #545b62;
	}

	.game-info h1 {
		margin: 0 0 0.8rem 0;
		color: #495057;
		font-size: 1.8rem;
	}

	.game-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.8rem;
		align-items: center;
		margin-bottom: 0.8rem;
	}

	.popularity-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: linear-gradient(135deg, #ffd700, #ffed4e);
		color: #8b6914;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-weight: 600;
		box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
		border: 1px solid rgba(255, 215, 0, 0.5);
	}

	.popularity-icon {
		font-size: 1.1rem;
	}

	.popularity-count {
		font-size: 1.1rem;
		font-weight: bold;
	}

	.popularity-label {
		font-size: 0.85rem;
		opacity: 0.8;
	}

	.category-tag {
		background: #e9ecef;
		color: #495057;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.875rem;
		white-space: nowrap;
	}

	.publish-date {
		color: #6c757d;
		font-size: 0.875rem;
	}

	.game-description {
		margin: 0 0 1rem 0;
		color: #495057;
		line-height: 1.5;
		font-size: 1rem;
	}

	.game-instructions {
		background: #f8f9fa;
		padding: 1rem;
		border-radius: 6px;
		border-left: 3px solid #007bff;
		margin-bottom: 1rem;
	}

	.game-instructions h3 {
		margin: 0 0 0.4rem 0;
		color: #495057;
		font-size: 1.1rem;
	}

	.game-instructions p {
		margin: 0;
		color: #6c757d;
		line-height: 1.5;
	}

	.game-frame-container {
		position: relative;
		width: 100%;
		height: 70vh;
		min-height: 500px;
		border-radius: 6px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		background: #f8f9fa;
	}

	.game-frame {
		width: 100%;
		height: 100%;
		border: none;
	}

	.no-game-content {
		text-align: center;
		padding: 2rem 1rem;
		background: #f8f9fa;
		border-radius: 6px;
		border: 2px dashed #dee2e6;
	}

	.no-game-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.no-game-content h3 {
		margin: 0 0 1rem 0;
		color: #495057;
	}

	.no-game-content p {
		margin: 0;
		color: #6c757d;
	}

	.game-preview-banner {
		width: 100%;
		max-height: 250px;
		overflow: hidden;
		border-radius: 6px;
		margin-bottom: 1rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	:global(.preview-image) {
		width: 100%;
		max-height: 250px;
		border-radius: 6px;
	}

	/* 替换游戏内容布局样式 */
	.game-content-full {
		width: 100%;
		box-sizing: border-box;
	}
	
	/* 调整媒体查询 */
	@media (max-width: 1024px) {
		.game-content-full {
			padding: 0 0.5rem;
		}
	}
	
	@media (max-width: 768px) {
		/* 无需特定样式 */
	}
	
	@media (max-width: 480px) {
		/* 无需特定样式 */
	}
</style>
