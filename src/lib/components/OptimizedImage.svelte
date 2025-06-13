<script>
	import { onMount } from 'svelte';
	
	export let src = '';
	export let alt = '';
	export let thumbSrc = ''; // 缩略图
	export let lazy = true;
	export let placeholder = '🎮';
	export let className = '';
	
	let imageEl;
	let loaded = false;
	let error = false;
	let inView = false;
	
	// 确定要显示的图片URL
	$: imageToShow = src || thumbSrc;
	$: shouldLoad = (!lazy || inView) && imageToShow;
	
	onMount(() => {
		if (!lazy) {
			inView = true;
			return;
		}
		
		// 懒加载实现
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						inView = true;
						observer.unobserve(entry.target);
					}
				});
			},
			{ rootMargin: '50px' }
		);
		
		if (imageEl) {
			observer.observe(imageEl);
		}
		
		return () => observer.disconnect();
	});
	
	function handleImageLoad() {
		loaded = true;
		error = false;
	}
	
	function handleImageError() {
		error = true;
		loaded = false;
		console.warn('Image failed to load:', imageToShow);
	}
</script>

<div 
	class="optimized-image {className}" 
	bind:this={imageEl}
	class:loaded
	class:error
>
	{#if shouldLoad}
		<img 
			src={imageToShow}
			{alt}
			class="fade-in"
			class:loaded
			on:load={handleImageLoad}
			on:error={handleImageError}
			loading={lazy ? "lazy" : "eager"}
		/>
	{/if}
	
	{#if !shouldLoad || (!loaded && !error)}
		<div class="image-placeholder">
			<div class="loading-skeleton"></div>
		</div>
	{/if}
	
	{#if error || (!imageToShow && shouldLoad)}
		<div class="error-placeholder">
			<span class="error-icon">{placeholder}</span>
			<small>No image</small>
		</div>
	{/if}
</div>

<style>
	.optimized-image {
		position: relative;
		width: 100%;
		height: 200px;
		overflow: hidden;
		background: #f8f9fa;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.image-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.loading-skeleton {
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: skeleton-loading 1.5s infinite;
	}
	
	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 0.3s ease;
	}
	
	img.fade-in.loaded {
		opacity: 1;
	}
	
	.error-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		background: #f8f9fa;
		color: #6c757d;
	}
	
	.error-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}
	
	@keyframes skeleton-loading {
		0% { background-position: -200% 0; }
		100% { background-position: 200% 0; }
	}
</style>
