<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
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
	let saving = false;
	let lang = 'zh';
	let gameId = null;
	let originalGameData = null; // 保存原始数据用于比较

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
		popularity_score: 0  // 添加流行度字段
	};

	let saveInterval;
	let hasUnsavedChanges = false;

	// 订阅语言变化
	currentLanguage.subscribe(value => {
		lang = value;
	});

	$: gameId = $page.params.id;
	$: STORAGE_KEY = `vipgame_edit_game_${gameId}_draft`;

	onMount(async () => {
		initLanguage();
		
		// 加载游戏数据
		await loadGame();

		// 设置自动保存
		startAutoSave();
		
		// 页面关闭前提醒
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
			console.log('Edit draft saved automatically');
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
					
					// 显示恢复提示
					if (confirm('发现未保存的编辑草稿，是否恢复？\nFound unsaved edit draft, restore it?')) {
						gameData = { ...gameData, ...draftData };
						hasUnsavedChanges = true;
						console.log('Edit draft restored');
					} else {
						// 用户选择不恢复，清除草稿
						clearDraft();
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

	function checkForChanges() {
		if (!originalGameData) return false;
		
		// 比较当前数据和原始数据 - 添加popularity_score字段
		const fields = ['title', 'title_en', 'description', 'description_en', 'instructions', 'instructions_en', 'iframe_url', 'preview_image', 'preview_image_thumb', 'category', 'published', 'popularity_score'];
		
		return fields.some(field => gameData[field] !== originalGameData[field]);
	}

	// 监听表单数据变化
	$: {
		hasUnsavedChanges = checkForChanges();
		
		if (hasUnsavedChanges) {
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

	async function loadGame() {
		if (!gameId) return;

		loading = true;

		try {
			const { data, error } = await supabase
				.from('games')
				.select('*')
				.eq('id', gameId)
				.single();

			if (error) throw error;

			if (data) {
				gameData = {
					title: data.title || '',
					title_en: data.title_en || '',
					description: data.description || '',
					description_en: data.description_en || '',
					instructions: data.instructions || '',
					instructions_en: data.instructions_en || '',
					iframe_url: data.iframe_url || '',
					preview_image: data.preview_image || '',
					preview_image_thumb: data.preview_image_thumb || '',
					category: data.category || 'casual',
					published: data.published || false,
					popularity_score: data.popularity_score || 0  // 加载流行度数据
				};
				
				// 保存原始数据
				originalGameData = { ...gameData };
				
				// 检查是否有草稿需要恢复
				restoreDraft();
			} else {
				alert('游戏不存在');
				goto('/admin');
			}
		} catch (error) {
			console.error('Error loading game:', error);
			alert('加载游戏失败：' + error.message);
			goto('/admin');
		} finally {
			loading = false;
		}
	}

	async function handleSubmit() {
		if (!gameData.title.trim()) {
			alert('请输入游戏标题');
			return;
		}

		saving = true;

		try {
			const { error } = await supabase
				.from('games')
				.update(gameData)
				.eq('id', gameId);

			if (error) throw error;

			// 成功提交后清除草稿
			clearDraft();
			hasUnsavedChanges = false;
			originalGameData = { ...gameData };

			alert('游戏更新成功！');
			goto('/admin');
		} catch (error) {
			console.error('Error updating game:', error);
			alert('更新游戏失败：' + error.message);
		} finally {
			saving = false;
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

	async function handleDelete() {
		if (!confirm('确定要删除这个游戏吗？此操作无法撤销。')) {
			return;
		}

		try {
			const { error } = await supabase
				.from('games')
				.delete()
				.eq('id', gameId);

			if (error) throw error;

			// 删除成功后清除草稿
			clearDraft();
			hasUnsavedChanges = false;

			alert('游戏删除成功');
			goto('/admin');
		} catch (error) {
			console.error('Error deleting game:', error);
			alert('删除游戏失败：' + error.message);
		}
	}

	function handleImageUploaded(event) {
		gameData.preview_image = event.detail.imageUrl;
		gameData.preview_image_thumb = event.detail.thumbUrl;
	}

	function handleImageRemoved() {
		gameData.preview_image = '';
		gameData.preview_image_thumb = '';
	}

	function handleManualSave() {
		saveDraft();
		alert('草稿已保存 / Draft saved');
	}

	async function handleLogout() {
		if (hasUnsavedChanges) {
			if (confirm('有未保存的更改，确定要退出登录吗？\nYou have unsaved changes, are you sure you want to logout?')) {
				clearDraft();
				hasUnsavedChanges = false;
				try {
					const { error } = await supabase.auth.signOut();
					if (error) throw error;
					goto('/login');
				} catch (error) {
					console.error('Error signing out:', error);
					alert('退出登录失败 / Logout failed');
				}
			}
		} else {
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
	}
</script>

<svelte:head>
	<title>Edit Game - FreeWebGames Store</title>
</svelte:head>

{#if loading}
	<div class="loading-container">
		<div class="loading-spinner"></div>
		<p>加载中...</p>
	</div>
{:else}
	<div class="admin-container">
		<div class="page-header">
			<h1>编辑游戏</h1>
			<div class="header-actions">
				{#if hasUnsavedChanges}
					<button type="button" class="btn-save" on:click={handleManualSave}>
						💾 保存草稿
					</button>
				{/if}
				<button type="button" class="btn-danger" on:click={handleDelete}>删除游戏</button>
				<button type="button" class="btn-secondary" on:click={handleCancel}>取消</button>
			</div>
		</div>

		{#if hasUnsavedChanges}
			<div class="draft-indicator">
				<span class="draft-icon">📝</span>
				<span>有未保存的更改 - 草稿自动保存中... / Unsaved changes - Auto-saving draft...</span>
			</div>
		{/if}

		<form on:submit|preventDefault={handleSubmit} class="game-form">
			<div class="form-section">
				<h2>基本信息</h2>
				
				<div class="form-row">
					<div class="form-group">
						<label for="title">游戏标题 (中文) *</label>
						<input
							id="title"
							type="text"
							bind:value={gameData.title}
							placeholder="输入中文游戏标题"
							required
						/>
					</div>
					
					<div class="form-group">
						<label for="title_en">游戏标题 (英文)</label>
						<input
							id="title_en"
							type="text"
							bind:value={gameData.title_en}
							placeholder="Enter English game title"
						/>
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="category">游戏分类</label>
						<select id="category" bind:value={gameData.category}>
							{#each Object.keys(categoryTranslations) as categoryId}
								<option value={categoryId}>
									{getCategoryName(categoryId, 'zh')} / {getCategoryName(categoryId, 'en')}
								</option>
							{/each}
						</select>
					</div>
					
					<div class="form-group">
						<label for="iframe_url">游戏链接</label>
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
				<h2>预览图片</h2>
				<ImageUpload
					currentImageUrl={gameData.preview_image}
					on:imageUploaded={handleImageUploaded}
					on:imageRemoved={handleImageRemoved}
					disabled={saving}
				/>
			</div>

			<div class="form-section">
				<h2>游戏描述</h2>
				
				<div class="form-group">
					<label for="description">游戏简介 (中文)</label>
					<textarea
						id="description"
						bind:value={gameData.description}
						placeholder="输入中文游戏简介"
						rows="4"
					></textarea>
				</div>
				
				<div class="form-group">
					<label for="description_en">游戏简介 (英文)</label>
					<textarea
						id="description_en"
						bind:value={gameData.description_en}
						placeholder="Enter English game description"
						rows="4"
					></textarea>
				</div>
			</div>

			<div class="form-section">
				<h2>游戏说明</h2>
				
				<div class="form-group">
					<label for="instructions">操作说明 (中文)</label>
					<textarea
						id="instructions"
						bind:value={gameData.instructions}
						placeholder="输入中文操作说明"
						rows="3"
					></textarea>
				</div>
				
				<div class="form-group">
					<label for="instructions_en">操作说明 (英文)</label>
					<textarea
						id="instructions_en"
						bind:value={gameData.instructions_en}
						placeholder="Enter English game instructions"
						rows="3"
					></textarea>
				</div>
			</div>

			<div class="form-section">
				<h2>发布设置</h2>
				
				<div class="form-row">
					<div class="form-group">
						<label class="checkbox-label">
							<input
								type="checkbox"
								bind:checked={gameData.published}
							/>
							发布游戏
						</label>
					</div>
					
					<div class="form-group">
						<label for="popularity_score">流行度分数</label>
						<input
							id="popularity_score"
							type="number"
							bind:value={gameData.popularity_score}
							placeholder="输入流行度分数"
							min="0"
							step="1"
						/>
						<small class="form-help">设置游戏的浏览次数，可以手动调整以影响游戏排序</small>
					</div>
				</div>
			</div>

			<div class="form-actions">
				<button type="button" class="btn-secondary" on:click={handleCancel}>取消</button>
				<button type="submit" class="btn-primary" disabled={saving}>
					{saving ? '保存中...' : '保存更改'}
				</button>
			</div>
		</form>
	</div>
{/if}

<style>
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		gap: 1rem;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #007bff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

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

	.btn-danger {
		background: #dc3545;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	.btn-danger:hover {
		background: #c82333;
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

	.form-help {
		display: block;
		margin-top: 0.25rem;
		color: #6c757d;
		font-size: 0.875rem;
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

		.header-actions {
			flex-wrap: wrap;
		}
	}
</style>
