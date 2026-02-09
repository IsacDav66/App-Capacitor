import { apiFetch, API_BASE_URL } from '../api.js';
import { getFullImageUrl, formatMessageTime, formatDateSeparator } from '../utils.js';

console.log("💣 [SISTEMA] El archivo chatController.js ha sido cargado en el navegador.");
const getMsgMetadata = (content) => {
    // Si la URL contiene estas carpetas, ES UN STICKER sin importar la extensión
    const isSticker = content.includes('/uploads/stickers') || content.includes('giphy.com');
    const isVideo = content.endsWith('.mp4');
    
    if (isSticker) return { label: "Sticker", url: content, isVideo };
    if (isVideo) return { label: "Video", url: content, isVideo: true };
    if (content.startsWith('http')) return { label: "Imagen", url: content, isVideo: false };
    
    return { label: null, url: null, isVideo: false };
};
export async function initChatController(domElements, partnerId, currentUserId) {
    
    // --- 1. DEFINICIÓN DE VARIABLES Y ESTADO (PRIVADAS AL CONTROLADOR) ---
    // --- DIAGNÓSTICO INICIAL ---
    console.log("🚀 CONTROLADOR: Iniciando para el usuario:", partnerId);

    const elements = domElements;
    const otherUserId = partnerId;
    const loggedInUserId = currentUserId;
    let activeClone = null;
    let originalParent = null;
    let nextSibling = null;

    if (!otherUserId || !loggedInUserId || !elements.messagesContainer) {
        console.error("Faltan datos o elementos del DOM para inicializar el chat.");
        return null; // Devolvemos null si la inicialización falla
    }

    const chatState = {
        currentReplyToId: null,
        contextMenuTarget: null,
        socket: null,
        roomName: null,
    };
    
    // --- 2. DEFINICIÓN DE TODAS LAS FUNCIONES AUXILIARES ---

    const appendMessage = (message, shouldScroll = true) => { 
        const isOwnMessage = message.sender_id === loggedInUserId;
        const lastMessageEl = elements.messagesContainer.querySelector('.message-bubble:last-child');
        
        const messageDiv = document.createElement('div');
        messageDiv.id = `msg-${message.message_id}`;
        messageDiv.className = `message-bubble ${isOwnMessage ? 'sent' : 'received'}`;
        messageDiv.dataset.senderId = message.sender_id;
        messageDiv.dataset.timestamp = message.created_at;

        const content = message.content;
        const isImageSticker = content.startsWith('http') && (content.endsWith('.gif') || content.endsWith('.png') || content.endsWith('.webp'));
        const isVideoSticker = content.startsWith('http') && content.endsWith('.mp4');

        if (String(message.message_id).startsWith('temp-')) {
            messageDiv.classList.add('pending');
        }

        if (message.parent_message_id) {
            let parentUsername = message.parent_username;
            let parentContent = message.parent_content;
            let parentMediaUrl = (parentContent && parentContent.startsWith('http')) ? parentContent : null;

            let displayLabel = parentContent;
            let isVideo = false;

            if (parentMediaUrl) {
                // Identificar si es un sticker
                displayLabel = (parentMediaUrl.includes('/uploads/stickers') || parentMediaUrl.includes('giphy.com')) 
                               ? "Sticker" : "Imagen";
                
                // Identificar si es un video
                isVideo = parentMediaUrl.toLowerCase().endsWith('.mp4');
            }

            const repliedSnippetLink = document.createElement('a');
            repliedSnippetLink.className = 'replied-to-snippet';
            repliedSnippetLink.href = '#';
            repliedSnippetLink.onclick = (e) => { 
                e.preventDefault(); 
                scrollToMessage(`msg-${message.parent_message_id}`); 
            };

            // ==========================================================
            // === ¡LÓGICA DE MINIATURA CORREGIDA! ===
            // ==========================================================
            let mediaTagHTML = '';
            if (parentMediaUrl) {
                if (isVideo) {
                    // Si es video, usamos <video> en miniatura, silenciado y auto-reproducido
                    mediaTagHTML = `<video src="${parentMediaUrl}" class="replied-media-thumb" muted playsinline autoplay loop></video>`;
                } else {
                    // Si es imagen o gif, usamos <img> normal
                    mediaTagHTML = `<img src="${parentMediaUrl}" class="replied-media-thumb">`;
                }
            }

            repliedSnippetLink.innerHTML = `
                <span class="replied-user">${parentUsername || 'Usuario'}</span>
                <div class="replied-text-with-media">
                    ${mediaTagHTML}
                    <span class="replied-text">${displayLabel}</span>
                </div>
            `;
            messageDiv.appendChild(repliedSnippetLink);
        }

        const mainContentWrapper = document.createElement('div');
        mainContentWrapper.className = 'message-main-content';

        if (isImageSticker || isVideoSticker) {
            // Marcamos la burbuja como sticker para quitarle el fondo
            messageDiv.classList.add('is-sticker');
            
            // Creamos el contenedor unificado
            const stickerContainer = document.createElement('div');
            stickerContainer.className = 'sticker-container';

            if (isImageSticker) {
                const stickerImg = document.createElement('img');
                stickerImg.src = content;
                stickerImg.className = 'sticker-render';
                stickerImg.onload = () => { 
                    if (shouldScroll) { // Ahora ya no dará error
                        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight; 
                    }
                };
                stickerContainer.appendChild(stickerImg);
            } else if (isVideoSticker) {
                const videoEl = document.createElement('video');
                videoEl.src = content;
                videoEl.className = 'sticker-render video-sticker';
                videoEl.autoplay = true;
                videoEl.muted = true;
                videoEl.loop = true;
                videoEl.playsInline = true;

                videoEl.addEventListener('click', () => {
                    document.querySelectorAll('video.video-sticker').forEach(otherVideo => {
                        if (otherVideo !== videoEl) otherVideo.muted = true;
                    });
                    videoEl.muted = !videoEl.muted;
                });
                stickerContainer.appendChild(videoEl);
            }
            
            mainContentWrapper.appendChild(stickerContainer);

        } else {
            // Texto normal
            const contentP = document.createElement('p');
            contentP.textContent = content;
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

    const fetchChatHistory = async () => {
        console.log("🛠️ [CONTROLADOR] Iniciando fetchChatHistory...");
        try {
            const { data: user } = await apiFetch(`/api/user/profile/${otherUserId}`);
            elements.userAvatar.src = getFullImageUrl(user.profile_pic_url);
            elements.userUsername.textContent = user.username;

            const { messages } = await apiFetch(`/api/chat/history/${otherUserId}`);
            console.log("📦 [DATOS] Mensajes recibidos:", messages.length);

            elements.messagesContainer.innerHTML = '';
            let lastDate = null;
            let dividerAdded = false;

            // 1. FILTRAR MENSAJES NO LEÍDOS (Los que él me envió)
            const unreads = messages.filter(m => 
                String(m.sender_id) === String(otherUserId) && m.is_read === false
            );
            console.log("👀 [FILTRO] Mensajes no leídos encontrados:", unreads.length);

            messages.forEach(message => {
                const mDate = new Date(message.created_at).toDateString();
                if (mDate !== lastDate) {
                    const sep = document.createElement('div');
                    sep.className = 'date-separator';
                    sep.innerHTML = `<span>${formatDateSeparator(message.created_at)}</span>`;
                    elements.messagesContainer.appendChild(sep);
                    lastDate = mDate;
                }

                // 2. DIBUJAR DIVISOR SI ES EL PRIMER MENSAJE NUEVO
                if (!dividerAdded && unreads.length > 0 && String(message.message_id) === String(unreads[0].message_id)) {
                    console.log("📍 [UI] Insertando divisor de no leídos.");
                    const div = document.createElement('div');
                    div.className = 'unread-divider';
                    div.innerHTML = `<span>${unreads.length} Mensajes nuevos</span>`;
                    elements.messagesContainer.appendChild(div);
                    dividerAdded = true;
                }

                appendMessage(message, false);
            });

            // 3. MARCAR COMO LEÍDOS SOLO SI HABÍA MENSAJES NUEVOS
            // Lo hacemos DESPUÉS de haberlos procesado en el UI
            if (unreads.length > 0) {
                apiFetch(`/api/chat/read-all/${otherUserId}`, { method: 'POST' })
                    .then(() => console.log("✅ [SERVER] Base de datos actualizada a LEÍDO."))
                    .catch(e => console.error("Error al actualizar lectura", e));
            }

            // 4. SCROLL INTELIGENTE
            setTimeout(() => {
    const divider = elements.messagesContainer.querySelector('.unread-divider');
    if (divider) {
        // Usa 'auto' para el primer salto, 'center' o 'start' para posicionar
        divider.scrollIntoView({ behavior: 'auto', block: 'start' });
    } else {
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    }
}, 300); // Sube un poco el tiempo (de 200 a 300) para dar tiempo al renderizado

        } catch (e) { console.error("❌ Error en el historial:", e); }
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

    const enterReplyMode = (messageId, username, content, mediaUrl = null) => {
    chatState.currentReplyToId = messageId;
    elements.replyToUser.textContent = username;

    // Lógica de etiqueta inteligente
    let cleanContent = content;
    if (mediaUrl && (mediaUrl.includes('/uploads/stickers') || mediaUrl.includes('giphy.com'))) {
        cleanContent = "Sticker";
    }
    elements.replySnippet.textContent = cleanContent;

    // Gestionar miniatura en la barra
    const prevMedia = elements.replyContextBar.querySelector('.reply-media-preview');
    if (prevMedia) prevMedia.remove();

    if (mediaUrl) {
        const isVideo = mediaUrl.endsWith('.mp4');
        const thumb = document.createElement(isVideo ? 'video' : 'img');
        thumb.src = mediaUrl;
        thumb.className = 'reply-media-preview';
        if (isVideo) { thumb.muted = true; thumb.autoplay = true; thumb.loop = true; }
        elements.replyContextBar.querySelector('.reply-preview').appendChild(thumb);
    }

    elements.replyContextBar.classList.add('visible');
    elements.chatInput.focus();
};

const cancelReplyMode = () => {
    chatState.currentReplyToId = null;
    elements.replyContextBar.classList.remove('visible'); // <-- CAMBIO: Usa `elements`
};
    const scrollToMessage = (messageId) => {
        // Buscamos el elemento directamente por su ID
        const targetMessage = document.getElementById(messageId);
        
        if (targetMessage) {
            // Hacemos el scroll suave y lo centramos en pantalla
            targetMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Añadimos el efecto visual de resaltado
            targetMessage.classList.add('highlighted');
            setTimeout(() => targetMessage.classList.remove('highlighted'), 2000);
        } else {
            console.warn("No se encontró el mensaje original en el historial cargado.");
        }
    };
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
        const content = messageElement.querySelector('p')?.textContent || "✨ Sticker";
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
                // e.preventDefault(); // Comentado para permitir scroll natural si no hay longpress
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
        if (deltaX > 80) {
            const username = messageElement.classList.contains('sent') ? 'Tú' : elements.userUsername.textContent;
            
            // Buscamos si hay un sticker o video dentro de la burbuja
            const mediaEl = messageElement.querySelector('.sticker-render');
            const mediaUrl = mediaEl ? mediaEl.src : null;
            
            // Usamos nuestra lógica de etiquetas
            const meta = mediaUrl ? getMsgMetadata(mediaUrl) : { label: null };
            const content = messageElement.querySelector('p')?.textContent || meta.label || "Mensaje";

            enterReplyMode(messageElement.id.replace('msg-', ''), username, content, mediaUrl);
            
            messageElement.style.transform = 'translateX(0)';
        } else {
            messageElement.style.transform = 'translateX(0)';
        }
    });
    };
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


    // --- 3. MÉTODO PÚBLICO DEL CONTROLADOR ---
    const sendMessage = (messageData) => {
        if (!chatState.socket || !chatState.socket.connected) return;

        // --- NUEVA LÓGICA PARA CAPTURAR DATOS DEL PADRE AL INSTANTE ---
        let parentContent = null;
        let parentUsername = null;

        if (chatState.currentReplyToId) {
            // Buscamos el elemento en el DOM al que estamos respondiendo
            const parentEl = document.getElementById(`msg-${chatState.currentReplyToId}`);
            if (parentEl) {
                // Obtenemos el nombre del autor
                parentUsername = parentEl.classList.contains('sent') ? 'Tú' : elements.userUsername.textContent;
                
                // Obtenemos el contenido (texto o la URL si es sticker)
                const p = parentEl.querySelector('p');
                const media = parentEl.querySelector('.sticker-render');
                parentContent = p ? p.textContent : (media ? media.src : "Sticker");
            }
        }

        const fullMessageData = {
            ...messageData,
            receiver_id: parseInt(otherUserId),
            roomName: chatState.roomName,
            created_at: new Date().toISOString(),
            parent_message_id: chatState.currentReplyToId,
            // ENRIQUECEMOS EL OBJETO LOCALMENTE
            parent_username: parentUsername,
            parent_content: parentContent
        };

        chatState.socket.emit('send_message', fullMessageData);
        
        // Ahora appendMessage ya tiene toda la info para dibujar el snippet inmediatamente
        appendMessage(fullMessageData, true); 

        if (elements.chatInput) elements.chatInput.value = '';
        cancelReplyMode();
    };
    
    // --- 4. LÓGICA DE INICIALIZACIÓN ---
    try {
        const { default: io } = await import('https://cdn.socket.io/4.7.5/socket.io.esm.min.js');
        chatState.socket = io(API_BASE_URL.replace('/app', ''), { path: "/app/socket.io/" });
        chatState.roomName = [loggedInUserId, parseInt(otherUserId)].sort().join('-');
        
        chatState.socket.on('connect', () => {
            console.log('Socket conectado:', chatState.socket.id);
            const token = localStorage.getItem('authToken');
            chatState.socket.emit('authenticate', token);
            chatState.socket.emit('join_room', chatState.roomName);
        });

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

        if (elements.chatForm) {
            elements.chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const content = elements.chatInput.value.trim();
                if (content) {
                    sendMessage({
                        message_id: `temp-${Date.now()}`,
                        sender_id: loggedInUserId,
                        content: content
                    });
                }
            });
        }
        
        if (elements.cancelReplyBtn) {
            elements.cancelReplyBtn.addEventListener('click', cancelReplyMode);
        }

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

    console.log("⌛ [PASO FINAL] Llamando a la carga de historial...");
        await fetchChatHistory();

    } catch (error) {
        console.error("❌ [ERROR FATAL]:", error);
    }

    return { sendMessage };

}