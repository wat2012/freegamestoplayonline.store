<!-- 公共游戏卡片组件 GameCard.svelte -->
<script>
	import { getLocalizedField, getCategoryName, getCategoryIcon, t } from '$lib/utils/language.js';
	import OptimizedImage from './OptimizedImage.svelte';
	
	export let game;
	export let lang = 'en';
	export let index = 0; // 用于动画延迟
	export let showActions = true; // 是否显示操作按钮
	export let compact = false; // 紧凑模式
</script>

<article 
	class="game-card" 
	class:compact
	style="animation-delay: {index * 0.05}s"
>
	<div class="game-image-container">
		<OptimizedImage
			src={game.preview_image}
			thumbSrc={game.preview_image_thumb}
			alt={getLocalizedField(game, 'title', lang)}
			className="game-image"
			lazy={true}
		/>
	</div>
	
	<div class="game-content">
		<div class="game-header">
			<h3>{getLocalizedField(game, 'title', lang)}</h3>
			{#if game.category}
				<span class="game-category-tag">
					{getCategoryIcon(game.category)} {getCategoryName(game.category, lang)}
				</span>
			{/if}
		</div>
		
		<p class="game-description">
			{#if getLocalizedField(game, 'description', lang)}
				{getLocalizedField(game, 'description', lang).substring(0, compact ? 100 : 120) + 
				(getLocalizedField(game, 'description', lang).length > (compact ? 100 : 120) ? '...' : '')}
			{:else}
				{lang === 'en' ? 'Premium gaming experience' : '优质游戏体验'}
			{/if}
		</p>
		
		<div class="game-meta">
			<div class="game-stats">
				<div class="popularity-badge">
					👁️ {game.popularity_score || 0}
				</div>
				<small>
					{t('publishedOn', lang)}: {new Date(game.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-CN')}
				</small>
			</div>
			{#if showActions && game.iframe_url}
				<div class="game-actions">
					<a href="/games/{game.id}" class="play-button">
						<span class="play-icon">▶</span>
						<span class="play-text">{t('startGame', lang)}</span>
					</a>
				</div>
			{/if}
		</div>
	</div>
</article>

<style>
	.game-card {
		border: none;
		border-radius: 15px;
		overflow: hidden;
		background: white;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
		transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		animation: popIn 0.5s ease-out both;
		position: relative;
	}

	.game-card:hover {
		transform: translateY(-8px) scale(1.02);
		box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
	}
	
	.game-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 5px;
		background: linear-gradient(90deg, #6a11cb, #2575fc);
		z-index: 1;
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 0.3s ease;
	}
	
	.game-card:hover::before {
		transform: scaleX(1);
	}

	.game-image-container {
		position: relative;
		overflow: hidden;
		border-radius: 15px 15px 0 0;
	}

	:global(.game-image) {
		width: 100%;
		height: 200px;
		border-radius: 15px 15px 0 0;
		transition: transform 0.5s ease;
		object-fit: cover;
	}
	
	.game-card:hover :global(.game-image) {
		transform: scale(1.05);
	}

	.game-content {
		padding: 1.5rem;
	}

	.game-card.compact .game-content {
		padding: 1rem;
	}

	.game-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.8rem;
		gap: 0.8rem;
	}

	.game-header h3 {
		margin: 0;
		color: #343a40;
		font-size: 1.25rem;
		flex: 1;
		transition: color 0.3s ease;
	}

	.game-card.compact .game-header h3 {
		font-size: 1.1rem;
	}
	
	.game-card:hover .game-header h3 {
		color: #6a11cb;
	}

	.game-category-tag {
		background: linear-gradient(90deg, rgba(106, 17, 203, 0.1), rgba(37, 117, 252, 0.1));
		color: #6a11cb;
		padding: 0.3rem 0.8rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 600;
		white-space: nowrap;
		box-shadow: 0 2px 5px rgba(106, 17, 203, 0.1);
		transition: all 0.3s ease;
	}

	.game-card.compact .game-category-tag {
		padding: 0.2rem 0.6rem;
		font-size: 0.7rem;
	}
	
	.game-card:hover .game-category-tag {
		background: linear-gradient(90deg, rgba(106, 17, 203, 0.15), rgba(37, 117, 252, 0.15));
		box-shadow: 0 3px 8px rgba(106, 17, 203, 0.15);
	}

	.game-description {
		margin: 0 0 1.2rem 0;
		color: #6c757d;
		line-height: 1.6;
		font-size: 0.95rem;
	}

	.game-card.compact .game-description {
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	.game-meta {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		flex-wrap: wrap;
		gap: 0.8rem;
	}

	.game-card.compact .game-meta {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.game-stats {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.game-card.compact .game-stats {
		flex-direction: row;
		align-items: center;
		gap: 1rem;
	}

	.popularity-badge {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		background: linear-gradient(90deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.15));
		color: #ff9800;
		padding: 0.3rem 0.8rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 600;
		box-shadow: 0 2px 5px rgba(255, 152, 0, 0.1);
		transition: all 0.3s ease;
		width: fit-content;
	}
	
	.game-card:hover .popularity-badge {
		background: linear-gradient(90deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.2));
		box-shadow: 0 3px 8px rgba(255, 152, 0, 0.15);
	}

	.game-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.play-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: linear-gradient(90deg, #6a11cb, #2575fc);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 25px;
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 600;
		transition: all 0.3s ease;
		box-shadow: 0 4px 10px rgba(106, 17, 203, 0.2);
	}

	.game-card.compact .play-button {
		padding: 0.4rem 0.8rem;
		font-size: 0.8rem;
	}
	
	.play-icon {
		font-size: 0.8rem;
		transition: transform 0.3s ease;
	}

	.play-button:hover {
		background: linear-gradient(90deg, #5a0cb6, #1565fc);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px rgba(106, 17, 203, 0.3);
		text-decoration: none;
		color: white;
	}
	
	.play-button:hover .play-icon {
		transform: scale(1.2);
	}
	
	.play-button:active {
		transform: translateY(0);
		box-shadow: 0 2px 5px rgba(106, 17, 203, 0.2);
	}

	.game-meta small {
		color: #adb5bd;
		font-size: 0.8rem;
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

	@media (max-width: 768px) {
		.game-meta {
			flex-direction: column;
			align-items: flex-start;
		}
		
		.game-actions {
			width: 100%;
			justify-content: space-between;
		}

		.game-stats {
			flex-direction: row;
			align-items: center;
			gap: 1rem;
		}
	}
</style>
