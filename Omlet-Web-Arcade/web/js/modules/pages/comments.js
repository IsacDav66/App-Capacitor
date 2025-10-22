// /js/modules/pages/comments.js

import { apiFetch } from '../api.js';
import { createPostHTML } from '../components/postCard.js';
import { renderCommentTree } from '../components/comment.js';
import { Toast } from '../ui/nativeBridge.js';

export async function initCommentsPage() {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('postId');
    
    if (!postId) {
        alert('Error: No se encontró el ID de la publicación.');
        window.location.href = 'home.html';
        return;
    }

    const commentsFeed = document.getElementById('comments-list-container');
    const commentInput = document.getElementById('comment-content');
    const sendBtn = document.getElementById('send-comment-btn');
    const backBtn = document.getElementById('back-to-home-btn');
    const output = document.getElementById('comment-output');
    const originalPostContainer = document.getElementById('original-post-container');
    const replyStatusDiv = document.getElementById('reply-to-status');
    const replyUsernameSpan = document.getElementById('reply-to-username');
    const cancelReplyBtn = document.getElementById('cancel-reply-btn');
    const charCounter = document.getElementById('char-counter');
    const MAX_CHARS = 500;

    let parentCommentId = null;

    async function loadComments() {
        try {
            const data = await apiFetch(`/api/posts/${postId}/comments`);
            if (data.success) {
                renderCommentTree(data.comments, commentsFeed);
            }
        } catch (error) {
            output.textContent = `❌ Error: ${error.message}`;
        }
    }

    async function loadOriginalPost() {
        try {
            const data = await apiFetch(`/api/posts/${postId}`);
            if (data.success) {
                originalPostContainer.innerHTML = createPostHTML(data.post);
            }
        } catch (error) {
            originalPostContainer.innerHTML = `<p class="text-center text-red-500">❌ Error: ${error.message}</p>`;
        }
    }

    function startReplyMode(commentId, username) {
        parentCommentId = commentId;
        replyUsernameSpan.textContent = username;
        replyStatusDiv.style.display = 'block';
        commentInput.placeholder = `Respondiendo a ${username}...`;
        commentInput.focus();
    }
    
    function cancelReplyMode() {
        parentCommentId = null;
        replyStatusDiv.style.display = 'none';
        commentInput.placeholder = 'Escribe un comentario...';
    }
    
    // Asignar a window para onclick
    window.startReply = startReplyMode;
    window.deleteComment = async (commentId) => {
        if (!confirm('¿Seguro que quieres eliminar este comentario?')) return;
        try {
            await apiFetch(`/api/posts/comment/${commentId}`, { method: 'DELETE' });
            if(Toast) Toast.show({text: 'Comentario eliminado.'});
            await loadComments();
        } catch (error) {
            alert(`❌ Error: ${error.message}`);
        }
    };
    window.deletePost = async (postId) => {
        if (!confirm('¿Seguro que quieres eliminar esta publicación?')) return;
        try {
            await apiFetch(`/api/posts/${postId}`, { method: 'DELETE' });
            alert('Publicación eliminada. Serás redirigido a la página de inicio.');
            window.location.href = 'home.html';
        } catch (error) {
            alert(`Error al eliminar: ${error.message}`);
        }
    };


    // Event Listeners
    backBtn.addEventListener('click', () => window.history.back());
    cancelReplyBtn.addEventListener('click', cancelReplyMode);
    commentInput.addEventListener('input', () => {
        const remaining = MAX_CHARS - commentInput.value.length;
        charCounter.textContent = remaining;
    });

    sendBtn.addEventListener('click', async () => {
        const content = commentInput.value.trim();
        if (!content) return;
        
        sendBtn.disabled = true;
        try {
            const bodyData = { content, parent_comment_id: parentCommentId };
            await apiFetch(`/api/posts/${postId}/comment`, {
                method: 'POST',
                body: JSON.stringify(bodyData)
            });
            commentInput.value = '';
            charCounter.textContent = MAX_CHARS;
            cancelReplyMode();
            await loadComments();
        } catch (error) {
            output.textContent = `❌ ${error.message}`;
        } finally {
            sendBtn.disabled = false;
        }
    });

    // Carga inicial
    await loadOriginalPost();
    await loadComments();
}