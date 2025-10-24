// /js/modules/pages/chat.js (Final Corrected Version)

import { apiFetch, API_BASE_URL } from '../api.js';
import { getCurrentUserId } from '../state.js';
import { getFullImageUrl, formatMessageTime, formatDateSeparator } from '../utils.js';

/**
 * Complete module for the real-time chat page.
 */
export async function initChatPage() {
    try {
        // Dynamically import the Socket.IO library.
        // All code that depends on 'io' MUST be inside this try block.
        const { default: io } = await import('https://cdn.socket.io/4.7.5/socket.io.esm.min.js');

        // ----------------------------------------------------------------
        // 1. STATE AND INITIAL SETUP
        // ----------------------------------------------------------------
        const chatState = {
            currentReplyToId: null,
            contextMenuTarget: null,
            socket: null,
            roomName: null,
        };

        const params = new URLSearchParams(window.location.search);
        const otherUserId = params.get('userId');
        const loggedInUserId = getCurrentUserId();

        if (!otherUserId || !loggedInUserId) {
            alert("Error: Could not start chat. Invalid session.");
            window.history.back();
            return;
        }

        // --- DOM Element References ---
        const chatMessagesContainer = document.getElementById('chat-messages-container');
        const userAvatarEl = document.getElementById('chat-user-avatar');
        const userUsernameEl = document.getElementById('chat-user-username');
        const chatForm = document.getElementById('chat-form');
        const chatInput = document.getElementById('chat-message-input');
        const replyContextBar = document.getElementById('reply-context-bar');
        const cancelReplyBtn = document.getElementById('cancel-reply-btn');
        const contextMenuOverlay = document.getElementById('context-menu-overlay');
        const contextMenu = document.getElementById('context-menu');
        const stickyHeader = document.getElementById('sticky-date-header');
        const stickyHeaderText = stickyHeader.querySelector('span');

        // ----------------------------------------------------------------
        // 2. RENDERING AND DOM MANIPULATION FUNCTIONS
        // ----------------------------------------------------------------

        const appendMessage = (message, isOwnMessage = false) => {
            const lastMessageEl = chatMessagesContainer.querySelector('.message-bubble:last-child');
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
                    const parentMessageEl = document.getElementById(`msg-${message.parent_message_id}`);
                    if (parentMessageEl) {
                        parentContent = parentMessageEl.querySelector('p').textContent;
                        parentUsername = parentMessageEl.classList.contains('sent') ? 'Tú' : userUsernameEl.textContent;
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
            chatMessagesContainer.appendChild(messageDiv);
            
            if (lastMessageEl) {
                lastMessageEl.className = lastMessageEl.className.replace(/single|start-group|middle-group|end-group/g, '').trim() + ' ' + getGroupClassFor(lastMessageEl);
            }
            messageDiv.classList.add(getGroupClassFor(messageDiv));
            
            if (!messageDiv.classList.contains('pending')) {
                addInteractionHandlers(messageDiv);
            }
            
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        };

        const removeMessageFromDOM = (messageId) => {
            const messageElement = document.getElementById(`msg-${messageId}`);
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
                userAvatarEl.src = getFullImageUrl(user.profile_pic_url);
                userUsernameEl.textContent = user.username;

                const { messages } = await apiFetch(`/api/chat/history/${otherUserId}`);
                chatMessagesContainer.innerHTML = '';
                let lastDate = null;
                messages.forEach(message => {
                    const messageDate = new Date(message.created_at).toDateString();
                    if (messageDate !== lastDate) {
                        const separator = document.createElement('div');
                        separator.className = 'date-separator';
                        separator.innerHTML = `<span>${formatDateSeparator(message.created_at)}</span>`;
                        chatMessagesContainer.appendChild(separator);
                        lastDate = messageDate;
                    }
                    appendMessage(message, message.sender_id === loggedInUserId);
                });
                setTimeout(() => {
                    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
                }, 100);
            } catch (error) {
                chatMessagesContainer.innerHTML = `<p class="search-placeholder">Error loading history: ${error.message}</p>`;
            }
        };
        
        // ----------------------------------------------------------------
        // 3. MESSAGE INTERACTION LOGIC
        // ----------------------------------------------------------------

        const enterReplyMode = (messageId, username, content) => {
            chatState.currentReplyToId = messageId;
            document.getElementById('reply-to-user').textContent = username;
            document.getElementById('reply-snippet').textContent = content;
            replyContextBar.classList.add('visible');
            chatInput.focus();
        };

        const cancelReplyMode = () => {
            chatState.currentReplyToId = null;
            replyContextBar.classList.remove('visible');
        };

        const scrollToMessage = (messageId) => {
            const targetMessage = document.getElementById(messageId);
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
            const replyBtn = document.getElementById('reply-from-menu-btn');
            const copyBtn = document.getElementById('copy-btn');
            const deleteBtn = document.getElementById('delete-from-menu-btn');

            chatState.contextMenuTarget = messageElement;
            deleteBtn.style.display = messageElement.classList.contains('sent') ? 'flex' : 'none';
            
            contextMenuOverlay.classList.add('visible');
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
        
        // ----------------------------------------------------------------
        // 5. SOCKET.IO INITIALIZATION AND EVENT LISTENERS
        // ----------------------------------------------------------------

        chatState.socket = io(API_BASE_URL.replace('/app', ''), { path: "/app/socket.io/" });
        chatState.roomName = [loggedInUserId, parseInt(otherUserId)].sort().join('-');
        
        chatState.socket.on('connect', () => {
            console.log('Connected to chat server:', chatState.socket.id);
            chatState.socket.emit('join_room', chatState.roomName);
        });

        chatState.socket.on('receive_message', (message) => {
            if (!document.getElementById(`msg-${message.message_id}`)) {
                appendMessage(message, false);
            }
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
        
        chatState.socket.on('message_deleted', ({ messageId }) => {
            removeMessageFromDOM(messageId);
        });

        cancelReplyBtn.addEventListener('click', cancelReplyMode);
        
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const content = chatInput.value.trim();
            if (content) {
                const tempId = `temp-${Date.now()}`;
                const messageData = {
                    message_id: tempId, sender_id: loggedInUserId, receiver_id: parseInt(otherUserId),
                    content: content, roomName: chatState.roomName, created_at: new Date().toISOString(),
                    parent_message_id: chatState.currentReplyToId,
                };
                
                chatState.socket.emit('send_message', messageData);
                appendMessage(messageData, true); 
                chatInput.value = '';
                cancelReplyMode();
                chatInput.focus();
            }
        });

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

        await fetchChatHistory();

    } catch (error) {
        console.error("Could not load Socket.IO library for chat.", error);
        alert("Chat connection error. Please try again.");
    }
}