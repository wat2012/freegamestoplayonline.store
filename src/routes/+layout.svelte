<script>
	import { onMount } from 'svelte';
	import { currentLanguage, t, initLanguage, categoryTranslations, getCategoryName, switchLanguage } from '$lib/utils/language.js';
	import { page } from '$app/stores';
	
	let lang = 'en';

	currentLanguage.subscribe(value => {
		lang = value;
	});

	onMount(() => {
		initLanguage();
	});

	function handleLanguageSwitch(newLang) {
		switchLanguage(newLang);
	}

	$: categoryNavItems = Object.keys(categoryTranslations).map(categoryId => ({
		id: categoryId,
		name: getCategoryName(categoryId, lang),
		href: `/?category=${categoryId}`
	}));
</script>

<div class="app">
	<nav>
		<h1><a href="/">FreeWebGames Store</a></h1>
		<div class="nav-links">
			<a href="/" class:active={$page.url.pathname === '/' && !$page.url.searchParams.get('category')}>
				{t('gameHomepage', lang)}
			</a>
			
			{#each categoryNavItems as category}
				<a 
					href={category.href} 
					class:active={$page.url.searchParams.get('category') === category.id}
				>
					{category.name}
				</a>
			{/each}
			
			<div class="language-switcher">
				<button 
					class="lang-btn" 
					class:active={lang === 'en'}
					on:click={() => handleLanguageSwitch('en')}
				>
					EN
				</button>
				<button 
					class="lang-btn" 
					class:active={lang === 'zh'}
					on:click={() => handleLanguageSwitch('zh')}
				>
					中
				</button>
			</div>
		</div>
	</nav>

	<main>
		<slot />
	</main>

	<footer class="site-footer">
		<div class="footer-content">
			<div class="footer-section">
				<h3>FreeWebGames Store</h3>
				<p>{lang === 'en' ? 'Your Next Game Is Just One Click Away - Free online gaming experience' : '你的下一个游戏只需一键即可 - 免费在线游戏体验'}</p>
			</div>
			
			<div class="footer-section">
				<h4>{lang === 'en' ? 'Quick Links' : '快速链接'}</h4>
				<ul>
					<li><a href="/">{lang === 'en' ? 'Home' : '首页'}</a></li>
					<li><a href="/?category=action">{getCategoryName('action', lang)}</a></li>
					<li><a href="/?category=puzzle">{getCategoryName('puzzle', lang)}</a></li>
					<li><a href="/?category=strategy">{getCategoryName('strategy', lang)}</a></li>
				</ul>
			</div>
			
			<div class="footer-section">
				<h4>{lang === 'en' ? 'Language' : '语言'}</h4>
				<div class="footer-language-switcher">
					<button 
						class="footer-lang-btn" 
						class:active={lang === 'en'}
						on:click={() => handleLanguageSwitch('en')}
					>
						English
					</button>
					<button 
						class="footer-lang-btn" 
						class:active={lang === 'zh'}
						on:click={() => handleLanguageSwitch('zh')}
					>
						中文
					</button>
				</div>
			</div>
		</div>
		
		<div class="footer-bottom">
			<div class="footer-bottom-content">
				<p class="copyright">
					© {new Date().getFullYear()} FreeWebGames Store. {lang === 'en' ? 'All rights reserved.' : '版权所有。'}
				</p>
				<p class="powered-by">
					{lang === 'en' ? 'Powered by' : '技术支持'} <a href="https://kit.svelte.dev" target="_blank" rel="noopener">SvelteKit</a>
				</p>
			</div>
		</div>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		min-height: 100vh;
	}

	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	/* Common gradient and transitions */
	:global(.gradient-text) {
		background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	:global(.glass-effect) {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	:global(.hover-transform) {
		transition: all 0.3s ease;
	}

	:global(.hover-transform:hover) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
	}

	nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 1rem;
		flex-wrap: wrap;
		gap: 0.5rem;
		position: sticky;
		top: 0;
		z-index: 100;
		box-shadow: 0 4px 20px rgba(31, 38, 135, 0.3);
		min-height: 50px;
	}

	nav {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(20px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
	}

	nav h1 {
		margin: 0;
		font-size: 1.4rem;
		font-weight: 800;
		text-shadow: 0 0 30px rgba(255, 107, 107, 0.3);
	}

	nav h1 a {
		text-decoration: none;
		color: inherit;
		transition: transform 0.3s ease;
		display: inline-block;
		background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	nav h1 a:hover {
		transform: scale(1.05);
	}

	.nav-links {
		display: flex;
		gap: 0.3rem;
		align-items: center;
		flex-wrap: wrap;
	}

	/* Unified button/link styles */
	.nav-links a, .nav-links button, .lang-btn {
		text-decoration: none;
		color: rgba(255, 255, 255, 0.9);
		padding: 0.5rem 0.8rem;
		border: none;
		background: rgba(255, 255, 255, 0.1);
		cursor: pointer;
		border-radius: 25px;
		transition: all 0.3s ease;
		font-weight: 600;
		font-size: 0.8rem;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		position: relative;
		overflow: hidden;
	}

	.nav-links a::before, .nav-links button::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s;
	}

	.nav-links a:hover, .nav-links button:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
	}

	.nav-links a:hover::before, .nav-links button:hover::before {
		left: 100%;
	}

	.nav-links a.active, .lang-btn.active {
		background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
		color: white;
		box-shadow: 0 6px 20px rgba(255, 107, 107, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.language-switcher {
		display: flex;
		border-radius: 50px;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.lang-btn {
		padding: 0.4rem 0.6rem !important;
		margin: 0;
		border-radius: 0;
		min-width: 35px;
		font-size: 0.75rem;
	}

	main {
		padding: 0.5rem;
		flex: 1;
		background: rgba(255, 255, 255, 0.02);
		backdrop-filter: blur(5px);
		box-sizing: border-box;
		width: 100%;
	}

	.site-footer {
		background: rgba(0, 0, 0, 0.8);
		color: #ecf0f1;
		margin-top: auto;
		padding-top: 2rem;
		backdrop-filter: blur(20px);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.footer-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1rem 1rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.footer-section h3 {
		color: #4ecdc4;
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
		font-weight: 800;
		background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.footer-section h4 {
		color: #ecf0f1;
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		font-weight: 700;
		position: relative;
		padding-bottom: 0.4rem;
	}

	.footer-section h4::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 35px;
		height: 2px;
		background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
		border-radius: 2px;
	}

	.footer-section p {
		margin: 0;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.9rem;
	}

	.footer-section ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.footer-section li {
		margin-bottom: 0.6rem;
	}

	.footer-section a {
		color: rgba(255, 255, 255, 0.8);
		text-decoration: none;
		transition: all 0.3s ease;
		position: relative;
		padding: 0.2rem 0;
		display: inline-block;
	}

	.footer-section a::before {
		content: '';
		position: absolute;
		width: 0;
		height: 2px;
		bottom: 0;
		left: 0;
		background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
		transition: width 0.3s ease;
	}

	.footer-section a:hover {
		color: #4ecdc4;
		transform: translateX(3px);
	}

	.footer-section a:hover::before {
		width: 100%;
	}

	.footer-language-switcher {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.footer-lang-btn {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: rgba(255, 255, 255, 0.8);
		padding: 0.6rem 1.2rem;
		border-radius: 50px;
		cursor: pointer;
		transition: all 0.3s ease;
		text-align: left;
		font-weight: 600;
		backdrop-filter: blur(10px);
		font-size: 0.9rem;
	}

	.footer-lang-btn:hover {
		border-color: #4ecdc4;
		color: #4ecdc4;
		transform: translateY(-1px);
		box-shadow: 0 6px 20px rgba(78, 205, 196, 0.2);
	}

	.footer-lang-btn.active {
		background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
		border-color: transparent;
		color: white;
		box-shadow: 0 6px 20px rgba(255, 107, 107, 0.3);
	}

	.footer-bottom {
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		padding: 1.5rem 0;
		background: rgba(0, 0, 0, 0.3);
	}

	.footer-bottom-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1.5rem;
		text-align: center;
	}

	.copyright {
		margin: 0 0 0.5rem 0;
		font-weight: 600;
		color: #ecf0f1;
		font-size: 0.95rem;
	}

	.powered-by {
		margin: 0;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.6);
	}

	.powered-by a {
		color: #4ecdc4;
		text-decoration: none;
		font-weight: 600;
		transition: all 0.3s ease;
	}

	.powered-by a:hover {
		color: #ff6b6b;
		text-decoration: underline;
	}

	@media (max-width: 768px) {
		nav {
			flex-direction: column;
			padding: 0.4rem 0.8rem;
			min-height: auto;
		}

		nav h1 {
			font-size: 1.2rem;
		}

		.nav-links {
			justify-content: center;
			gap: 0.2rem;
		}

		.nav-links a, .nav-links button {
			padding: 0.3rem 0.5rem;
			font-size: 0.65rem;
		}

		main {
			padding: 0.4rem;
		}

		.footer-content {
			grid-template-columns: 1fr;
			padding: 0 0.5rem 0.8rem;
			gap: 1rem;
		}

		.footer-bottom-content {
			padding: 0 0.5rem;
		}

		.footer-language-switcher {
			flex-direction: row;
			gap: 0.4rem;
		}

		.footer-lang-btn {
			flex: 1;
			text-align: center;
			padding: 0.3rem 0.5rem;
			font-size: 0.75rem;
		}

		.footer-section h3 {
			font-size: 1.1rem;
		}

		.footer-section h4 {
			font-size: 0.9rem;
		}
	}

	@media (max-width: 480px) {
		nav {
			padding: 0.3rem;
		}

		.nav-links {
			flex-direction: column;
			width: 100%;
			gap: 0.2rem;
		}

		.nav-links a, .nav-links button {
			width: 100%;
			text-align: center;
			padding: 0.4rem;
			font-size: 0.7rem;
		}

		.language-switcher {
			width: 100%;
			justify-content: center;
		}

		main {
			padding: 0.3rem;
		}

		.footer-content {
			padding: 0 0.3rem 0.5rem;
		}

		.footer-bottom-content {
			padding: 0 0.3rem;
		}
	}

	@media (min-width: 1400px) {
		main {
			padding: 0.8rem;
		}
	}
</style>
