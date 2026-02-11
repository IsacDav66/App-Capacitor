import { apiFetch, ChatCache, API_BASE_URL } from '../api.js';
import { getFullImageUrl, formatMessageTime, formatDateSeparator } from '../utils.js';

const FAV_ICONS = {
    add: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
    remove: `<svg viewBox="0 0 24 24" width="18" height="18" fill="#facc15"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
};

// Añade esto arriba de initChatController
function showToast(message, type = 'success') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Opcional: un alert simple para probar
    // alert(message); 
}
export async function initChatController(domElements, partnerId, currentUserId) {
   

    const elements = domElements;
    const otherUserId = partnerId;
    const loggedInUserId = currentUserId;
    
    const scrollBtn = document.getElementById('scroll-bottom-btn');
    const scrollBadge = document.getElementById('scroll-unread-badge');

    // 2. Al asignar el clic (Donde daba el error):
    if (scrollBtn) { // <--- AGREGAR ESTA CONDICIÓN
        scrollBtn.onclick = () => {
            elements.messagesContainer.scrollTo({
                top: elements.messagesContainer.scrollHeight,
                behavior: 'smooth'
            });
        };
    }

    let activeClone = null;
    let originalParent = null;
    let nextSibling = null;
    let timerInterval = null;
    let longPressTimer = null;
    let unreadScrollCount = 0;


    if (!otherUserId || !loggedInUserId || !elements.messagesContainer) return null;
    
    const chatState = { currentReplyToId: null, socket: null, roomName: null };
     // --- VIGILANTE DE CARGA PEREZOSA (LAZY LOADING) ---
    const mediaObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const media = entry.target;
                // Al entrar en pantalla, pasamos la URL del 'data-src' al 'src' real
                if (media.dataset.src) {
                    media.src = media.dataset.src;
                    media.removeAttribute('data-src'); // Limpiamos
                    
                    // Si es un video, forzamos el play ahora que tiene fuente
                    if (media.tagName === 'VIDEO') {
                        media.load();
                        media.play().catch(() => {});
                    }
                }
                mediaObserver.unobserve(media); // Dejamos de vigilarlo ya que cargó
            }
        });
    }, { 
        root: elements.messagesContainer,
        rootMargin: '200px 0px', // Carga 200px antes de que aparezca (para que no se vea el hueco)
        threshold: 0.01 
    });
    const copyMessageText = (el) => {
        const text = el.querySelector('p')?.textContent;
        if (text) {
            navigator.clipboard.writeText(text).then(() => {
                // Si tienes un sistema de Toast, úsalo aquí
                console.log("Copiado al portapapeles");
            }).catch(err => console.error("Error al copiar:", err));
        }
    };

    // --- FUNCIÓN PARA GUARDAR UN SOLO MENSAJE EN LA CACHÉ ---
    const addToCache = (message) => {
        const cached = ChatCache.get(loggedInUserId, otherUserId) || [];
        if (cached.some(m => String(m.message_id) === String(message.message_id))) return;

        // IMPORTANTE: Forzamos is_read a true porque si este código se ejecuta,
        // es porque el usuario está dentro de la pantalla del chat.
        const messageToStore = { 
            ...message, 
            is_read: true 
        };
        
        cached.push(messageToStore);
        ChatCache.set(loggedInUserId, otherUserId, cached.slice(-200));
    };
    const appendMessage = (message, shouldScroll = true) => {
    if (document.getElementById(`msg-${message.message_id}`)) return;

    // Buscamos el que era el último antes de meter el nuevo
    const previousLast = elements.messagesContainer.querySelector('.message-bubble:last-child');

    const messageNode = createQuickMessageNode(message, shouldScroll);
    elements.messagesContainer.appendChild(messageNode);

    // Actualizamos al anterior y al nuevo
    if (previousLast) {
        previousLast.className = previousLast.className.replace(/single|start-group|middle-group|end-group/g, '').trim();
        previousLast.classList.add(getGroupClassFor(previousLast));
    }
    messageNode.classList.add(getGroupClassFor(messageNode));
    
    // ==========================================================
    // === ¡LA CLAVE!: GUARDADO INSTANTÁNEO EN CACHÉ ===
    // ==========================================================
    // No guardamos los mensajes temporales (reloj), solo los reales
    if (!String(message.message_id).startsWith('temp-')) {
        addToCache(message);
    }
    // ==========================================================

    if (shouldScroll) {
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    }
};


    // --- 1. LÓGICA DE AGRUPAMIENTO ---
    const getGroupClassFor = (messageEl) => {
        const timeThreshold = 60000; // 1 minuto para agrupar
        const senderId = messageEl.dataset.senderId;
        const timestamp = new Date(messageEl.dataset.timestamp);

        // Buscamos el hermano anterior que sea una burbuja de mensaje (saltando fechas o divisores)
        let prev = messageEl.previousElementSibling;
        while (prev && !prev.classList.contains('message-bubble')) prev = prev.previousElementSibling;
        
        // Buscamos el hermano siguiente que sea una burbuja
        let next = messageEl.nextElementSibling;
        while (next && !next.classList.contains('message-bubble')) next = next.nextElementSibling;

        const isStart = !prev || prev.dataset.senderId !== senderId || (timestamp - new Date(prev.dataset.timestamp)) > timeThreshold;
        const isEnd = !next || next.dataset.senderId !== senderId || (new Date(next.dataset.timestamp) - timestamp) > timeThreshold;
        
        if (isStart && isEnd) return 'single';
        if (isStart) return 'start-group';
        if (isEnd) return 'end-group';
        return 'middle-group';
    };

    // --- 2. GESTOS Y MENÚ CONTEXTUAL ---
    const scrollToMessage = (messageId) => {
        const target = document.getElementById(messageId);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.classList.add('highlighted');
            setTimeout(() => target.classList.remove('highlighted'), 2000);
        }
    };

    const enterReplyMode = (messageId, username, content, mediaUrl = null) => {
    chatState.currentReplyToId = messageId;
    elements.replyToUser.textContent = username;
    
    // Ponemos el texto limpio ("Sticker" o el mensaje real)
    elements.replySnippet.textContent = content;

    // 1. Limpiar cualquier miniatura anterior
    const prevMedia = elements.replyContextBar.querySelector('.reply-media-preview');
    if (prevMedia) prevMedia.remove();

    // 2. Si hay una imagen/video, crear la miniatura real
    if (mediaUrl) {
        const isVideo = mediaUrl.toLowerCase().endsWith('.mp4');
        const thumb = document.createElement(isVideo ? 'video' : 'img');
        
        thumb.src = mediaUrl;
        thumb.className = 'reply-media-preview';
        
        if (isVideo) {
            thumb.muted = true;
            thumb.autoplay = true;
            thumb.loop = true;
            thumb.playsInline = true;
        }
        
        // Insertar la miniatura a la derecha en la barra de respuesta
        elements.replyContextBar.querySelector('.reply-preview').appendChild(thumb);
    }

    elements.replyContextBar.classList.add('visible');
    elements.chatInput.focus();
};
    
const cancelReplyMode = () => {
    chatState.currentReplyToId = null;
    elements.replyContextBar.classList.remove('visible'); // <-- CAMBIO: Usa `elements`
};
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

    // ==========================================================
        // === ¡CORRECCIÓN PARA VIDEOS EN EL MENÚ CONTEXTUAL! ===
        // ==========================================================
        const originalVid = messageElement.querySelector('video');
        const clonedVid = activeClone.querySelector('video');

        if (clonedVid) {
            // 1. Aseguramos que la URL sea la misma (por si el lazy loading no terminó)
            if (originalVid) {
                clonedVid.src = originalVid.src || originalVid.dataset.src;
            }

            // 2. Forzamos la opacidad a 1 por si la animación de carga no terminó
            clonedVid.style.opacity = "1";

            // 3. Reiniciamos la reproducción en el clon
            clonedVid.muted = true; // Por seguridad en el menú
            clonedVid.play().catch(err => console.warn("Error al reproducir clon:", err));
        }
        // ==========================================================

    const overlay = elements.contextMenuOverlay;
    const menu = elements.contextMenu;
    const replyBtn = elements.replyFromMenuBtn;
    const copyBtn = elements.copyBtn;
    const deleteBtn = elements.deleteBtn;
    
    const copyText = copyBtn.querySelector('.context-menu-text');
    const copyIcon = copyBtn.querySelector('.context-menu-icon');
    const isSticker = messageElement.classList.contains('is-sticker');

    if (isSticker) {
        const mediaEl = messageElement.querySelector('.sticker-render');
        const fullUrl = mediaEl.src;
        
        // 1. NORMALIZAR LA URL: Extraemos solo de /uploads en adelante
        // Esto garantiza que la comparación funcione sin importar el dominio
        const relativeUrl = fullUrl.includes('/uploads') 
            ? fullUrl.substring(fullUrl.indexOf('/uploads')) 
            : fullUrl;

        // 2. LEER DATOS FRESCOS DEL DISCO
        const collectionsObj = JSON.parse(localStorage.getItem('stickerCollections')) || { "Favoritos": [] };
        const favoriteList = collectionsObj["Favoritos"] || [];

        // 3. COMPROBACIÓN EXACTA
        const isAlreadyFav = favoriteList.some(url => url === relativeUrl);

        // 4. ACTUALIZAR UI DEL BOTÓN
        copyText.innerText = isAlreadyFav ? "Quitar de favoritos" : "Añadir a favoritos";
        copyIcon.innerHTML = isAlreadyFav ? FAV_ICONS.remove : FAV_ICONS.add;

        copyBtn.onclick = () => {
            // Volvemos a obtener el objeto para no sobreescribir cambios de otras pestañas
            let freshCols = JSON.parse(localStorage.getItem('stickerCollections')) || { "Favoritos": [] };
            if (!freshCols["Favoritos"]) freshCols["Favoritos"] = [];

            if (isAlreadyFav) {
                // Eliminar
                freshCols["Favoritos"] = freshCols["Favoritos"].filter(url => url !== relativeUrl);
                showToast("Eliminado de favoritos", "info");
            } else {
                // Añadir al principio
                freshCols["Favoritos"].unshift(relativeUrl);
                showToast("Añadido a favoritos");
            }

            // Guardar y Avisar
            localStorage.setItem('stickerCollections', JSON.stringify(freshCols));
            window.dispatchEvent(new CustomEvent('customStickersUpdated'));
            
            closeContextMenu();
        };
    } else {
        // Restaurar modo normal para mensajes de texto
        copyText.innerText = "Copiar";
        copyIcon.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M14.3438 16.875H6.46875C5.79742 16.875 5.15359 16.6083 4.67889 16.1336C4.20418 15.6589 3.9375 15.0151 3.9375 14.3438V6.46875C3.9375 5.79742 4.20418 5.15359 4.67889 4.67889C5.15359 4.20418 5.79742 3.9375 6.46875 3.9375H14.3438C15.0151 3.9375 15.6589 4.20418 16.1336 4.67889C16.6083 5.15359 16.875 5.79742 16.875 6.46875V14.3438C16.875 15.0151 16.6083 15.6589 16.1336 16.1336C15.6589 16.6083 15.0151 16.875 14.3438 16.875Z"/><path d="M5.625 2.8125H13.9177C13.7426 2.31934 13.4193 1.89242 12.9921 1.59029C12.5648 1.28816 12.0545 1.12563 11.5312 1.125H3.65625C2.98492 1.125 2.34109 1.39168 1.86639 1.86639C1.39168 2.34109 1.125 2.98492 1.125 3.65625V11.5312C1.12563 12.0545 1.28816 12.5648 1.59029 12.9921C1.89242 13.4193 2.31934 13.7426 2.8125 13.9177V5.625C2.8125 4.87908 3.10882 4.16371 3.63626 3.63626C4.16371 3.10882 4.87908 2.8125 5.625 2.8125Z"/></svg>`;
        copyBtn.onclick = () => { copyMessageText(messageElement); closeContextMenu(); };
    }


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
        const isOwn = messageElement.classList.contains('sent');
        const username = isOwn ? 'Tú' : elements.userUsername.textContent;

        // 1. Buscamos la URL de la imagen o video del sticker
        const mediaEl = messageElement.querySelector('.sticker-render');
        const mediaUrl = mediaEl ? (mediaEl.src || mediaEl.dataset.src) : null;

        // 2. Obtenemos el texto limpio (SIN EMOJIS HARDCODED)
        const content = messageElement.querySelector('p')?.textContent || (mediaUrl ? "Sticker" : "Mensaje");

        // 3. Pasamos el ID, el usuario, el texto y LA URL DE LA IMAGEN
        enterReplyMode(messageElement.id.replace('msg-', ''), username, content, mediaUrl);
        
        closeContextMenu();
    };
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
            
            // 1. Aplicamos una transición suave para el regreso
            messageElement.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            
            // 2. Si el deslizamiento fue suficiente, activamos la respuesta
            if (deltaX > 80) {
                const username = messageElement.classList.contains('sent') ? 'Tú' : elements.userUsername.textContent;
                const mediaEl = messageElement.querySelector('.sticker-render');
                const mediaUrl = mediaEl ? mediaEl.src : null;
                const content = messageElement.querySelector('p')?.textContent || (mediaUrl ? "Sticker" : "Mensaje");

                enterReplyMode(messageElement.id.replace('msg-', ''), username, content, mediaUrl);
            }
            
            // ==========================================================
            // === ¡ESTA ES LA LÍNEA QUE LO DEVUELVE A SU LUGAR! ===
            // ==========================================================
            messageElement.style.transform = 'translateX(0)';
            // ==========================================================

            // Reseteamos el delta para el próximo toque
            deltaX = 0;
        });
    };

    // --- FUNCIÓN DE ENVIAR MENSAJE (CORREGIDA) ---
    const sendMessage = (messageData) => {
        if (!chatState.socket || !chatState.socket.connected) {
            console.error("Socket desconectado");
            return;
        }
        const tempId = messageData.message_id || `temp-${Date.now()}`;

        // 1. Enriquecer el mensaje con datos de respuesta (si hay)
        let parentContent = null;
        let parentUsername = null;

        if (chatState.currentReplyToId) {
    const parentEl = document.getElementById(`msg-${chatState.currentReplyToId}`);
    if (parentEl) {
        parentUsername = parentEl.classList.contains('sent') ? 'Tú' : elements.userUsername.textContent;
        const p = parentEl.querySelector('p');
        const media = parentEl.querySelector('.sticker-render');
        
        // LA CLAVE: Si es sticker, mandamos la URL en el contenido del padre
        parentContent = p ? p.textContent : (media ? media.src : "Sticker");
    }
}

        // 2. Crear el objeto final con FECHA y datos de respuesta
        const fullMessageData = {
            ...messageData,
            message_id: tempId,
            receiver_id: parseInt(otherUserId),
            roomName: chatState.roomName,
            created_at: new Date().toISOString(), // <--- AHORA SÍ LLEVA HORA
            parent_message_id: chatState.currentReplyToId,
            parent_username: parentUsername,
            parent_content: parentContent
        };

        // 3. Emitir al servidor
        chatState.socket.emit('send_message', fullMessageData);
        
        // 4. DIBUJAR EN MI PANTALLA INMEDIATAMENTE
        appendMessage(fullMessageData, true);

        // 5. Limpiar el modo respuesta
        cancelReplyMode();
    };
    const deleteMessage = async (messageId) => {
        // Usamos el modal de confirmación que ya tienes en el DOM
        elements.deleteConfirmModal.style.display = 'flex';

        const confirmBtn = elements.confirmDeleteBtn;
        const cancelBtn = elements.cancelDeleteBtn;

        const handleConfirm = async () => {
            elements.deleteConfirmModal.style.display = 'none';
            try {
                const res = await apiFetch(`/api/chat/messages/${messageId}`, { method: 'DELETE' });
                if (res.success) {
                    removeMessageFromDOM(messageId);
                    // Opcional: actualizar caché local
                }
            } catch (e) { console.error("Error al borrar:", e); }
            cleanup();
        };

        const cleanup = () => {
            confirmBtn.onclick = null;
            cancelBtn.onclick = null;
            elements.deleteConfirmModal.style.display = 'none';
        };

        confirmBtn.onclick = handleConfirm;
        cancelBtn.onclick = () => cleanup();
    };

    const removeMessageFromDOM = (messageId) => {
        const el = document.getElementById(`msg-${messageId}`);
        if (!el) return;
        
        el.style.transition = 'all 0.3s ease';
        el.style.opacity = '0';
        el.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            el.remove();
            // Re-calcular grupos de mensajes vecinos tras borrar
            elements.messagesContainer.querySelectorAll('.message-bubble').forEach(m => {
                m.className = m.className.replace(/single|start-group|middle-group|end-group/g, '').trim();
                m.classList.add(getGroupClassFor(m));
            });
        }, 300);
    };

    // --- 3. CREACIÓN DE NODOS ---
    const createQuickMessageNode = (message, shouldScroll = false) => {
    const isOwn = String(message.sender_id) === String(loggedInUserId);
    const msgId = String(message.message_id || "");
    const isPending = msgId.startsWith('temp-'); 

    const messageDiv = document.createElement('div');
    messageDiv.id = `msg-${msgId}`;
    messageDiv.className = `message-bubble ${isOwn ? 'sent' : 'received'} ${isPending ? 'pending' : ''}`;
    messageDiv.dataset.senderId = message.sender_id;
    messageDiv.dataset.timestamp = message.created_at;

    // --- 1. LÓGICA DE RESPUESTAS ---
    if (message.parent_message_id) {
        const replyLink = document.createElement('a');
        replyLink.className = 'replied-to-snippet';
        replyLink.href = '#';
        const parentContent = message.parent_content || "";
const isParentMedia = parentContent.startsWith('http');
let displayLabel = parentContent;
let mediaTagHTML = '';

if (isParentMedia) {
    displayLabel = (parentContent.includes('stickers') || parentContent.includes('giphy')) ? "Sticker" : "Imagen";
    if (parentContent.toLowerCase().endsWith('.mp4')) {
        mediaTagHTML = `<video src="${parentContent}" class="replied-media-thumb" muted playsinline autoplay loop></video>`;
    } else {
        mediaTagHTML = `<img src="${parentContent}" class="replied-media-thumb">`;
    }
}

replyLink.innerHTML = `
    <span class="replied-user">${message.parent_username || 'Usuario'}</span>
    <div class="replied-text-with-media">
        ${mediaTagHTML}
        <span class="replied-text">${displayLabel}</span>
    </div>`;
        replyLink.onclick = (e) => { e.preventDefault(); scrollToMessage(`msg-${message.parent_message_id}`); };
        messageDiv.appendChild(replyLink);
    }

    // --- 2. CONTENIDO PRINCIPAL ---
    const mainContentWrapper = document.createElement('div');
    mainContentWrapper.className = 'message-main-content';
    const content = message.content;
    const isSticker = content.includes('/uploads/stickers') || content.includes('giphy.com');
    const isVideo = content.toLowerCase().endsWith('.mp4');

    if (isSticker) {
        messageDiv.classList.add('is-sticker');
        const stickerContainer = document.createElement('div');
        stickerContainer.className = 'sticker-container';

        if (isVideo) {
            const vid = document.createElement('video');
            vid.className = 'sticker-render video-sticker';
            vid.dataset.src = content; 
            vid.muted = vid.loop = true;
            vid.setAttribute('playsinline', '');
            vid.setAttribute('preload', 'metadata');

            const soundIndicator = document.createElement('div');
            soundIndicator.className = 'video-sound-indicator is-muted'; // Nace mudo
            soundIndicator.style.display = "none"; 
            
            soundIndicator.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <!-- Cuerpo del altavoz -->
                    <path d="M11 5L6 9H2V15H6L11 19V5Z"></path>
                    <!-- Onda 1 (Pequeña) -->
                    <path class="sound-wave sound-wave-1" d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    <!-- Onda 2 (Grande) -->
                    <path class="sound-wave sound-wave-2" d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>`;

            vid.onloadeddata = () => {
                setTimeout(() => {
                    const hasAudio = (vid.webkitAudioDecodedByteCount > 0 || vid.audioTracks?.length > 0 || vid.mozHasAudio);
                    if (hasAudio) {
                        soundIndicator.style.display = "flex";
                        soundIndicator.style.opacity = "1";
                        // Marcamos el contenedor para saber que este sticker SÍ tiene audio
                        stickerContainer.dataset.hasAudio = "true";
                    }
                }, 300);
                if (shouldScroll) elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
            };

            // --- LÓGICA DE CLIC CORREGIDA ---
            vid.onclick = (e) => {
                e.stopPropagation();

                document.querySelectorAll('video.video-sticker').forEach(otherVid => {
                    if (otherVid !== vid) {
                        otherVid.muted = true;
                        const otherContainer = otherVid.closest('.sticker-container');
                        if (otherContainer && otherContainer.dataset.hasAudio === "true") {
                            const otherIcon = otherContainer.querySelector('.video-sound-indicator');
                            if (otherIcon) {
                                otherIcon.classList.add('is-muted');
                                otherIcon.classList.remove('is-playing');
                                otherIcon.style.opacity = "1";
                            }
                        }
                    }
                });

                vid.muted = !vid.muted;
                
                // --- LÓGICA DE ANIMACIÓN DEL ICONO ---
                if (vid.muted) {
                    soundIndicator.classList.add('is-muted');
                    soundIndicator.classList.remove('is-playing');
                    soundIndicator.style.opacity = "1";
                } else {
                    soundIndicator.classList.remove('is-muted');
                    soundIndicator.classList.add('is-playing');
                    // Opcional: bajar la opacidad un poco pero que se siga viendo la animación
                    soundIndicator.style.opacity = "0.9"; 
                }

                if (vid.paused) vid.play();
            };

            mediaObserver.observe(vid);
            stickerContainer.appendChild(vid);
            stickerContainer.appendChild(soundIndicator);
        } else {
            const img = document.createElement('img');
            
            // --- CAMBIO CLAVE: No asignamos SRC todavía ---
            img.dataset.src = content; 
            
            img.className = 'sticker-render';
            img.loading = "lazy"; // Soporte extra del navegador

            // Ponemos la imagen a vigilar
            mediaObserver.observe(img);
            stickerContainer.appendChild(img);
        }
        mainContentWrapper.appendChild(stickerContainer);
    } else {
        const p = document.createElement('p'); p.textContent = content;
        mainContentWrapper.appendChild(p);
    }

    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'message-timestamp';
    if (isPending) {
        timestampSpan.innerHTML = '🕒';
    } else {
        timestampSpan.innerHTML = formatMessageTime(message.created_at);
    }
    mainContentWrapper.appendChild(timestampSpan);
    
    messageDiv.appendChild(mainContentWrapper);
    
    
    addInteractionHandlers(messageDiv);

    return messageDiv; 
};
    // --- 4. RENDERIZADO Y CARGA ---
    function renderMessagesList(messages, shouldScroll = true) {
    if (!messages) return;

    const oldScrollHeight = elements.messagesContainer.scrollHeight;
    const oldScrollTop = elements.messagesContainer.scrollTop;

    const fragment = document.createDocumentFragment();
    let lastDate = null;
    let dividerAdded = false;
    const unreads = messages.filter(m => String(m.sender_id) === String(otherUserId) && m.is_read === false);

    messages.forEach(message => {
        const mDate = new Date(message.created_at).toDateString();
        if (mDate !== lastDate) {
            const sep = document.createElement('div');
            sep.className = 'date-separator';
            sep.innerHTML = `<span>${formatDateSeparator(message.created_at)}</span>`;
            fragment.appendChild(sep);
            lastDate = mDate;
        }

        if (!dividerAdded && unreads.length > 0 && String(message.message_id) === String(unreads[0].message_id)) {
            const unreadDiv = document.createElement('div');
            unreadDiv.className = 'unread-divider';
            unreadDiv.innerHTML = `<span>${unreads.length} Mensajes nuevos</span>`;
            fragment.appendChild(unreadDiv);
            dividerAdded = true;
        }
        fragment.appendChild(createQuickMessageNode(message));
    });

    elements.messagesContainer.innerHTML = ''; 
    elements.messagesContainer.appendChild(fragment);

    // ==========================================================
    // === ¡LA CLAVE!: RE-CALCULAR GRUPOS DESPUÉS DEL DIBUJO ===
    // ==========================================================
    const allBubbles = elements.messagesContainer.querySelectorAll('.message-bubble');
    allBubbles.forEach(bubble => {
        // Limpiamos clases viejas
        bubble.classList.remove('single', 'start-group', 'middle-group', 'end-group');
        // Aplicamos la clase correcta ahora que ya tiene vecinos en el DOM
        bubble.classList.add(getGroupClassFor(bubble));
    });
    // ==========================================================

    // --- LÓGICA DE SCROLL CORREGIDA ---
    if (shouldScroll) {
    const divider = elements.messagesContainer.querySelector('.unread-divider');
    if (divider) {
        divider.scrollIntoView({ behavior: 'auto', block: 'start' });
    } else {
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    }
} else {
        const newScrollHeight = elements.messagesContainer.scrollHeight;
        elements.messagesContainer.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
    }
}

    const fetchChatHistory = async () => {
        // 1. Crear y mostrar el cargador inmediatamente
        const loader = document.createElement('div');
        loader.className = 'chat-loading-screen';
        loader.innerHTML = `<div class="chat-spinner"></div><span style="font-size: 10px; opacity: 0.5;">Sincronizando...</span>`;
        elements.messagesContainer.parentElement.appendChild(loader);

        try {
            // Cargar caché (Se renderiza pero sigue invisible por CSS)
            const cached = ChatCache.get(loggedInUserId, otherUserId) || [];
            if (cached.length > 0) {
                renderMessagesList(cached, true);
            }

            // Carga real del servidor
            const [profileRes, historyRes] = await Promise.all([
                apiFetch(`/api/user/profile/${otherUserId}`),
                apiFetch(`/api/chat/history/${otherUserId}`)
            ]);
            // ==========================================================
            // === ¡ESTAS SON LAS LÍNEAS QUE TE FALTABAN! ===
            // ==========================================================
            if (profileRes.success && profileRes.data) {
                const partnerUser = profileRes.data;
                // Actualizamos el nombre y el avatar en la barra superior
                elements.userAvatar.src = getFullImageUrl(partnerUser.profile_pic_url);
                elements.userUsername.textContent = partnerUser.username;
            }
            // ==========================================================
            const serverMessages = historyRes.messages;

            // 3. IDENTIFICAR NO LEÍDOS
            const serverUnreads = serverMessages.filter(m => 
                String(m.sender_id) === String(otherUserId) && m.is_read === false
            );

            const lastCachedId = cached.length > 0 ? String(cached[cached.length - 1].message_id) : null;
            const lastServerId = serverMessages.length > 0 ? String(serverMessages[serverMessages.length - 1].message_id) : null;
            const hasDividerInUI = !!elements.messagesContainer.querySelector('.unread-divider');

            // --- LÓGICA DE RENDERIZADO ---
            if (serverUnreads.length > 0 && !hasDividerInUI) {
                // Si hay no leídos, renderizamos con scroll (el código de arriba nos llevará al divisor)
                renderMessagesList(serverMessages, true);
            } 
            else if (lastCachedId === lastServerId) {
                // Si el historial es idéntico, no hacemos nada que mueva el scroll
                if (serverMessages.length > cached.length) renderMessagesList(serverMessages, false);
            } else {
                // Si hay mensajes nuevos que nosotros enviamos u otros casos, al fondo
                renderMessagesList(serverMessages, true);
            }

            // ==========================================================
            // === ¡EL TRUCO: GUARDADO INTELIGENTE EN CACHÉ! ===
            // ==========================================================
            // Antes de guardar en la caché, marcamos todos los mensajes como leídos (true)
            // de forma virtual. Así, la próxima vez que entres, la caché NO dibujará la línea.
            const messagesToCache = serverMessages.map(m => ({
                ...m,
                is_read: true // Forzamos a que en el disco del móvil aparezcan como leídos
            }));

            ChatCache.set(loggedInUserId, otherUserId, messagesToCache);
            // ==========================================================

            // 4. Marcar lectura real en el servidor
            if (serverUnreads.length > 0) {
                apiFetch(`/api/chat/read-all/${otherUserId}`, { method: 'POST' });
            }

        // 2. ¡EL MOMENTO MÁGICO!: Una vez posicionados, mostramos el chat
        setTimeout(() => {
            // Quitamos el cargador
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 400);

            // Mostramos los mensajes con el fade-in de CSS
            elements.messagesContainer.classList.add('ready');
        }, 300); // 300ms es suficiente para ocultar cualquier salto de scroll

    } catch (e) {
        console.error(e);
        loader.remove();
        elements.messagesContainer.classList.add('ready');
    }
};

    // --- 5. INICIALIZACIÓN ---
    try {
        const { default: io } = await import('../../../libs/socket.io.esm.min.js');
        chatState.socket = io(API_BASE_URL.replace('/app', ''), { path: "/app/socket.io/" });
        chatState.roomName = [loggedInUserId, parseInt(otherUserId)].sort().join('-');
        
        chatState.socket.on('connect', () => {
            chatState.socket.emit('authenticate', localStorage.getItem('authToken'));
            chatState.socket.emit('join_room', chatState.roomName);
        });

        chatState.socket.on('receive_message', (msg) => {
            if (String(msg.sender_id) === String(otherUserId)) {
                const container = elements.messagesContainer;
                const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;

                appendMessage(msg, isAtBottom); // Solo hace scroll si ya estábamos abajo

                // SOLO si el botón existe y no estamos abajo, aumentar contador
        if (scrollBtn && !isAtBottom) {
            unreadScrollCount++;
            if (scrollBadge) {
                scrollBadge.innerText = unreadScrollCount;
                scrollBadge.style.display = 'flex';
            }
        }
                
                apiFetch(`/api/chat/read-all/${otherUserId}`, { method: 'POST' });
            }
        });
        // --- EVENTO: CONFIRMACIÓN DE ENVÍO ---
        chatState.socket.on('message_confirmed', ({ tempId, realMessage }) => {
            const tempEl = document.getElementById(`msg-${tempId}`);
            if (tempEl) {
                tempEl.id = `msg-${realMessage.message_id}`;
                tempEl.classList.remove('pending');
                
                // CAMBIAMOS EL RELOJ POR LA HORA REAL
                const ts = tempEl.querySelector('.message-timestamp');
                if (ts) {
                    ts.innerHTML = formatMessageTime(realMessage.created_at);
                }
                addToCache(realMessage);
            }
        });
        chatState.socket.on('message_deleted', ({ messageId }) => {
            console.log("🗑️ Socket: Mensaje eliminado por el otro usuario:", messageId);
            removeMessageFromDOM(messageId);
        });


        if (elements.chatForm) {
            elements.chatForm.onsubmit = (e) => {
                e.preventDefault();
                const content = elements.chatInput.value.trim();
                if (content) {
                    const tempId = `temp-${Date.now()}`; // <--- Generar ID temporal
                    const data = {
                        message_id: tempId, 
                        sender_id: loggedInUserId, 
                        receiver_id: otherUserId,
                        content, 
                        roomName: chatState.roomName, 
                        parent_message_id: chatState.currentReplyToId,
                        created_at: new Date().toISOString()
                    };
                    
                    // Usamos la función sendMessage para centralizar la lógica
                    sendMessage(data);
                    elements.chatInput.value = '';
                }
            };
        }
         if (elements.cancelReplyBtn) {
            elements.cancelReplyBtn.addEventListener('click', cancelReplyMode);
        }

        // Sticky Header
        elements.messagesContainer.onscroll = () => {
            const seps = Array.from(elements.messagesContainer.querySelectorAll('.date-separator'));
            let active = null;
            const top = elements.messagesContainer.getBoundingClientRect().top;
            seps.forEach(s => { if (s.getBoundingClientRect().top < top + 50) active = s.querySelector('span')?.textContent; });
            if (active && elements.stickyHeader) {
                elements.stickyHeaderText.textContent = active;
                elements.stickyHeader.classList.add('visible');
                clearTimeout(timerInterval);
                timerInterval = setTimeout(() => elements.stickyHeader.classList.remove('visible'), 1500);
            }
                    if (scrollBtn) { // <--- AGREGAR ESTA CONDICIÓN
                const container = elements.messagesContainer;
                const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

                if (isAtBottom) {
                    scrollBtn.classList.remove('visible');
                    setTimeout(() => { if(!scrollBtn.classList.contains('visible')) scrollBtn.style.display = 'none' }, 300);
                    unreadScrollCount = 0;
                    if (scrollBadge) scrollBadge.style.display = 'none';
                } else {
                    scrollBtn.style.display = 'flex';
                    setTimeout(() => scrollBtn.classList.add('visible'), 10);
                }
            }
        };



                await fetchChatHistory();

        // ESTA ES LA LÍNEA QUE CONECTA TODO
        return { 
            sendMessage 
        };

    } catch (e) { 
        console.error("Error init:", e); 
        return null; 
    }
}