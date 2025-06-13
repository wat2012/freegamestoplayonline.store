<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { 
		currentLanguage, 
		t, 
		initLanguage
	} from '$lib/utils/language.js';

	let lang = 'zh';

	// 订阅语言变化
	currentLanguage.subscribe(value => {
		lang = value;
	});

	onMount(async () => {
		initLanguage();
	});
</script>

<div class="admin-layout">
	<header class="admin-header">
		<div class="header-content">
			<div class="header-left">
				<h1><a href="/admin">FreeWebGames Store</a></h1>
				<span class="admin-badge">Admin Panel</span>
			</div>
			<nav class="admin-nav">
				<a href="/admin" class:active={$page.url.pathname === '/admin'}>
					Game Management
				</a>
				<a href="/admin/games/new" class:active={$page.url.pathname === '/admin/games/new'}>
					Add Game
				</a>
				<a href="/" target="_blank">
					Preview Site
				</a>
			</nav>
		</div>
	</header>

	<main class="admin-main">
		<slot />
	</main>

	<footer class="admin-footer">
		<p>&copy; 2024 FreeWebGames Store. Game Management System</p>
	</footer>
</div>

<style>
	.admin-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: #f8f9fa;
	}

	.admin-header {
		background: white;
		border-bottom: 1px solid #dee2e6;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.header-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.header-left h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	.header-left h1 a {
		text-decoration: none;
		color: #495057;
	}

	.admin-badge {
		background: #007bff;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.admin-nav {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.admin-nav a {
		text-decoration: none;
		color: #495057;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		transition: background 0.2s;
		font-weight: 500;
	}

	.admin-nav a:hover {
		background: #e9ecef;
	}

	.admin-nav a.active {
		background: #007bff;
		color: white;
	}

	.admin-main {
		flex: 1;
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;
	}

	.admin-footer {
		background: white;
		border-top: 1px solid #dee2e6;
		padding: 1rem 2rem;
		text-align: center;
		color: #6c757d;
		font-size: 0.875rem;
	}

	.admin-footer p {
		margin: 0;
	}

	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			align-items: stretch;
		}

		.admin-nav {
			justify-content: center;
			flex-wrap: wrap;
		}

		.header-right {
			justify-content: center;
		}

		.admin-main {
			padding: 1rem;
		}
	}
</style>
