// /js/modules/ui/postActions.js

import { apiFetch } from '../api.js';
import { Toast } from './nativeBridge.js';

/**
 * Alterna el estado de "like" de una publicación.
 * @param {number} postId - El ID de la publicación.
 * @param {HTMLElement} buttonElement - El elemento del botón que fue presionado.
 */
export async function toggleLike(postId, buttonElement) {
    const heartIcon = buttonElement.querySelector('.like-icon');
    const counterElement = buttonElement.querySelector('.like-count');
    buttonElement.disabled = true;

    try {
        const data = await apiFetch(`/api/posts/react/${postId}`, { method: 'POST' });
        const isLiked = data.action === 'liked';
        let currentCount = parseInt(counterElement.textContent) || 0;
        
        counterElement.textContent = isLiked ? currentCount + 1 : currentCount - 1;
        heartIcon.classList.toggle('liked', isLiked);
        
    } catch (error) {
        alert(`Error: ${error.message}`);
    } finally {
        buttonElement.disabled = false;
    }
}

/**
 * Alterna el estado de "guardado" de una publicación.
 * @param {number} postId - El ID de la publicación.
 * @param {HTMLElement} buttonElement - El elemento del botón que fue presionado.
 */
export async function toggleSave(postId, buttonElement) {
    const saveIcon = buttonElement.querySelector('.save-icon');
    buttonElement.disabled = true;
    try {
        const data = await apiFetch(`/api/posts/save/${postId}`, { method: 'POST' });
        saveIcon.classList.toggle('saved', data.action === 'saved');
    } catch (error) {
        alert(`Error: ${error.message}`);
    } finally {
        buttonElement.disabled = false;
    }
}

/**
 * Elimina una publicación.
 * @param {number} postId - El ID de la publicación a eliminar.
 */
export async function deletePost(postId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        await apiFetch(`/api/posts/${postId}`, { method: 'DELETE' });
        
        // Comprobar si estamos en la página de comentarios del post eliminado
        if (window.location.pathname.includes('comments.html') && new URLSearchParams(window.location.search).get('postId') == postId) {
            alert('Publicación eliminada. Serás redirigido a la página de inicio.');
            window.location.href = 'home.html';
            return;
        }

        // Si no, simplemente eliminar la tarjeta del DOM actual
        const postCard = document.getElementById(`post-${postId}`);
        if (postCard) {
            postCard.style.transition = 'opacity 0.5s ease';
            postCard.style.opacity = '0';
            setTimeout(() => postCard.remove(), 500);
        }

        if (Toast) Toast.show({ text: 'Publicación eliminada' });

    } catch (error) {
        alert(`Error al eliminar la publicación: ${error.message}`);
    }
}