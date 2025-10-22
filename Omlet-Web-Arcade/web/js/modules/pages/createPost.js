// /js/modules/pages/createPost.js

import { apiFetch } from '../api.js';

export function initCreatePostPage() {
    const publishBtn = document.getElementById('publish-btn');
    const contentInput = document.getElementById('post-content');
    const cancelBtn = document.getElementById('cancel-post-btn');
    const selectImageBtn = document.getElementById('select-image-btn');
    const selectVideoBtn = document.getElementById('select-video-btn');
    const imageInput = document.getElementById('post-image-input');
    const videoInput = document.getElementById('post-video-input');
    const previewImg = document.getElementById('post-image-preview');
    const previewVideo = document.getElementById('post-video-preview');
    const placeholder = document.getElementById('image-placeholder');
    const output = document.getElementById('post-output');

    let selectedFile = null;
    let fileType = null;

    const resetPreviews = () => {
        previewImg.style.display = 'none';
        previewVideo.style.display = 'none';
        previewImg.src = '';
        if (previewVideo.src) URL.revokeObjectURL(previewVideo.src);
        previewVideo.src = '';
        placeholder.style.display = 'block';
        selectedFile = null;
        fileType = null;
    };

    selectImageBtn.addEventListener('click', () => imageInput.click());
    selectVideoBtn.addEventListener('click', () => videoInput.click());

    imageInput.addEventListener('change', (event) => {
        resetPreviews();
        const file = event.target.files[0];
        if (file) {
            selectedFile = file;
            fileType = 'image';
            previewImg.src = URL.createObjectURL(file);
            previewImg.style.display = 'block';
            placeholder.style.display = 'none';
        }
    });

    videoInput.addEventListener('change', (event) => {
        resetPreviews();
        const file = event.target.files[0];
        if (file) {
            selectedFile = file;
            fileType = 'video';
            previewVideo.src = URL.createObjectURL(file);
            previewVideo.style.display = 'block';
            placeholder.style.display = 'none';
        }
    });
    
    cancelBtn.addEventListener('click', () => { window.location.href = 'home.html'; });

    publishBtn.addEventListener('click', async () => {
        const content = contentInput.value.trim();
        if (!content && !selectedFile) {
            output.textContent = 'La publicación no puede estar vacía.';
            return;
        }

        publishBtn.disabled = true;
        publishBtn.textContent = 'Subiendo...';
        
        const formData = new FormData();
        formData.append('content', content);
        
        let endpoint = '';
        if (selectedFile) {
            formData.append('postImage', selectedFile, selectedFile.name); 
            endpoint = fileType === 'image' ? '/api/posts/create' : '/api/posts/create-video-post';
            output.textContent = fileType === 'video' ? 'Subiendo video... Esto puede tardar.' : 'Subiendo imagen...';
        } else {
            endpoint = '/api/posts/create';
            output.textContent = 'Publicando...';
        }

        try {
            await apiFetch(endpoint, { method: 'POST', body: formData });
            output.textContent = '✅ ¡Publicado! Redirigiendo...';
            setTimeout(() => { window.location.href = 'home.html'; }, 800);
        } catch (error) {
            output.textContent = `❌ Error: ${error.message}`;
        } finally {
            publishBtn.disabled = false;
            publishBtn.textContent = 'Publicar';
        }
    });
}