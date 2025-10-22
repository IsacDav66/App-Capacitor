// /js/modules/components/comment.js

import { getFullImageUrl, formatTimeAgo } from '../utils.js';
import { getCurrentUserId } from '../state.js';

export function renderComment(comment) {
    const currentUserId = getCurrentUserId();
    const profilePicUrl = getFullImageUrl(comment.profile_pic_url);
    const time = formatTimeAgo(comment.created_at);
    
    const deleteButtonHTML = (comment.user_id === currentUserId)
        ? `<button onclick="window.deleteComment(${comment.comment_id})" class="text-red-500 hover:text-red-700 text-xs flex-shrink-0" style="padding: 0 5px;">Eliminar</button>`
        : '';
    
    const replyButtonHTML = `<button onclick="window.startReply(${comment.comment_id}, '${comment.username || 'Usuario'}')" class="text-gray-400 hover:text-white text-xs flex-shrink-0" style="padding: 0 5px;">Responder</button>`;
    
    let repliesHTML = '';
    if (comment.children && comment.children.length > 0) {
        repliesHTML = `<div class="replies-container">${comment.children.map(renderComment).join('')}</div>`;
    }

    return `
        <div class="comment-thread">
            <div class="comment-item">
                <div class="flex-shrink-0"><a href="user_profile.html?id=${comment.user_id}"><img src="${profilePicUrl}" alt="Avatar" class="comment-avatar" onerror="this.onerror=null; this.src='./assets/img/default-avatar.png';"/></a></div>
                <div class="flex flex-col flex-grow min-w-0">
                    <div class="flex justify-between items-center w-full"> 
                        <p class="font-bold text-sm truncate"><a href="user_profile.html?id=${comment.user_id}" class="hover:underline">${comment.username || 'Usuario'}</a><span class="text-xs text-gray-400 font-normal ml-2">${time}</span></p>
                        <div class="flex items-center flex-shrink-0 space-x-1 ml-2">${replyButtonHTML}${deleteButtonHTML}</div>
                    </div>
                    <p class="text-sm mt-1 break-words">${comment.content}</p>
                </div>
            </div>
            ${repliesHTML}
        </div>`;
}

export function renderCommentTree(comments, containerElement) {
    if (!containerElement) return;

    const commentsMap = {};
    const topLevelComments = [];
    comments.forEach(comment => {
        comment.children = [];
        commentsMap[comment.comment_id] = comment;
    });
    comments.forEach(comment => {
        if (comment.parent_comment_id && commentsMap[comment.parent_comment_id]) {
            commentsMap[comment.parent_comment_id].children.push(comment);
        } else {
            topLevelComments.push(comment);
        }
    });

    const commentsHTML = topLevelComments.map(renderComment).join('');
    containerElement.innerHTML = commentsHTML || '<p class="text-center text-gray-500 pt-8">Sé el primero en comentar.</p>';
}