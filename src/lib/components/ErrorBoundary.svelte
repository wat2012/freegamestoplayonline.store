<script>
	import { onMount } from 'svelte';
	import { currentLanguage } from '$lib/utils/language.js';
	
	export let fallback = null;
	export let onError = null;
	
	let hasError = false;
	let errorMessage = '';
	let lang = 'en';
	
	currentLanguage.subscribe(value => {
		lang = value;
	});
	
	onMount(() => {
		// 捕获未处理的错误
		const handleError = (event) => {
			console.error('Unhandled error:', event.error);
			hasError = true;
			errorMessage = event.error?.message || 'An unexpected error occurred';
			
			if (onError) {
				onError(event.error);
			}
		};
		
		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', (event) => {
			handleError({ error: event.reason });
		});
		
		return () => {
			window.removeEventListener('error', handleError);
		};
	});
	
	function retry() {
		hasError = false;
		errorMessage = '';
		// 重新加载页面
		window.location.reload();
	}
</script>

{#if hasError}
	{#if fallback}
		<svelte:component this={fallback} {errorMessage} {retry} />
	{:else}
		<div class="error-boundary">
			<div class="error-content">
				<div class="error-icon">⚠️</div>
				<h2>{lang === 'en' ? 'Something went wrong' : '出错了'}</h2>
				<p class="error-message">{errorMessage}</p>
				<div class="error-actions">
					<button class="retry-button" on:click={retry}>
						{lang === 'en' ? 'Reload Page' : '重新加载'}
					</button>
					<a href="/" class="home-link">
						{lang === 'en' ? 'Go Home' : '返回首页'}
					</a>
				</div>
			</div>
		</div>
	{/if}
{:else}
	<slot />
{/if}

<style>
	.error-boundary {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		padding: 2rem;
		background: #f8f9fa;
	}
	
	.error-content {
		text-align: center;
		max-width: 500px;
		background: white;
		padding: 3rem 2rem;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	
	.error-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}
	
	.error-content h2 {
		margin: 0 0 1rem 0;
		color: #dc3545;
	}
	
	.error-message {
		color: #6c757d;
		margin: 0 0 2rem 0;
		line-height: 1.5;
	}
	
	.error-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}
	
	.retry-button, .home-link {
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		text-decoration: none;
		font-weight: 500;
		transition: all 0.2s;
		border: none;
		cursor: pointer;
	}
	
	.retry-button {
		background: #007bff;
		color: white;
	}
	
	.retry-button:hover {
		background: #0056b3;
	}
	
	.home-link {
		background: #6c757d;
		color: white;
	}
	
	.home-link:hover {
		background: #545b62;
		text-decoration: none;
	}
</style>
