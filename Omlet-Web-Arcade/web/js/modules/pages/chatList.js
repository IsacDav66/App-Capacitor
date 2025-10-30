// /js/modules/pages/chatList.js

import { apiFetch } from '../api.js';
import { getFullImageUrl, formatTimeAgo } from '../utils.js';
import { getCurrentUserId } from '../state.js';

const renderConversationItem = (convo) => {
    const loggedInUserId = getCurrentUserId();
    const lastMessage = convo.last_message_content;
    const isLastMessageFromMe = convo.last_message_sender_id === loggedInUserId;

    // Truncar mensaje largo
    const snippet = lastMessage.length > 30 ? lastMessage.substring(0, 30) + '...' : lastMessage;

    return `
        <a href="chat.html?userId=${convo.user_id}" class="chat-list-item">
            <img src="${getFullImageUrl(convo.profile_pic_url)}" class="chat-list-avatar" alt="Avatar de ${convo.username}">
            <div class="chat-list-content">
                <div class="chat-list-header">
                    <span class="chat-list-username">${convo.username}</span>
                    <span class="chat-list-time">${formatTimeAgo(convo.last_message_at)}</span>
                </div>
                <p class="chat-list-snippet">
                    ${isLastMessageFromMe ? 'Tú: ' : ''}${snippet}
                </p>
            </div>
        </a>
    `;
};

export async function initChatListPage() {
    const container = document.getElementById('chat-list-container');
    if (!container) return;

    try {
        const data = await apiFetch('/api/chat/conversations');
        if (data.success && data.conversations.length > 0) {
            container.innerHTML = data.conversations.map(renderConversationItem).join('');
        } else {
            container.innerHTML = '<p class="search-placeholder">No tienes conversaciones. ¡Inicia una!</p>';
        }
    } catch (error) {
        container.innerHTML = `<p class="search-placeholder error">Error al cargar chats: ${error.message}</p>`;
    }
}