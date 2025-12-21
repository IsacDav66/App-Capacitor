// /js/modules/controllers/chatController.js

import { apiFetch, API_BASE_URL } from '../api.js';
import { getFullImageUrl, formatMessageTime, formatDateSeparator } from '../utils.js';

// --- VARIABLES GLOBALES DEL CONTROLADOR ---
let elements = {}; // Guardará las referencias a los elementos del DOM
let chatState = {}; // Guardará el estado específico de esta instancia del chat
let loggedInUserId, otherUserId; // IDs de los participantes
let activeClone = null; // NUEVA variable para guardar la referencia al clon


// ¡VARIABLES QUE FALTABAN, AHORA DECLARADAS!
let originalParent = null;
let nextSibling = null;


// ==========================================================
// === FUNCIONES DE LÓGICA Y RENDERIZADO (AHORA REUTILIZABLES)
// ==========================================================

// Todas las funciones internas ahora usarán `elements.nombreDelElemento`
// en lugar de `document.getElementById('nombre-del-elemento')`.

const appendMessage = (message) => {
    const isOwnMessage = message.sender_id === loggedInUserId;
    const lastMessageEl = elements.messagesContainer.querySelector('.message-bubble:last-child');
    const messageDiv = document.createElement('div');
    messageDiv.id = `msg-${message.message_id}`;
    messageDiv.className = `message-bubble ${isOwnMessage ? 'sent' : 'received'}`;
    messageDiv.dataset.senderId = message.sender_id;
    messageDiv.dataset.timestamp = message.created_at;
    const isSticker = message.content.startsWith('https://media') && message.content.endsWith('.gif');
    if (String(message.message_id).startsWith('temp-')) {
        messageDiv.classList.add('pending');
    }
    if (message.parent_message_id) {
        let parentUsername = message.parent_username;
        let parentContent = message.parent_content;
        if (isOwnMessage && !parentContent) {
            const parentMessageEl = elements.messagesContainer.querySelector(`#msg-${message.parent_message_id}`); 
            if (parentMessageEl) {
                parentContent = parentMessageEl.querySelector('p').textContent;
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
     if (isSticker) {
        messageDiv.style.backgroundColor = 'transparent';
        messageDiv.style.boxShadow = 'none';
        
        const stickerImg = document.createElement('img');
        stickerImg.src = message.content;
        stickerImg.className = 'sticker-render';
        stickerImg.style.maxWidth = '150px';
        stickerImg.style.borderRadius = '8px';

        // ==========================================================
        // === ¡AQUÍ ESTÁ LA LÓGICA CLAVE! ===
        // ==========================================================
        // Añadimos un listener que se disparará SOLO cuando la imagen
        // haya terminado de cargarse y tenga sus dimensiones finales.
        stickerImg.onload = () => {
            // Ahora que la imagen tiene su altura, el scrollHeight será el correcto.
            elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
        };
        // ==========================================================

        mainContentWrapper.appendChild(stickerImg);
    } else {
        // Si no, creamos el párrafo de texto como antes
        const contentP = document.createElement('p');
        contentP.textContent = message.content;
        mainContentWrapper.appendChild(contentP);
    }

    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'message-timestamp';
    timestampSpan.innerHTML = messageDiv.classList.contains('pending') ? '🕒' : formatMessageTime(message.created_at);
    mainContentWrapper.appendChild(timestampSpan);
    messageDiv.appendChild(mainContentWrapper);
    elements.messagesContainer.appendChild(messageDiv);
    if (lastMessageEl) {
        lastMessageEl.className = lastMessageEl.className.replace(/single|start-group|middle-group|end-group/g, '').trim() + ' ' + getGroupClassFor(lastMessageEl);
    }
    messageDiv.classList.add(getGroupClassFor(messageDiv));
    if (!messageDiv.classList.contains('pending')) {
        addInteractionHandlers(messageDiv);
    }
    
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
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

        /**
 * Muestra un modal de confirmación y llama a la API para eliminar un mensaje.
 * @param {string} messageId - El ID del mensaje a eliminar.
 */
async function deleteMessage(messageId) {
    // 1. Usamos el objeto `elements` para encontrar los elementos del modal
    const modal = elements.deleteConfirmModal;
    const cancelBtn = elements.cancelDeleteBtn;
    const confirmBtn = elements.confirmDeleteBtn;

    if (!modal || !cancelBtn || !confirmBtn) {
        console.error("Elementos del modal de eliminación no encontrados en el DOM. Usando confirm() como fallback.");
        // Fallback al confirm nativo si los elementos no existen
        if (confirm('¿Seguro que quieres eliminar este mensaje?')) {
             try {
                await apiFetch(`/api/chat/messages/${messageId}`, { method: 'DELETE' });
            } catch (error) {
                alert(`Error al eliminar: ${error.message}`);
            }
        }
        return;
    }

    // 2. Mostrar el modal
    modal.style.display = 'flex';

    // 3. Crear una promesa que se resolverá cuando el usuario haga clic en un botón
    const waitForUserInput = new Promise((resolve) => {
        cancelBtn.onclick = () => resolve(false);
        confirmBtn.onclick = () => resolve(true);
    });

    // 4. Esperar a que el usuario decida
    const shouldDelete = await waitForUserInput;

    // 5. Ocultar el modal
    modal.style.display = 'none';

    // 6. Si el usuario confirmó, proceder con la eliminación
    if (shouldDelete) {
        try {
            await apiFetch(`/api/chat/messages/${messageId}`, { method: 'DELETE' });
            console.log(`Solicitud de eliminación enviada para el mensaje ID: ${messageId}`);
        } catch (error) {
            alert(`Error al eliminar el mensaje: ${error.message}`);
        }
    }
}

// ==========================================================
// === FUNCIONES DEL MENÚ CONTEXTUAL (VERSIÓN CON CLONACIÓN) ===
// ==========================================================

function openContextMenu(messageElement) {
    if (!messageElement) return;

    // ==========================================================
    // === ¡CÓDIGO DE COLOR DEL RESPLANDOR! ===
    // ==========================================================
    // Obtenemos el color de acento actual del tema desde las variables CSS
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim();
    
    // Establecemos la variable CSS '--message-color' en la burbuja activa.
    // Tanto la regla para .message-bubble.context-active como la nueva regla para
    // .sticker-render usarán este color.
    messageElement.style.setProperty('--message-color', accentColor);
    // ==========================================================

    activeClone = messageElement.cloneNode(true);
    const rect = messageElement.getBoundingClientRect();
    
    // Guardamos la posición original
    originalParent = messageElement.parentElement;
    nextSibling = messageElement.nextElementSibling;
    
    const isFloatingWindow = (window.self !== window.top);

    if (isFloatingWindow) {
        activeClone.style.position = 'fixed';
        activeClone.style.top = `${rect.top}px`;
    } else {
        activeClone.style.position = 'fixed';
        activeClone.style.top = `${rect.top}px`;
        activeClone.style.left = `${rect.left}px`;

    }
    
    activeClone.style.zIndex = '100';
    activeClone.classList.add('context-active');
    messageElement.classList.add('context-hidden');
    document.body.appendChild(activeClone);

    const overlay = elements.contextMenuOverlay;
    const menu = elements.contextMenu;
    const replyBtn = elements.replyFromMenuBtn;
    const copyBtn = elements.copyBtn;
    const deleteBtn = elements.deleteBtn;

    if (!overlay || !menu) return;
    
    chatState.contextMenuTarget = messageElement;
    
    deleteBtn.style.display = messageElement.classList.contains('sent') ? 'flex' : 'none';
    overlay.classList.add('visible');

    const menuRect = menu.getBoundingClientRect();
    let menuTop = rect.bottom + 10;
    if (menuTop + menuRect.height > window.innerHeight) {
        menuTop = rect.top - menuRect.height - 10;
    }
    let menuLeft = rect.left + (rect.width / 2) - (menuRect.width / 2);
    if (menuLeft < 10) menuLeft = 10;
    if (menuLeft + menuRect.width > window.innerWidth - 10) {
        menuLeft = window.innerWidth - menuRect.width - 10;
    }
    menu.style.top = `${menuTop}px`;
    menu.style.left = `${menuLeft}px`;
    setTimeout(() => menu.classList.add('visible'), 0);

    replyBtn.onclick = () => {
        const username = messageElement.classList.contains('sent') ? 'Tú' : elements.userUsername.textContent;
        const content = messageElement.querySelector('p').textContent;
        enterReplyMode(messageElement.id.replace('msg-', ''), username, content);
        closeContextMenu();
    };
    copyBtn.onclick = () => { copyMessageText(messageElement); closeContextMenu(); };
    deleteBtn.onclick = () => { deleteMessage(messageElement.id.replace('msg-', '')); closeContextMenu(); };
    overlay.onclick = closeContextMenu;
}

function closeContextMenu() {
    const overlay = elements.contextMenuOverlay;
    const menu = elements.contextMenu;
    if (!overlay || !menu) return;

    if (activeClone) {
        activeClone.remove();
        activeClone = null;
    }
    
    if (chatState.contextMenuTarget) {
        chatState.contextMenuTarget.classList.remove('context-hidden');
    }
    
    overlay.classList.remove('visible');
    menu.classList.remove('visible');
    chatState.contextMenuTarget = null;
    originalParent = null;
    nextSibling = null;
}
const addInteractionHandlers = (messageElement) => {
    let startX = 0, deltaX = 0, longPressTimer;
    const swipeThreshold = 80;

    messageElement.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        deltaX = 0;
        messageElement.style.transition = 'transform 0.1s ease-out';
        longPressTimer = setTimeout(() => {
            e.preventDefault();
            openContextMenu(messageElement)
        }, 500);
    }, { passive: false });

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
            // ==========================================================
            // === ¡AQUÍ ESTÁ LA CORRECCIÓN! ===
            // ==========================================================
            // Usamos `elements.userUsername` en lugar de `userUsernameEl`
            const username = messageElement.classList.contains('sent') ? 'Tú' : elements.userUsername.textContent;
            // ==========================================================
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
    elements = domElements;
    otherUserId = partnerId;
    loggedInUserId = currentUserId;

    if (!otherUserId || !loggedInUserId || !elements.messagesContainer) {
        console.error("Faltan datos o elementos del DOM para inicializar el chat.");
        return null; // Devolvemos null si la inicialización falla
    }

    chatState = {
        currentReplyToId: null,
        contextMenuTarget: null,
        socket: null,
        roomName: null,
    };

    // ==========================================================
    // === MÉTODO PÚBLICO DEL CONTROLADOR QUE SERÁ DEVUELTO ===
    // ==========================================================
    const sendMessage = (messageData) => {
        if (!chatState.socket || !chatState.socket.connected) {
            console.error("No se puede enviar el mensaje, el socket no está conectado.");
            return;
        }
        const fullMessageData = {
            ...messageData,
            receiver_id: parseInt(otherUserId),
            roomName: chatState.roomName,
            created_at: new Date().toISOString(),
            parent_message_id: chatState.currentReplyToId,
        };
        chatState.socket.emit('send_message', fullMessageData);
        appendMessage(fullMessageData);
        if (elements.chatInput) elements.chatInput.value = '';
        cancelReplyMode();
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
        // --- LISTENERS DEL DOM ---
        
        // Listener del botón Cancelar Respuesta (si existe)
        if (elements.cancelReplyBtn) {
            elements.cancelReplyBtn.addEventListener('click', cancelReplyMode);
        }
        
        // Listener del formulario de envío (si existe)
        if (elements.chatForm) {
            // ==========================================================
            // === ¡AQUÍ ESTÁ LA CORRECCIÓN! ===
            // ==========================================================
            elements.chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                // Usamos `elements.chatInput` en lugar de `chatInput`
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
                    // Usamos `elements.chatInput` para limpiar el campo
                    elements.chatInput.value = '';
                    cancelReplyMode();
                }
            });
            // ==========================================================
        }


        // ==========================================================
        // === ¡AQUÍ ESTÁ LA CORRECCIÓN! ===
        // ==========================================================
        // Listener de scroll para el header de fecha pegajoso (si existe)
        if (elements.messagesContainer && elements.stickyHeader) {
            let hideHeaderTimeout;
            elements.messagesContainer.addEventListener('scroll', () => {
                // Usamos `elements.messagesContainer` en lugar de la variable antigua
                const dateSeparators = Array.from(elements.messagesContainer.querySelectorAll('.date-separator'));
                if (dateSeparators.length === 0) return;

                let activeSeparatorText = null;
                const containerTop = elements.messagesContainer.getBoundingClientRect().top;

                for (let i = dateSeparators.length - 1; i >= 0; i--) {
                    const separator = dateSeparators[i];
                    if (separator.getBoundingClientRect().top < containerTop) {
                        activeSeparatorText = separator.querySelector('span').textContent;
                        break;
                    }
                }
                
                // Usamos `elements.stickyHeaderText` y `elements.stickyHeader`
                if (activeSeparatorText) {
                    elements.stickyHeaderText.textContent = activeSeparatorText;
                    elements.stickyHeader.classList.add('visible');
                } else {
                    elements.stickyHeader.classList.remove('visible');
                }
                
                clearTimeout(hideHeaderTimeout);
                hideHeaderTimeout = setTimeout(() => {
                    elements.stickyHeader.classList.remove('visible');
                }, 1500);
            });
        }
        // ==========================================================

        await fetchChatHistory();

   // ==========================================================
        // === ¡AQUÍ ESTÁ LA LÍNEA CRÍTICA QUE FALTA! ===
        // ==========================================================
        // Devolvemos el objeto del controlador con sus métodos públicos
        return {
            sendMessage
        };

    } catch (error) {
        console.error("No se pudo cargar la librería Socket.IO o inicializar el chat.", error);
        if (elements.messagesContainer) {
            elements.messagesContainer.innerHTML = `<p class="search-placeholder">Error en la conexión del chat.</p>`;
        }
        // Devolvemos null explícitamente si hay un error
        return null;
    }
}