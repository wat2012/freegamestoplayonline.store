<script>
	import { createEventDispatcher } from 'svelte';
	import { currentLanguage, categoryTranslations, t } from '$lib/utils/language.js';
	
	export let selectedCategory = '';
	
	const dispatch = createEventDispatcher();
	
	let lang = 'zh';
	
	// 订阅语言变化
	currentLanguage.subscribe(value => {
		lang = value;
	});
	
	function selectCategory(category) {
		selectedCategory = category;
		dispatch('categorySelected', { category });
	}
	
	// 生成分类列表，包含"全部游戏"选项
	$: displayCategories = [
		{ 
			id: '', 
			name: t('allGames', lang),
			icon: '🎮' 
		},
		...Object.keys(categoryTranslations).map(categoryId => ({
			id: categoryId,
			name: categoryTranslations[categoryId][lang],
			icon: categoryTranslations[categoryId].icon
		}))
	];
</script>

<nav class="categories-nav">
	<h3>{t('gameCategories', lang)}</h3>
	<div class="categories-grid">
		{#each displayCategories as category}
			<button 
				class="category-btn"
				class:active={selectedCategory === category.id}
				on:click={() => selectCategory(category.id)}
			>
				<div class="category-icon-wrapper">
					<span class="category-icon">{category.icon}</span>
				</div>
				<span class="category-name">{category.name}</span>
			</button>
		{/each}
	</div>
</nav>

<style>
	.categories-nav {
		margin-bottom: 2rem;
		background: linear-gradient(145deg, rgba(255,255,255,0.8) 0%, rgba(240,240,255,0.9) 100%);
		padding: 1.5rem;
		border-radius: 12px;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
		position: relative;
		overflow: hidden;
	}
	
	/* Gaming-themed decorative elements */
	.categories-nav::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image: 
			radial-gradient(circle at 10% 10%, rgba(255, 215, 0, 0.1) 10%, transparent 20%),
			radial-gradient(circle at 90% 30%, rgba(0, 123, 255, 0.1) 10%, transparent 20%),
			radial-gradient(circle at 30% 80%, rgba(76, 175, 80, 0.1) 15%, transparent 25%),
			radial-gradient(circle at 80% 90%, rgba(233, 30, 99, 0.1) 10%, transparent 20%);
		z-index: 0;
	}
	
	.categories-nav h3 {
		margin: 0 0 1.2rem 0;
		color: #2c3e50;
		font-size: 1.4rem;
		font-weight: 700;
		position: relative;
		z-index: 1;
		text-shadow: 1px 1px 0 rgba(255,255,255,0.8);
		text-align: center;
		letter-spacing: 0.5px;
	}
	
	.categories-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 0.8rem;
		position: relative;
		z-index: 1;
	}
	
	.category-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6rem;
		padding: 1rem 0.5rem;
		border: none;
		border-radius: 12px;
		background: linear-gradient(145deg, #ffffff, #f0f0f0);
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		position: relative;
		overflow: hidden;
	}
	
	.category-btn::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(145deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%);
		opacity: 0;
		transition: opacity 0.3s ease;
	}
	
	.category-btn:hover {
		transform: translateY(-5px) scale(1.03);
		box-shadow: 0 8px 15px rgba(0, 123, 255, 0.15);
	}
	
	.category-btn:hover::after {
		opacity: 1;
	}
	
	.category-btn.active {
		background: linear-gradient(145deg, #007bff, #1a88ff);
		color: white;
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(0, 123, 255, 0.3);
	}
	
	.category-btn:active {
		transform: translateY(0px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	
	.category-icon-wrapper {
		width: 60px;
		height: 60px;
		background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(230,230,250,0.8) 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 0.3rem;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
	}
	
	.category-btn.active .category-icon-wrapper {
		background: rgba(255, 255, 255, 0.25);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}
	
	.category-btn:hover .category-icon-wrapper {
		transform: rotate(5deg) scale(1.1);
	}
	
	.category-icon {
		font-size: 2rem;
		transition: all 0.3s ease;
	}
	
	.category-btn:hover .category-icon {
		animation: bounce 0.5s ease;
	}
	
	.category-name {
		font-size: 0.95rem;
		font-weight: 600;
		text-align: center;
		transition: all 0.3s ease;
	}
	
	.category-btn.active .category-name {
		transform: scale(1.05);
	}
	
	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-5px); }
	}
	
	@media (max-width: 768px) {
		.categories-grid {
			grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		}
		
		.category-icon-wrapper {
			width: 50px;
			height: 50px;
		}
		
		.category-icon {
			font-size: 1.5rem;
		}
		
		.category-name {
			font-size: 0.8rem;
		}
	}
</style>
