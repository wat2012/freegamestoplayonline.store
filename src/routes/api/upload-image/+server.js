import { json } from '@sveltejs/kit';
import { IMGBB_API_KEY } from '$env/static/private';

export async function POST({ request }) {
	try {
		const formData = await request.formData();
		const imageFile = formData.get('image');
		
		if (!imageFile) {
			return json({ 
				success: false, 
				message: '没有选择图片文件' 
			}, { status: 400 });
		}

		if (!IMGBB_API_KEY) {
			return json({ 
				success: false, 
				message: '图片上传服务未配置' 
			}, { status: 500 });
		}

		// 检查文件大小 (ImgBB限制32MB，我们设为5MB)
		if (imageFile.size > 5 * 1024 * 1024) {
			return json({ 
				success: false, 
				message: '图片大小不能超过5MB' 
			}, { status: 400 });
		}

		// 检查文件类型
		if (!imageFile.type.startsWith('image/')) {
			return json({ 
				success: false, 
				message: '请选择图片文件' 
			}, { status: 400 });
		}

		// 上传到imgbb.io
		const imgbbFormData = new FormData();
		imgbbFormData.append('source', imageFile);
		imgbbFormData.append('name', `game-${Date.now()}`);

		const response = await fetch('https://www.imgbb.io/api/1/upload', {
			method: 'POST',
			headers: {
				'X-API-Key': IMGBB_API_KEY
			},
			body: imgbbFormData
		});

		const result = await response.json();

		// Log the response for debugging
		console.log('ImgBB API Response:', JSON.stringify(result, null, 2));

		if (!response.ok || result.status_code !== 200) {
			return json({ 
				success: false, 
				message: '图片上传失败：' + (result.error?.message || result.status_txt || '未知错误')
			}, { status: 500 });
		}

		// Handle imgbb.io response structure
		let imageUrl, displayUrl, thumbUrl;
		
		if (result.image) {
			// imgbb.io response structure
			imageUrl = result.image.url;
			displayUrl = result.image.display_url || result.image.url;
			thumbUrl = result.image.thumb?.url || result.image.medium?.url || result.image.url;
		} else {
			// Fallback - log the structure and return error
			console.error('Unexpected response structure:', result);
			return json({ 
				success: false, 
				message: '图片上传成功但响应格式异常'
			}, { status: 500 });
		}

		return json({
			success: true,
			data: {
				imageUrl,
				displayUrl,
				thumbUrl
			}
		});

	} catch (error) {
		console.error('Image upload error:', error);
		return json({ 
			success: false, 
			message: '图片上传过程中发生错误' 
		}, { status: 500 });
	}
}
