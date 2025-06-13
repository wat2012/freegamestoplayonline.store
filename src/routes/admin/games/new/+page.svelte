<script>
	import { onMount, onDestroy } from 'svelte';
	import { supabase } from '$lib/supabaseClient.js';
	import { goto } from '$app/navigation';
	import { 
		currentLanguage, 
		t, 
		getCategoryName, 
		categoryTranslations,
		initLanguage
	} from '$lib/utils/language.js';
	import ImageUpload from '$lib/components/ImageUpload.svelte';

	let loading = false;
	let lang = 'en';

	// Form data
	let gameData = {
		title: '',
		title_en: '',
		description: '',
		description_en: '',
		instructions: '',
		instructions_en: '',
		iframe_url: '',
		preview_image: '',
		preview_image_thumb: '',
		category: 'casual',
		published: false,
		popularity_score: 9
	};

	const STORAGE_KEY = 'vipgame_new_game_draft';
	let saveInterval;
	let hasUnsavedChanges = false;

	currentLanguage.subscribe(value => {
		lang = value;
	});

	onMount(async () => {
		initLanguage();
		restoreDraft();
		startAutoSave();
		window.addEventListener('beforeunload', handleBeforeUnload);
	});

	onDestroy(() => {
		if (saveInterval) {
			clearInterval(saveInterval);
		}
		window.removeEventListener('beforeunload', handleBeforeUnload);
	});

	function startAutoSave() {
		// 每30秒自动保存一次
		saveInterval = setInterval(() => {
			if (hasUnsavedChanges) {
				saveDraft();
			}
		}, 30000);
	}

	function saveDraft() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({
				...gameData,
				savedAt: new Date().toISOString()
			}));
			console.log('Draft saved automatically');
		} catch (error) {
			console.error('Failed to save draft:', error);
		}
	}

	function restoreDraft() {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const draftData = JSON.parse(saved);
				// 检查草稿是否是最近保存的（24小时内）
				const savedTime = new Date(draftData.savedAt);
				const now = new Date();
				const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
				
				if (hoursDiff < 24) {
					// 删除时间戳字段
					delete draftData.savedAt;
					gameData = { ...gameData, ...draftData };
					hasUnsavedChanges = true;
					
					// 显示恢复提示
					if (confirm('发现未保存的草稿，是否恢复？\nFound unsaved draft, restore it?')) {
						// 用户选择恢复，数据已经加载
						console.log('Draft restored');
					} else {
						// 用户选择不恢复，清除草稿
						clearDraft();
						// 重置为默认数据
						gameData = {
							title: '',
							title_en: '',
							description: '',
							description_en: '',
							instructions: '',
							instructions_en: '',
							iframe_url: '',
							preview_image: '',
							preview_image_thumb: '',
							category: 'casual',
							published: false,
							popularity_score: 9  // 重置时也要设置默认值
						};
						hasUnsavedChanges = false;
					}
				} else {
					// 草稿太旧，清除
					clearDraft();
				}
			}
		} catch (error) {
			console.error('Failed to restore draft:', error);
			clearDraft();
		}
	}

	function clearDraft() {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch (error) {
			console.error('Failed to clear draft:', error);
		}
	}

	function handleBeforeUnload(event) {
		if (hasUnsavedChanges) {
			event.preventDefault();
			event.returnValue = ''; // 显示浏览器默认的离开提示
		}
	}

	// 监听表单数据变化
	$: {
		// 检查是否有任何非默认值
		const hasContent = gameData.title_en.trim() || 
						  gameData.title.trim() || 
						  gameData.description.trim() || 
						  gameData.description_en.trim() || 
						  gameData.instructions.trim() || 
						  gameData.instructions_en.trim() || 
						  gameData.iframe_url.trim() || 
						  gameData.preview_image.trim();
		
		if (hasContent) {
			hasUnsavedChanges = true;
			// 实时保存（防抖）
			debounce(saveDraft, 2000)();
		}
	}

	// 防抖函数
	let debounceTimer;
	function debounce(func, delay) {
		return function() {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(func, delay);
		};
	}

	async function handleSubmit() {
		if (!gameData.title_en.trim()) {
			alert('Please enter game title (English)');
			return;
		}

		loading = true;

		try {
			const { data, error } = await supabase
				.from('games')
				.insert([gameData])
				.select()
				.single();

			if (error) throw error;

			// 成功提交后清除草稿
			clearDraft();
			hasUnsavedChanges = false;

			alert('游戏创建成功！');
			goto('/admin');
		} catch (error) {
			console.error('Error creating game:', error);
			alert('创建游戏失败：' + error.message);
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		if (hasUnsavedChanges) {
			if (confirm('有未保存的更改，确定要离开吗？\nYou have unsaved changes, are you sure you want to leave?')) {
				clearDraft();
				hasUnsavedChanges = false;
				goto('/admin');
			}
		} else {
			goto('/admin');
		}
	}

	function handleImageUploaded(event) {
		gameData.preview_image = event.detail.imageUrl;
		gameData.preview_image_thumb = event.detail.thumbUrl;
		hasUnsavedChanges = true;
	}

	function handleImageRemoved() {
		gameData.preview_image = '';
		gameData.preview_image_thumb = '';
		hasUnsavedChanges = true;
	}

	function handleManualSave() {
		saveDraft();
		alert('草稿已保存 / Draft saved');
	}
</script>

<svelte:head>
	<title>Add New Game - FreeWebGames Store</title>
</svelte:head>

<div class="admin-container">
	<div class="page-header">
		<h1>Add New Game</h1>
		<div class="header-actions">
			{#if hasUnsavedChanges}
				<button type="button" class="btn-save" on:click={handleManualSave}>
					💾 Save Draft
				</button>
			{/if}
			<button type="button" class="btn-secondary" on:click={handleCancel}>Cancel</button>
		</div>
	</div>

		{#if hasUnsavedChanges}
			<div class="draft-indicator">
				<span class="draft-icon">📝</span>
				<span>Draft auto-saving... 草稿自动保存中...</span>
			</div>
		{/if}

		<form on:submit|preventDefault={handleSubmit} class="game-form">
			<div class="form-section">
				<h2>Basic Information</h2>
				
				<div class="form-row">
					<div class="form-group">
						<label for="title_en">Game Title (English) *</label>
						<input
							id="title_en"
							type="text"
							bind:value={gameData.title_en}
							placeholder="Enter English game title"
							required
						/>
					</div>
					
					<div class="form-group">
						<label for="title">Game Title (Chinese)</label>
						<input
							id="title"
							type="text"
							bind:value={gameData.title}
							placeholder="输入中文游戏标题"
						/>
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="category">Game Category</label>
						<select id="category" bind:value={gameData.category}>
							{#each Object.keys(categoryTranslations) as categoryId}
								<option value={categoryId}>
									{getCategoryName(categoryId, 'en')} / {getCategoryName(categoryId, 'zh')}
								</option>
							{/each}
						</select>
					</div>
					
					<div class="form-group">
						<label for="iframe_url">Game URL</label>
						<input
							id="iframe_url"
							type="url"
							bind:value={gameData.iframe_url}
							placeholder="https://example.com/game"
						/>
					</div>
				</div>
			</div>

			<div class="form-section">
				<h2>Preview Image</h2>
				<ImageUpload
					currentImageUrl={gameData.preview_image}
					on:imageUploaded={handleImageUploaded}
					on:imageRemoved={handleImageRemoved}
					disabled={loading}
				/>
			</div>

			<div class="form-section">
				<h2>Game Description</h2>
				
				<div class="form-group">
					<label for="description_en">Game Description (English)</label>
					<textarea
						id="description_en"
						bind:value={gameData.description_en}
						placeholder="Enter English game description"
						rows="4"
					></textarea>
				</div>
				
				<div class="form-group">
					<label for="description">Game Description (Chinese)</label>
					<textarea
						id="description"
						bind:value={gameData.description}
						placeholder="输入中文游戏简介"
						rows="4"
					></textarea>
				</div>
			</div>

			<div class="form-section">
				<h2>Game Instructions</h2>
				
				<div class="form-group">
					<label for="instructions_en">Instructions (English)</label>
					<textarea
						id="instructions_en"
						bind:value={gameData.instructions_en}
						placeholder="Enter English game instructions"
						rows="3"
					></textarea>
				</div>
				
				<div class="form-group">
					<label for="instructions">Instructions (Chinese)</label>
					<textarea
						id="instructions"
						bind:value={gameData.instructions}
						placeholder="输入中文操作说明"
						rows="3"
					></textarea>
				</div>
			</div>

			<div class="form-section">
				<h2>Publish Settings</h2>
				
				<div class="form-row">
					<div class="form-group">
						<label class="checkbox-label">
							<input
								type="checkbox"
								bind:checked={gameData.published}
							/>
							Publish game immediately
						</label>
					</div>

					<div class="form-group">
						<label for="popularity_score">Initial Popularity Score</label>
						<input
							id="popularity_score"
							type="number"
							bind:value={gameData.popularity_score}
							placeholder="Enter initial popularity score"
							min="0"
							step="1"
						/>
						<small class="form-help">Set the initial view count for this game (default: 9)</small>
					</div>
				</div>
			</div>

			<div class="form-actions">
				<button type="button" class="btn-secondary" on:click={handleCancel}>Cancel</button>
				<button type="submit" class="btn-primary" disabled={loading}>
					{loading ? 'Creating...' : 'Create Game'}
				</button>
			</div>
		</form>
	</div>

<style>
	.admin-container {
		max-width: 800px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0;
		color: #495057;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
	}

	.game-form {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.form-section {
		margin-bottom: 2rem;
	}

	.form-section h2 {
		margin: 0 0 1rem 0;
		color: #495057;
		font-size: 1.25rem;
		border-bottom: 2px solid #e9ecef;
		padding-bottom: 0.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		color: #495057;
		font-weight: 500;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #dee2e6;
		border-radius: 4px;
		font-size: 1rem;
		box-sizing: border-box;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #007bff;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.checkbox-label input[type="checkbox"] {
		width: auto;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #dee2e6;
	}

	.btn-primary {
		background: #007bff;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	.btn-primary:hover:not(:disabled) {
		background: #0056b3;
	}

	.btn-primary:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: #6c757d;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	.btn-secondary:hover {
		background: #545b62;
	}

	.btn-save {
		background: #28a745;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		margin-right: 0.5rem;
	}

	.btn-save:hover {
		background: #218838;
	}

	.draft-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: #fff3cd;
		border: 1px solid #ffeaa7;
		border-radius: 4px;
		margin-bottom: 1rem;
		font-size: 0.875rem;
		color: #856404;
	}

	.draft-icon {
		font-size: 1rem;
	}

	.form-help {
		display: block;
		margin-top: 0.25rem;
		color: #6c757d;
		font-size: 0.875rem;
	}

	@media (max-width: 768px) {
		.form-row {
			grid-template-columns: 1fr;
		}

		.page-header {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		.form-actions {
			flex-direction: column;
		}
	}
</style>
