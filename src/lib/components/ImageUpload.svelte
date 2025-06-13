<script>
	import { createEventDispatcher } from 'svelte';
	
	export let currentImageUrl = '';
	export let disabled = false;
	
	const dispatch = createEventDispatcher();
	
	let uploading = false;
	let dragActive = false;
	let uploadProgress = '';
	let fileInputId = `file-input-${Math.random().toString(36).substr(2, 9)}`;
	
	async function handleFileSelect(event) {
		const file = event.target.files?.[0];
		if (file) {
			await uploadImage(file);
		}
		// 清空input，允许重新选择同一文件
		event.target.value = '';
	}
	
	async function handleDrop(event) {
		event.preventDefault();
		dragActive = false;
		
		const file = event.dataTransfer.files?.[0];
		if (file && file.type.startsWith('image/')) {
			await uploadImage(file);
		}
	}
	
	async function uploadImage(file) {
		if (!file) return;
		
		// 检查文件大小 (5MB限制)
		if (file.size > 5 * 1024 * 1024) {
			alert('图片大小不能超过5MB');
			return;
		}
		
		// 检查文件类型
		if (!file.type.startsWith('image/')) {
			alert('请选择图片文件');
			return;
		}
		
		uploading = true;
		uploadProgress = '准备上传...';
		
		try {
			// 创建FormData
			const formData = new FormData();
			formData.append('image', file);
			
			uploadProgress = '正在上传...';
			
			// 上传到我们的API端点
			const response = await fetch('/api/upload-image', {
				method: 'POST',
				body: formData
			});
			
			const result = await response.json();
			
			if (!result.success) {
				throw new Error(result.message || '上传失败');
			}
			
			uploadProgress = '上传完成';
			
			// 通知父组件图片URL
			dispatch('imageUploaded', { 
				imageUrl: result.data.imageUrl,
				thumbUrl: result.data.thumbUrl
			});
			
		} catch (error) {
			console.error('Error uploading image:', error);
			alert('图片上传失败：' + error.message);
		} finally {
			uploading = false;
			uploadProgress = '';
		}
	}
	
	function removeImage() {
		if (confirm('确定要删除预览图吗？')) {
			dispatch('imageRemoved');
		}
	}
	
	function handleDragOver(event) {
		event.preventDefault();
		dragActive = true;
	}
	
	function handleDragLeave() {
		dragActive = false;
	}
</script>

<div class="image-upload-container">
	<label for={fileInputId} class="upload-label">预览图片</label>
	
	{#if currentImageUrl}
		<div class="current-image">
			<img src={currentImageUrl} alt="Game preview" />
			<div class="image-actions">
				<button type="button" class="btn-danger" on:click={removeImage} {disabled}>
					删除图片
				</button>
			</div>
		</div>
	{/if}
	
	<div 
		class="upload-area"
		class:drag-active={dragActive}
		class:has-image={currentImageUrl}
		on:dragover={handleDragOver}
		on:dragleave={handleDragLeave}
		on:drop={handleDrop}
		role="button"
		tabindex="0"
	>
		{#if uploading}
			<div class="uploading">
				<div class="loading-spinner"></div>
				<p>{uploadProgress}</p>
			</div>
		{:else}
			<div class="upload-content">
				<div class="upload-icon">📷</div>
				<p>拖拽图片到这里或点击选择文件</p>
				<p class="upload-hint">支持 JPG、PNG、GIF 格式，最大5MB</p>
				<p class="upload-service">使用 ImgBB 图片托管服务</p>
				<input
					id={fileInputId}
					type="file"
					accept="image/*"
					on:change={handleFileSelect}
					{disabled}
					class="file-input"
				/>
			</div>
		{/if}
	</div>
</div>

<style>
	.image-upload-container {
		margin-bottom: 1rem;
	}
	
	.upload-label {
		display: block;
		margin-bottom: 0.5rem;
		color: #495057;
		font-weight: 500;
		cursor: pointer;
	}
	
	.current-image {
		margin-bottom: 1rem;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		overflow: hidden;
		background: white;
	}
	
	.current-image img {
		width: 100%;
		max-height: 200px;
		object-fit: cover;
		display: block;
	}
	
	.image-actions {
		padding: 0.5rem;
		text-align: center;
		background: #f8f9fa;
	}
	
	.upload-area {
		border: 2px dashed #dee2e6;
		border-radius: 8px;
		padding: 2rem;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
		background: #f8f9fa;
	}
	
	.upload-area:hover {
		border-color: #007bff;
		background: #f0f8ff;
	}
	
	.upload-area.drag-active {
		border-color: #007bff;
		background: #e3f2fd;
		transform: scale(1.02);
	}
	
	.upload-area.has-image {
		padding: 1rem;
	}
	
	.upload-content {
		position: relative;
	}
	
	.upload-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}
	
	.upload-content p {
		margin: 0.5rem 0;
		color: #6c757d;
	}
	
	.upload-hint {
		font-size: 0.875rem;
		color: #868e96;
	}
	
	.upload-service {
		font-size: 0.75rem;
		color: #28a745;
		font-weight: 500;
	}
	
	.file-input {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
	}
	
	.uploading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}
	
	.loading-spinner {
		width: 30px;
		height: 30px;
		border: 3px solid #f3f3f3;
		border-top: 3px solid #007bff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	.btn-danger {
		background: #dc3545;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
	}
	
	.btn-danger:hover:not(:disabled) {
		background: #c82333;
	}
	
	.btn-danger:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}
</style>
