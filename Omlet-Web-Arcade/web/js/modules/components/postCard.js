// /js/modules/components/postCard.js

import { getCurrentUserId } from '../state.js';
import { getFullImageUrl, formatTimeAgo } from '../utils.js';
import { initializeVideoPlayers, setupAutoplayObserver } from '../ui/videoPlayer.js';

const HEART_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-heart"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
const SAVE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-bookmark"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;

export function createPostHTML(post) {
    const loggedInUserId = getCurrentUserId();
    const isLiked = post.is_liked_by_user === true;
    const isSaved = post.is_saved_by_user === true;
    const formattedLikes = parseInt(post.total_likes) || 0;
    const formattedComments = parseInt(post.total_comments) || 0;
    const profilePicUrl = getFullImageUrl(post.profile_pic_url);

    const avatarHTML = `<a href="user_profile.html?id=${post.user_id}"><img src="${profilePicUrl}" alt="Avatar" class="post-avatar" onerror="this.onerror=null; this.src='./assets/img/default-avatar.png';"/></a>`;

    let deleteButtonHTML = '';
    if (loggedInUserId && post.user_id === loggedInUserId) {
        deleteButtonHTML = `<button class="delete-post-btn" onclick="deletePost(${post.post_id})"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>`;
    }

    let mediaHTML = '';
    if (post.video_id) {
        mediaHTML = `<div class="mb-3 plyr__video-embed" data-plyr-provider="youtube" data-plyr-embed-id="${post.video_id}"></div>`;
    } else if (post.image_url) {
        const imageUrl = getFullImageUrl(post.image_url);
        mediaHTML = `<div class="mb-3"><img src="${imageUrl}" class="w-full h-auto object-cover rounded-lg"></div>`;
    }

    return `
        <div class="post-card" id="post-${post.post_id}">
            <div class="post-header">
                <div class="post-author-info">${avatarHTML}<div><div class="post-username"><a href="user_profile.html?id=${post.user_id}">${post.username || 'Anónimo'}</a></div><div class="post-time">${formatTimeAgo(post.created_at)}</div></div></div>
                ${deleteButtonHTML}
            </div>
            <div class="post-content">${post.content || ''}</div>
            ${mediaHTML}
            <div class="post-actions">
                <button onclick="toggleLike(${post.post_id}, this)"><span class="like-icon ${isLiked ? 'liked' : ''}">${HEART_SVG}</span><span class="like-count">${formattedLikes}</span></button>
                <a href="comments.html?postId=${post.post_id}" style="text-decoration: none;"><button class="comment-icon" style="border: none; background: none; display: flex; align-items: center; gap: 6px;"><svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.99998 0.399994H13.8C15.12 0.399994 16.2 1.47999 16.2 2.79999V11.2C16.2 12.52 15.12 13.6 13.8 13.6H11.4L4 15.5L5.39998 13.6H2.99998C1.67998 13.6 0.599976 12.52 0.599976 11.2V2.79999C0.599976 1.47999 1.67998 0.399994 2.99998 0.399994Z"/></svg><span>${formattedComments}</span></button></a>
                <button onclick="toggleSave(${post.post_id}, this)"><span class="save-icon ${isSaved ? 'saved' : ''}">${SAVE_SVG}</span></button>
                <button><img src="./assets/icons/actions/share.svg" width="18"> Compartir</button>
            </div>
        </div>`;
}

export function renderPosts(posts, containerElement) {
    if (!containerElement) return;

    if (!posts || posts.length === 0) {
        containerElement.innerHTML = '<p class="text-center text-gray-500 mt-8">No hay publicaciones para mostrar.</p>';
        return;
    }

    containerElement.innerHTML = posts.map(createPostHTML).join('');
    
    const players = initializeVideoPlayers();
    setupAutoplayObserver(players);
}