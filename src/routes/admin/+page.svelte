<script>
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient.js';
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

	let games = [];
	let loading = true;
	let lang = 'zh';
	let gameStats = {
		total: 0,
		published: 0,
		draft: 0,
		byCategory: {},
		totalViews: 0,
		mostPopular: null
	};

	// 订阅语言变化
	currentLanguage.subscribe(value => {
		lang = value;
	});

	onMount(async () => {
		initLanguage();
		
		// 并行加载数据
		await Promise.all([
			loadGames(),
			loadStats()
		]);
	});

	async function loadGames() {
		try {
			// 使用优化的查询，只获取必要字段
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
					published,
					popularity_score,
					iframe_url
				`)
				.order('created_at', { ascending: false });

			if (error) throw error;
			games = data || [];
		} catch (error) {
			console.error('Error fetching games:', error);
		} finally {
			loading = false;
		}
	}

	async function loadStats() {
		try {
			gameStats = await GameService.getGameStats();
			gameStats.mostPopular = games.reduce((prev, current) => 
				(current.popularity_score || 0) > (prev.popularity_score || 0) ? current : prev
			, games[0]);
		} catch (error) {
			console.error('Error loading stats:', error);
		}
	}

	async function createGame() {
		goto('/admin/games/new');
	}

	async function deleteGame(id) {
		if (confirm(t('confirmDelete', lang))) {
			try {
				const { error } = await supabase
					.from('games')
					.delete()
					.eq('id', id);

				if (error) throw error;
				
				games = games.filter(game => game.id !== id);
				
				// 清除相关缓存
				GameService.clearCache();
				
				alert(t('deleteSuccess', lang));
			} catch (error) {
				console.error('Error deleting game:', error);
				alert(t('deleteFailed', lang));
			}
		}
	}

	async function toggleGameStatus(game) {
		try {
			const { error } = await supabase
				.from('games')
				.update({ published: !game.published })
				.eq('id', game.id);

			if (error) throw error;
			
			// 更新本地状态
			games = games.map(g => 
				g.id === game.id ? { ...g, published: !g.published } : g
			);
			
			// 清除相关缓存
			GameService.clearCache('games');
			GameService.clearCache('popularGames');
		} catch (error) {
			console.error('Error updating game status:', error);
			alert(t('updateStatusFailed', lang));
		}
	}

	// Calculate statistics when games change - 修复重复声明
	$: {
		if (games.length > 0) {
			gameStats.total = games.length;
			gameStats.published = games.filter(g => g.published).length;
			gameStats.draft = games.filter(g => !g.published).length;
			
			// Calculate total views and find most popular game
			gameStats.totalViews = games.reduce((sum, game) => sum + (game.popularity_score || 0), 0);
			gameStats.mostPopular = games.reduce((prev, current) => 
				(current.popularity_score || 0) > (prev.popularity_score || 0) ? current : prev
			, games[0]);
			
			// Count by category
			gameStats.byCategory = {};
			games.forEach(game => {
				const category = game.category || 'uncategorized';
				gameStats.byCategory[category] = (gameStats.byCategory[category] || 0) + 1;
			});
		}
	}

	async function handleLogout() {
		if (confirm('确定要退出登录吗？\nAre you sure you want to logout?')) {
			try {
				const { error } = await supabase.auth.signOut();
				if (error) throw error;
				goto('/login');
			} catch (error) {
				console.error('Error signing out:', error);
				alert('退出登录失败 / Logout failed');
			}
		}
	}
</script>

<svelte:head>
	<title>{t('adminTitle', lang)} - FreeWebGames Store</title>
</svelte:head>

<div class="admin-container">
	<div class="admin-header">
		<h1>{t('adminTitle', lang)}</h1>
		<p>{t('welcomeBack', lang)}, {user?.email}</p>
	</div>

	<!-- Game Statistics -->
	<div class="stats-grid">
		<div class="stat-card">
			<h3>游戏总数</h3>
			<div class="stat-number">{gameStats.total}</div>
		</div>
		<div class="stat-card published">
			<h3>已发布</h3>
			<div class="stat-number">{gameStats.published}</div>
		</div>
		<div class="stat-card draft">
			<h3>草稿</h3>
			<div class="stat-number">{gameStats.draft}</div>
		</div>
		<div class="stat-card">
			<h3>总浏览量</h3>
			<div class="stat-number">{gameStats.totalViews.toLocaleString()}</div>
		</div>
		<div class="stat-card popularity">
			<h3>最受欢迎</h3>
			<div class="stat-text">
				{#if gameStats.mostPopular}
					{getLocalizedField(gameStats.mostPopular, 'title', lang)}
					<small>({gameStats.mostPopular.popularity_score || 0} 次浏览)</small>
				{:else}
					暂无数据
				{/if}
			</div>
		</div>
	</div>

	<div class="admin-actions">
		<button class="btn-primary" on:click={createGame}>{t('addNewGame', lang)}</button>
	</div>

	<section class="games-management">
		<h2>{t('gameManagement', lang)}</h2>
		{#if loading}
			<div class="loading-container">
				<div class="loading-spinner"></div>
				<p>{t('loading', lang)}</p>
			</div>
		{:else if games.length === 0}
			<div class="empty-state">
				<div class="empty-icon">🎮</div>
				<h3>还没有游戏</h3>
				<p>开始添加您的第一个游戏吧！</p>
				<button class="btn-primary" on:click={createGame}>{t('addNewGame', lang)}</button>
			</div>
		{:else}
			<div class="games-table">
				<table>
					<thead>
						<tr>
							<th>预览图</th>
							<th>{t('gameTitle', lang)}</th>
							<th>{t('category', lang)}</th>
							<th>{t('gameDescription', lang)}</th>
							<th>流行度</th>
							<th>{t('status', lang)}</th>
							<th>{t('createTime', lang)}</th>
							<th>{t('actions', lang)}</th>
						</tr>
					</thead>
					<tbody>
						{#each games as game}
							<tr>
								<td>
									<div class="game-preview">
										<OptimizedImage
											src={game.preview_image}
											thumbSrc={game.preview_image_thumb}
											alt={getLocalizedField(game, 'title', lang)}
											className="admin-thumbnail"
											placeholder="🎮"
										/>
									</div>
								</td>
								<td>
									<div class="game-title">
										<div class="title-bilingual">
											<div class="title-zh">{game.title}</div>
											{#if game.title_en}
												<div class="title-en">{game.title_en}</div>
											{/if}
										</div>
										{#if game.iframe_url}
											<a href={game.iframe_url} target="_blank" class="game-link" title="访问游戏">🎮</a>
										{/if}
									</div>
								</td>
								<td>
									<span class="category-tag">
										{getCategoryIcon(game.category)} {getCategoryName(game.category, lang)}
									</span>
								</td>
								<td>
									<div class="game-description">
										{getLocalizedField(game, 'description', lang) ? 
											getLocalizedField(game, 'description', lang).substring(0, 100) + 
											(getLocalizedField(game, 'description', lang).length > 100 ? '...' : '') : 
											t('noDescription', lang)}
									</div>
								</td>
								<td>
									<div class="popularity-info">
										<div class="popularity-score">{game.popularity_score || 0}</div>
										<div class="popularity-label">浏览次数</div>
										<div class="popularity-note">可编辑</div>
									</div>
								</td>
								<td>
									<span class="status" class:published={game.published}>
										{game.published ? t('published', lang) : t('draft', lang)}
									</span>
									<button 
										class="btn-toggle" 
										on:click={() => toggleGameStatus(game)}
										title={game.published ? t('offline', lang) : t('online', lang)}
									>
										{game.published ? t('offline', lang) : t('online', lang)}
									</button>
								</td>
								<td>{new Date(game.created_at).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')}</td>
								<td>
									<a href="/admin/games/{game.id}/edit">{t('edit', lang)}</a>
									<a href="/games/{game.id}" target="_blank">{t('preview', lang)}</a>
									<button class="btn-danger" on:click={() => deleteGame(game.id)}>{t('delete', lang)}</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>

<style>
	.admin-container {
		max-width: 1200px;
		margin: 0 auto;
	}

	.admin-header {
		margin-bottom: 2rem;
		text-align: center;
	}

	.admin-header h1 {
		margin: 0 0 0.5rem 0;
		color: #495057;
	}

	.admin-header p {
		margin: 0;
		color: #6c757d;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		text-align: center;
		border-left: 4px solid #007bff;
	}

	.stat-card.published {
		border-left-color: #28a745;
	}

	.stat-card.draft {
		border-left-color: #ffc107;
	}

	.stat-card.popularity {
		border-left-color: #e83e8c;
	}

	.stat-card h3 {
		margin: 0 0 0.5rem 0;
		color: #6c757d;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.stat-number {
		font-size: 2rem;
		font-weight: bold;
		color: #495057;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		color: #495057;
	}

	.empty-state p {
		margin: 0 0 2rem 0;
		color: #6c757d;
	}

	.loading-container {
		text-align: center;
		padding: 3rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #007bff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.btn-primary {
		background: #007bff;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.btn-danger {
		background: #dc3545;
		color: white;
		border: none;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		margin-left: 0.5rem;
	}

	.btn-toggle {
		background: #17a2b8;
		color: white;
		border: none;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.75rem;
		margin-left: 0.5rem;
	}

	.btn-toggle:hover {
		background: #138496;
	}

	.games-table {
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 900px;
	}

	th, td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid #dee2e6;
	}

	th {
		background: #f8f9fa;
		font-weight: 600;
	}

	:global(.admin-thumbnail) {
		width: 60px;
		height: 40px;
		border-radius: 4px;
	}
	
	.game-preview {
		width: 60px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		overflow: hidden;
		background: #f8f9fa;
	}

	.status {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.875rem;
		background: #6c757d;
		color: white;
	}

	.status.published {
		background: #28a745;
	}

	a {
		color: #007bff;
		text-decoration: none;
		margin-right: 0.5rem;
	}

	a:hover {
		text-decoration: underline;
	}

	.game-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.game-link {
		text-decoration: none;
		font-size: 1.2rem;
	}

	.game-description {
		max-width: 300px;
		color: #6c757d;
		font-size: 0.875rem;
	}

	.category-tag {
		background: #e9ecef;
		color: #495057;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		white-space: nowrap;
	}

	.title-bilingual {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.title-zh {
		font-weight: 600;
		color: #495057;
	}

	.title-en {
		font-size: 0.875rem;
		color: #6c757d;
		font-style: italic;
	}

	.stat-text {
		font-size: 0.9rem;
		font-weight: 600;
		color: #495057;
		text-align: center;
	}

	.stat-text small {
		display: block;
		font-size: 0.75rem;
		color: #6c757d;
		font-weight: normal;
		margin-top: 0.25rem;
	}

	.popularity-info {
		text-align: center;
	}

	.popularity-score {
		font-size: 1.1rem;
		font-weight: bold;
		color: #e83e8c;
	}

	.popularity-label {
		font-size: 0.75rem;
		color: #6c757d;
		margin-top: 0.25rem;
	}

	.popularity-note {
		font-size: 0.7rem;
		color: #28a745;
		margin-top: 0.1rem;
		font-style: italic;
	}

	@media (max-width: 768px) {
		.games-table {
			margin: 0 -1rem;
		}
	}
</style>
