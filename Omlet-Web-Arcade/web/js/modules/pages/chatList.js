import { apiFetch } from '../api.js';
import { getFullImageUrl, formatTimeAgo, getFormattedSnippet } from '../utils.js';
import { getCurrentUserId } from '../state.js';
import { getSocket } from '../socket.js'; // Importar Socket

export async function initChatListPage() {
    const container = document.getElementById('chat-list-container');
    const socket = await getSocket();

    // 1. CARGA INICIAL
    async function loadConversations() {
        const data = await apiFetch('/api/chat/conversations');
        if (data.success) {
            renderList(data.conversations);
        }
    }

    function renderList(conversations) {
        container.innerHTML = conversations.map(convo => renderItem(convo)).join('');
    }

    function renderItem(convo) {
        const loggedInUserId = getCurrentUserId();
        const isLastFromMe = convo.last_message_sender_id === loggedInUserId;
        
        // Obtenemos el conteo del objeto convo
        const count = convo.unread_count || 0;
        const isUnread = count > 0;

        return `
            <a href="chat.html?userId=${convo.user_id}" 
            class="chat-list-item ${isUnread ? 'unread' : ''}" 
            id="convo-${convo.user_id}">
                <img src="${getFullImageUrl(convo.profile_pic_url)}" class="chat-list-avatar">
                <div class="chat-list-content">
                    <div class="chat-list-header">
                        <span class="chat-list-username">${convo.username}</span>
                        <span class="chat-list-time">${formatTimeAgo(convo.last_message_at)}</span>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; overflow: visible; padding-right: 15px;">
                        <p class="chat-list-snippet" style="display: flex; align-items: center; gap: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-grow: 1; margin-right: 10px;">
                            ${isLastFromMe ? '<span style="flex-shrink: 0; opacity: 0.7;">Tú:</span>' : ''}
                            ${getFormattedSnippet(convo.last_message_content)}
                        </p>

                        <!-- MOSTRAR EL NÚMERO SI ES MAYOR A 0 -->
                        ${isUnread ? `<div class="unread-dot">${count > 99 ? '99+' : count}</div>` : ''}
                    </div>
                </div>
            </a>`;
    }

    // 2. ESCUCHAR MENSAJES EN TIEMPO REAL
    if (socket) {
        socket.on('receive_message', (msg) => {
            // Buscamos si la conversación ya existe en la lista
            const existingItem = document.getElementById(`convo-${msg.sender_id}`);
            
            if (existingItem) {
                // Si existe, la movemos arriba y actualizamos el snippet
                existingItem.classList.add('unread', 'just-arrived');
                const snippet = existingItem.querySelector('.chat-list-snippet');
                snippet.innerHTML = getFormattedSnippet(msg.content);
                
                // Mover al principio del contenedor
                container.prepend(existingItem);
            } else {
                // Si es un chat nuevo, recargamos la lista completa
                loadConversations();
            }
        });
    }

    loadConversations();
}