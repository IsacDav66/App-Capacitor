// /js/modules/controllers/chatController.js

import { apiFetch, API_BASE_URL } from '../api.js';
import { getFullImageUrl, formatMessageTime, formatDateSeparator } from '../utils.js';

// --- VARIABLES GLOBALES DEL CONTROLADOR ---
let elements = {}; // Guardará las referencias a los elementos del DOM
let chatState = {}; // Guardará el estado específico de esta instancia del chat
let loggedInUserId, otherUserId; // IDs de los participantes

// ==========================================================
// === FUNCIONES DE LÓGICA Y RENDERIZADO (AHORA REUTILIZABLES)
// ==========================================================

// Todas las funciones internas ahora usarán `elements.nombreDelElemento`
// en lugar de `document.getElementById('nombre-del-elemento')`.

const appendMessage = (message) => { // <-- CAMBIO: Ya no necesita `isOwnMessage`
    const isOwnMessage = message.sender_id === loggedInUserId;
    const lastMessageEl = elements.messagesContainer.querySelector('.message-bubble:last-child');
    const messageDiv = document.createElement('div');
    messageDiv.id = `msg-${message.message_id}`;
    messageDiv.className = `message-bubble ${isOwnMessage ? 'sent' : 'received'}`;
    messageDiv.dataset.senderId = message.sender_id;
    messageDiv.dataset.timestamp = message.created_at;

    if (String(message.message_id).startsWith('temp-')) {
        messageDiv.classList.add('pending');
    }

    if (message.parent_message_id) {
        let parentUsername = message.parent_username;
        let parentContent = message.parent_content;
        if (isOwnMessage && !parentContent) {
            // <-- CAMBIO: Usa `elements.messagesContainer`
            const parentMessageEl = elements.messagesContainer.querySelector(`#msg-${message.parent_message_id}`); 
            if (parentMessageEl) {
                parentContent = parentMessageEl.querySelector('p').textContent;
                 // <-- CAMBIO: Usa `elements.userUsername`
                parentUsername = parentMessageEl.classList.contains('sent') ? 'Tú' : elements.userUsername.textContent;
            }
        }
        if (parentContent) {
            const repliedSnippetLink = document.createElement('a');
            repliedSnippetLink.className = 'replied-to-snippet';
            repliedSnippetLink.href = '#';
            repliedSnippetLink.onclick = (e) => { e.preventDefault(); scrollToMessage(`msg-${message.parent_message_id}`); };
            repliedSnippetLink.innerHTML = `<span class="replied-user">${parentUsername || 'Usuario'}</span><span class="replied-text">${parentContent}</span>`;
            messageDiv.appendChild(repliedSnippetLink);
        }
    }

    const mainContentWrapper = document.createElement('div');
    mainContentWrapper.className = 'message-main-content';
    const contentP = document.createElement('p');
    contentP.textContent = message.content;
    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'message-timestamp';
    timestampSpan.innerHTML = messageDiv.classList.contains('pending') ? '🕒' : formatMessageTime(message.created_at);
    mainContentWrapper.appendChild(contentP);
    mainContentWrapper.appendChild(timestampSpan);
    messageDiv.appendChild(mainContentWrapper);
    elements.messagesContainer.appendChild(messageDiv); // <-- CAMBIO: Usa `elements`
    
    if (lastMessageEl) {
        lastMessageEl.className = lastMessageEl.className.replace(/single|start-group|middle-group|end-group/g, '').trim() + ' ' + getGroupClassFor(lastMessageEl);
    }
    messageDiv.classList.add(getGroupClassFor(messageDiv));
    
    if (!messageDiv.classList.contains('pending')) {
        addInteractionHandlers(messageDiv);
    }
    
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight; // <-- CAMBIO: Usa `elements`
};

const removeMessageFromDOM = (messageId) => {
    // <-- CAMBIO: Busca dentro del contenedor específico
    const messageElement = elements.messagesContainer.querySelector(`#msg-${messageId}`);
    if (!messageElement) return;

            let prevMessageEl = messageElement.previousElementSibling;
            while (prevMessageEl && !prevMessageEl.classList.contains('message-bubble')) prevMessageEl = prevMessageEl.previousElementSibling;
            let nextMessageEl = messageElement.nextElementSibling;
            while (nextMessageEl && !nextMessageEl.classList.contains('message-bubble')) nextMessageEl = nextMessageEl.nextElementSibling;

            messageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease, margin 0.3s ease, height 0.3s ease, padding 0.3s ease';
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'scale(0.8)';
            messageElement.style.marginTop = `-${messageElement.offsetHeight}px`;
            messageElement.style.padding = '0';
            messageElement.style.height = '0';

            setTimeout(() => {
                messageElement.remove();
                if (prevMessageEl) prevMessageEl.className = prevMessageEl.className.replace(/single|start-group|middle-group|end-group/g, '').trim() + ' ' + getGroupClassFor(prevMessageEl);
                if (nextMessageEl) nextMessageEl.className = nextMessageEl.className.replace(/single|start-group|middle-group|end-group/g, '').trim() + ' ' + getGroupClassFor(nextMessageEl);
            }, 300);
};

const fetchChatHistory = async () => {
    try {
        const { data: user } = await apiFetch(`/api/user/profile/${otherUserId}`);
        // <-- CAMBIO: Usa `elements`
        elements.userAvatar.src = getFullImageUrl(user.profile_pic_url);
        elements.userUsername.textContent = user.username;

        const { messages } = await apiFetch(`/api/chat/history/${otherUserId}`);
        elements.messagesContainer.innerHTML = '';
        let lastDate = null;
        messages.forEach(message => {
            const messageDate = new Date(message.created_at).toDateString();
            if (messageDate !== lastDate) {
                const separator = document.createElement('div');
                separator.className = 'date-separator';
                separator.innerHTML = `<span>${formatDateSeparator(message.created_at)}</span>`;
                elements.messagesContainer.appendChild(separator);
                lastDate = messageDate;
            }
            appendMessage(message); // <-- CAMBIO: appendMessage ya sabe si es propio
        });
        setTimeout(() => {
            elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
        }, 100);
    } catch (error) {
        elements.messagesContainer.innerHTML = `<p class="search-placeholder">Error loading history: ${error.message}</p>`;
    }
};

const enterReplyMode = (messageId, username, content) => {
    chatState.currentReplyToId = messageId;
    // <-- CAMBIO: Usa `elements`
    elements.replyToUser.textContent = username;
    elements.replySnippet.textContent = content;
    elements.replyContextBar.classList.add('visible');
    elements.chatInput.focus();
};

const cancelReplyMode = () => {
    chatState.currentReplyToId = null;
    elements.replyContextBar.classList.remove('visible'); // <-- CAMBIO: Usa `elements`
};

const scrollToMessage = (messageId) => {
    // <-- CAMBIO: Busca dentro del contenedor específico
    const targetMessage = elements.messagesContainer.querySelector(`#${messageId}`);
    if (targetMessage) {
        targetMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetMessage.classList.add('highlighted');
        setTimeout(() => targetMessage.classList.remove('highlighted'), 1500);
    }
};

        const copyMessageText = (messageElement) => {
            const textToCopy = messageElement.querySelector('p').textContent;
            navigator.clipboard.writeText(textToCopy).catch(err => console.error('Error copying:', err));
        };

        const deleteMessage = async (messageId) => {
            if (!confirm('Delete this message? This cannot be undone.')) return;
            try {
                await apiFetch(`/api/chat/messages/${messageId}`, { method: 'DELETE' });
            } catch (error) {
                alert(`Error deleting: ${error.message}`);
            }
        };

const openContextMenu = (messageElement) => {
    // <-- CAMBIO: Usa `elements`
    elements.deleteBtn.style.display = messageElement.classList.contains('sent') ? 'flex' : 'none';
    elements.contextMenuOverlay.classList.add('visible');
    messageElement.classList.add('context-active');

            const menuRect = contextMenu.getBoundingClientRect();
            const bubbleRect = messageElement.getBoundingClientRect();
            const margin = 10;
            let menuTop = bubbleRect.bottom + margin;
            if (menuTop + menuRect.height > window.innerHeight) {
                menuTop = bubbleRect.top - menuRect.height - margin;
            }
            let menuLeft = bubbleRect.left + (bubbleRect.width / 2) - (menuRect.width / 2);
            if (menuLeft < margin) menuLeft = margin;
            if (menuLeft + menuRect.width > window.innerWidth - margin) menuLeft = window.innerWidth - menuRect.width - margin;

            contextMenu.style.top = `${menuTop}px`;
            contextMenu.style.left = `${menuLeft}px`;
            
            setTimeout(() => contextMenu.classList.add('visible'), 0);

            replyBtn.onclick = () => {
                const username = messageElement.classList.contains('sent') ? 'Tú' : userUsernameEl.textContent;
                const content = messageElement.querySelector('p').textContent;
                enterReplyMode(messageElement.id.replace('msg-', ''), username, content);
                closeContextMenu();
            };
            copyBtn.onclick = () => { copyMessageText(messageElement); closeContextMenu(); };
            deleteBtn.onclick = () => { deleteMessage(messageElement.id.replace('msg-', '')); closeContextMenu(); };
            contextMenuOverlay.onclick = closeContextMenu;
        };

 const closeContextMenu = () => {
            if (chatState.contextMenuTarget) {
                chatState.contextMenuTarget.classList.remove('context-active');
            }
            contextMenuOverlay.classList.remove('visible');
            contextMenu.classList.remove('visible');
            chatState.contextMenuTarget = null;
        };
const addInteractionHandlers = (messageElement) => {
            let startX = 0, deltaX = 0, longPressTimer;
            const swipeThreshold = 80;

            messageElement.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                deltaX = 0;
                messageElement.style.transition = 'transform 0.1s ease-out';
                longPressTimer = setTimeout(() => openContextMenu(messageElement), 500);
            }, { passive: true });

            messageElement.addEventListener('touchmove', (e) => {
                clearTimeout(longPressTimer);
                deltaX = e.touches[0].clientX - startX;
                if (deltaX > 0) {
                    const pullDistance = Math.min(deltaX, swipeThreshold + 40);
                    messageElement.style.transform = `translateX(${pullDistance}px)`;
                }
            }, { passive: true });

            messageElement.addEventListener('touchend', () => {
                clearTimeout(longPressTimer);
                messageElement.style.transition = 'transform 0.3s ease-out';
                if (deltaX > swipeThreshold) {
                    const username = messageElement.classList.contains('sent') ? 'Tú' : userUsernameEl.textContent;
                    const content = messageElement.querySelector('p').textContent;
                    enterReplyMode(messageElement.id.replace('msg-', ''), username, content);
                    messageElement.style.transform = `translateX(60px)`;
                    setTimeout(() => { messageElement.style.transform = 'translateX(0)'; }, 150);
                } else {
                    messageElement.style.transform = 'translateX(0)';
                }
            });
        };
        
        // ----------------------------------------------------------------
        // 4. MESSAGE GROUPING LOGIC & OTHER HELPERS
        // ----------------------------------------------------------------

const getGroupClassFor = (messageEl) => {
            const timeThreshold = 60;
            const senderId = messageEl.dataset.senderId;
            const timestamp = new Date(messageEl.dataset.timestamp);

            let prevMessageEl = messageEl.previousElementSibling;
            while (prevMessageEl && !prevMessageEl.classList.contains('message-bubble')) prevMessageEl = prevMessageEl.previousElementSibling;
            let nextMessageEl = messageEl.nextElementSibling;
            while (nextMessageEl && !nextMessageEl.classList.contains('message-bubble')) nextMessageEl = nextMessageEl.nextElementSibling;

            const isStartOfGroup = !prevMessageEl || prevMessageEl.dataset.senderId !== senderId || (timestamp - new Date(prevMessageEl.dataset.timestamp)) / 1000 > timeThreshold;
            const isEndOfGroup = !nextMessageEl || nextMessageEl.dataset.senderId !== senderId || (new Date(nextMessageEl.dataset.timestamp) - timestamp) / 1000 > timeThreshold;
            
            if (isStartOfGroup && isEndOfGroup) return 'single';
            if (isStartOfGroup) return 'start-group';
            if (isEndOfGroup) return 'end-group';
            return 'middle-group';
        };

// ==========================================================
// === FUNCIÓN DE INICIALIZACIÓN PRINCIPAL DEL CONTROLADOR
// ==========================================================
export async function initChatController(domElements, partnerId, currentUserId) {
    // 1. Guardar referencias y estado
    elements = domElements;
    otherUserId = partnerId;
    loggedInUserId = currentUserId;

    chatState = {
        currentReplyToId: null,
        contextMenuTarget: null,
        socket: null,
        roomName: null,
    };

    // 2. Conectar a Socket.IO
    try {
        const { default: io } = await import('https://cdn.socket.io/4.7.5/socket.io.esm.min.js');
        chatState.socket = io(API_BASE_URL.replace('/app', ''), { path: "/app/socket.io/" });
        chatState.roomName = [loggedInUserId, parseInt(otherUserId)].sort().join('-');
        
        chatState.socket.on('connect', () => {
            console.log('Connected to chat server:', chatState.socket.id);
            const token = localStorage.getItem('authToken');
            chatState.socket.emit('authenticate', token);
            chatState.socket.emit('join_room', chatState.roomName);
        });

        // 3. Configurar listeners de Socket.IO
        chatState.socket.on('receive_message', (message) => {
            if (message.sender_id === loggedInUserId) return;
            appendMessage(message);
        });
        chatState.socket.on('message_confirmed', ({ tempId, realMessage }) => {
            const tempEl = document.getElementById(`msg-${tempId}`);
            if (tempEl) {
                tempEl.id = `msg-${realMessage.message_id}`;
                tempEl.classList.remove('pending');
                tempEl.querySelector('.message-timestamp').textContent = formatMessageTime(realMessage.created_at);
                addInteractionHandlers(tempEl);
            }
        });
        chatState.socket.on('message_deleted', ({ messageId }) => removeMessageFromDOM(messageId));

        // 4. Configurar listeners del DOM
        elements.cancelReplyBtn.addEventListener('click', cancelReplyMode);
        elements.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const content = elements.chatInput.value.trim();
            if (content) {
                const tempId = `temp-${Date.now()}`;
                const messageData = {
                    message_id: tempId, sender_id: loggedInUserId, receiver_id: parseInt(otherUserId),
                    content: content, roomName: chatState.roomName, created_at: new Date().toISOString(),
                    parent_message_id: chatState.currentReplyToId,
                };
                chatState.socket.emit('send_message', messageData);
                appendMessage(messageData); 
                elements.chatInput.value = '';
                cancelReplyMode();
            }
        });
        // ... (Listener de scroll para el sticky header, usando `elements.messagesContainer`)
        let hideHeaderTimeout;
        chatMessagesContainer.addEventListener('scroll', () => {
            const dateSeparators = Array.from(chatMessagesContainer.querySelectorAll('.date-separator'));
            if (dateSeparators.length === 0) return;
            let activeSeparatorText = null;
            const containerTop = chatMessagesContainer.getBoundingClientRect().top;
            for (let i = dateSeparators.length - 1; i >= 0; i--) {
                if (dateSeparators[i].getBoundingClientRect().top < containerTop) {
                    activeSeparatorText = dateSeparators[i].querySelector('span').textContent;
                    break;
                }
            }
            if (activeSeparatorText) {
                stickyHeaderText.textContent = activeSeparatorText;
                stickyHeader.classList.add('visible');
            } else {
                stickyHeader.classList.remove('visible');
            }
            clearTimeout(hideHeaderTimeout);
            hideHeaderTimeout = setTimeout(() => stickyHeader.classList.remove('visible'), 1500);
        });
        // 5. Cargar datos iniciales
        await fetchChatHistory();

    } catch (error) {
        console.error("Could not load Socket.IO library for chat.", error);
    }
}