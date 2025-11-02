// /js/floating_content.js

import { apiFetch, API_BASE_URL } from './modules/api.js';
import { getFullImageUrl, formatTimeAgo, formatMessageTime, formatDateSeparator } from './modules/utils.js';


// --- CREAMOS UN OBJETO "PUENTE" SIMULADO ---
const NativeBridge = {
    // Si `window.Android` existe, lo usamos. Si no, usamos `postMessage`.
    closeWindow: () => {
        if (window.Android) {
            Android.closeWindow();
        } else {
            window.parent.postMessage('closeWindow', '*');
        }
    },
    reopenWindow: () => {
        if (window.Android) {
            Android.reopenWindow();
        } else {
            location.reload(); // En el navegador, una recarga simple es suficiente
        }
    },
    requestWindowFocus: () => {
        if (window.Android) Android.requestWindowFocus();
    },
    releaseWindowFocus: () => {
        if (window.Android) Android.releaseWindowFocus();
    },
    jsReady: () => {
        if (window.Android) {
            Android.jsReady();
        } else {
            window.parent.postMessage('jsReady', '*');
        }
    },
    getAuthToken: async () => {
        if (window.Android) {
            return await Android.getAuthToken();
        } else {
            // Para depurar, usamos el token guardado en el localStorage de la app principal
            return localStorage.getItem('authToken');
        }
    }
};


// --- VARIABLES GLOBALES DEL MÓDULO ---
let socket;
let currentPackageName = null;
let loggedInUserId = null;
let currentReplyToId = null;
let contextMenuTarget = null;
let originalParent = null; // Para recordar dónde estaba la burbuja
let nextSibling = null; // Para recordar en qué posición reinsertarla
let activeClone = null; // NUEVA variable para guardar la referencia al clon

const appDataCache = new Map();

// ==========================================================
// === FUNCIONES DE RENDERIZADO Y LÓGICA DE UI
// ==========================================================

async function getAppData(packageName) {
    if (!packageName) return null;
    if (appDataCache.has(packageName)) return appDataCache.get(packageName);
    try {
        const data = await apiFetch(`/api/apps/${packageName}`);
        if (data.found) {
            const appData = { name: data.app.app_name, icon: data.app.icon_url };
            appDataCache.set(packageName, appData);
            return appData;
        } else {
            appDataCache.set(packageName, null);
            return null;
        }
    } catch (error) {
        console.error(`Error al obtener datos de la app desde nuestra API para ${packageName}:`, error);
        return null;
    }
}

function renderProfile(user) {
    const avatarEl = document.getElementById('user-avatar');
    const usernameEl = document.getElementById('user-username');
    if (avatarEl && usernameEl && user) {
        avatarEl.src = getFullImageUrl(user.profile_pic_url);
        usernameEl.textContent = user.username;
    }
}

async function renderFriends(friends, container) {
    if (!friends || friends.length === 0) {
        container.innerHTML = '<p class="friend-status" style="padding: 1rem; text-align: center;">Aún no tienes amigos.</p>';
        return;
    }

    const friendItemsHTML = await Promise.all(friends.map(async (friend) => {
        let statusText = 'Desconectado';
        let statusClass = 'offline';
        let statusIconHTML = '';

        if (friend.is_online) {
            if (friend.current_app && friend.current_app_package) {
                const appData = await getAppData(friend.current_app_package);
                if (appData) {
                    statusText = `Jugando a ${appData.name}`;
                    statusClass = 'playing';
                    statusIconHTML = `<img src="${appData.icon}" class="status-app-icon" alt="${appData.name}">`;
                } else {
                    statusText = `En ${friend.current_app}`;
                    statusClass = 'playing';
                }
            } else {
                statusText = 'En línea';
                statusClass = 'online';
            }
        }
        
        return `
            <div class="friend-item" data-user-id="${friend.id}">
                <div class="friend-avatar-container">
                    <img src="${getFullImageUrl(friend.profile_pic_url)}" class="friend-avatar" alt="Avatar de ${friend.username}">
                    <div class="status-dot ${statusClass}">${statusIconHTML}</div>
                </div>
                <div class="friend-info">
                    <div class="friend-username">${friend.username}</div>
                    <div class="friend-status">${statusText}</div>
                </div>
            </div>`;
    }));

    container.innerHTML = friendItemsHTML.join('');
};

async function updateFriendStatusInUI(data) {
    // Reutilizamos la misma lógica de `friendsSidebar.js`
    const { userId, isOnline, currentApp, currentAppPackage, currentAppIcon } = data;
    const friendItem = document.querySelector(`.friend-item[data-user-id="${userId}"]`);
    if (!friendItem) return;

    const statusDot = friendItem.querySelector('.status-dot');
    const statusText = friendItem.querySelector('.friend-status');

    let newStatusText = 'Desconectado';
    let newStatusClass = 'offline';
    let newStatusIconHTML = '';

    if (isOnline) {
        if (currentApp && currentAppPackage) {
            const appName = currentApp;
            const appIcon = currentAppIcon ? getFullImageUrl(currentAppIcon) : (await getAppData(currentAppPackage))?.icon;
            newStatusText = `Jugando a ${appName}`;
            newStatusClass = 'playing';
            if (appIcon) {
                newStatusIconHTML = `<img src="${appIcon}" class="status-app-icon" alt="${appName}">`;
            }
        } else {
            newStatusText = 'En línea';
            newStatusClass = 'online';
        }
    }
    
    statusDot.className = `status-dot ${newStatusClass}`;
    statusDot.innerHTML = newStatusIconHTML;
    statusText.textContent = newStatusText;
};
async function updateGameStatus({ appName, packageName }) {
    const gameInfoSection = document.getElementById('game-info');
    const gameNameEl = document.getElementById('game-name');
    const gameIconEl = document.getElementById('game-icon');
    const registerSection = document.getElementById('registration-section');
    const titleEl = gameInfoSection.querySelector('.section-title');

    if (!gameNameEl || !gameIconEl || !registerSection || !titleEl) return;

    currentPackageName = packageName;
    const appData = await getAppData(packageName);

    if (appData && appData.name) {
        // CASO 1: App conocida
        titleEl.textContent = "Jugando ahora:";
        gameNameEl.textContent = appData.name;
        gameIconEl.src = getFullImageUrl(appData.icon) || '';
        gameIconEl.style.display = 'block';
        registerSection.style.display = 'none';
        gameInfoSection.style.display = 'block';
    } else if (packageName) {
        // CASO 2: App desconocida -> Se muestra el formulario por defecto
        titleEl.textContent = "Juego no registrado:";
        gameNameEl.textContent = packageName;
        gameIconEl.style.display = 'none';
        registerSection.style.display = 'block';
        gameInfoSection.style.display = 'block';
    } else {
        // CASO 3: Sin app detectada
        gameInfoSection.style.display = 'none'; // Ocultamos toda la sección
    }
}
const renderChatList = (conversations, container) => {
    if (!conversations || conversations.length === 0) {
        container.innerHTML = '<p class="friend-status" style="padding: 1rem; text-align: center;">No tienes chats recientes.</p>';
        return;
    }
    
    // Reutilizamos la lógica de la página `chat_list.js`
    container.innerHTML = conversations.map(convo => {
        const snippet = convo.last_message_content.length > 25 ? convo.last_message_content.substring(0, 25) + '...' : convo.last_message_content;
        return `
            <div class="chat-list-item" data-user-id="${convo.user_id}">
                <img src="${getFullImageUrl(convo.profile_pic_url)}" class="chat-list-avatar">
                <div class="chat-list-content">
                    <div class="chat-list-header">
                        <span class="chat-list-username">${convo.username}</span>
                        <span class="chat-list-time">${formatTimeAgo(convo.last_message_at)}</span>
                    </div>
                    <p class="chat-list-snippet">${snippet}</p>
                </div>
            </div>`;
    }).join('');
};

function applyThemeUpdate(theme) {
    console.log("FLOATING: Aplicando actualización de tema completa:", theme);
    const root = document.documentElement;
    if (theme.bgColor) root.style.setProperty('--color-bg', theme.bgColor);
    if (theme.textColor) root.style.setProperty('--color-text', theme.textColor);
    if (theme.secondaryTextColor) root.style.setProperty('--text-secondary-color', theme.secondaryTextColor);
    if (theme.surfaceColor) root.style.setProperty('--color-surface', theme.surfaceColor);
    if (theme.accentColor) root.style.setProperty('--color-accent', theme.accentColor);
    
    // --- ¡AÑADE ESTAS DOS LÍNEAS QUE FALTABAN! ---
    if (theme.uiColor) root.style.setProperty('--color-ui', theme.uiColor);
    if (theme.borderColor) root.style.setProperty('--color-border', theme.borderColor);
}

function getGroupClassFor(messageEl) {
    const timeThreshold = 60;
    const senderId = messageEl.dataset.senderId;
    const timestamp = new Date(messageEl.dataset.timestamp);
    let prevMessageEl = messageEl.previousElementSibling;
    while (prevMessageEl && !prevMessageEl.classList.contains('message-bubble')) {
        prevMessageEl = prevMessageEl.previousElementSibling;
    }
    const isStartOfGroup = !prevMessageEl || prevMessageEl.dataset.senderId !== senderId || (timestamp - new Date(prevMessageEl.dataset.timestamp)) / 1000 > timeThreshold;
    let nextMessageEl = messageEl.nextElementSibling;
    while (nextMessageEl && !nextMessageEl.classList.contains('message-bubble')) {
        nextMessageEl = nextMessageEl.nextElementSibling;
    }
    const isEndOfGroup = !nextMessageEl || nextMessageEl.dataset.senderId !== senderId || (new Date(nextMessageEl.dataset.timestamp) - timestamp) / 1000 > timeThreshold;
    if (isStartOfGroup && isEndOfGroup) return 'single';
    if (isStartOfGroup) return 'start-group';
    if (isEndOfGroup) return 'end-group';
    return 'middle-group';
}


function enterReplyMode(messageId, username, content) {
    currentReplyToId = messageId;
    document.getElementById('reply-to-user').textContent = username;
    document.getElementById('reply-snippet').textContent = content;
    document.getElementById('reply-context-bar').style.display = 'flex';
    document.getElementById('chat-message-input').focus();
}

function cancelReplyMode() {
    currentReplyToId = null;
    document.getElementById('reply-context-bar').style.display = 'none';
}

function scrollToMessage(messageId) {
    const targetMessage = document.getElementById(messageId);
    if (targetMessage) {
        targetMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetMessage.classList.add('highlighted');
        setTimeout(() => targetMessage.classList.remove('highlighted'), 1500);
    } else {
        console.error(`❌ SCROLL: No se pudo encontrar el elemento con el ID: "${messageId}"`);
    }
}

function copyMessageText(messageElement) {
    const textToCopy = messageElement.querySelector('p').textContent;
    navigator.clipboard.writeText(textToCopy).catch(err => console.error('Error al copiar:', err));
}

/**
 * Muestra un modal de confirmación y llama a la API para eliminar un mensaje.
 * @param {string} messageId - El ID del mensaje a eliminar.
 */
async function deleteMessage(messageId) {
    // 1. Obtener referencias a los elementos del modal
    const modal = document.getElementById('delete-confirm-modal');
    const cancelBtn = document.getElementById('cancel-delete-btn');
    const confirmBtn = document.getElementById('confirm-delete-btn');

    if (!modal || !cancelBtn || !confirmBtn) return;

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
            // La UI se actualizará vía el evento de socket 'message_deleted'
        } catch (error) {
            alert(`Error al eliminar el mensaje: ${error.message}`);
        }
    }
}
/**
 * Abre el menú contextual para una burbuja de mensaje específica.
 * Mueve temporalmente el elemento al body para asegurar un apilamiento z-index correcto
 * y evitar que sea afectado por el filtro de desenfoque del overlay.
 * @param {HTMLElement} messageElement - La burbuja de mensaje que fue presionada.
 */
function openContextMenu(messageElement) {
    if (!messageElement) return;

    // --- LÓGICA DE CLONACIÓN ---
    activeClone = messageElement.cloneNode(true);
    const rect = messageElement.getBoundingClientRect();
    originalParent = messageElement.parentElement;
    nextSibling = messageElement.nextElementSibling;
    
    activeClone.style.position = 'fixed';
    activeClone.style.top = `${rect.top}px`;
    activeClone.style.left = `auto`;
    activeClone.style.width = `auto`;
    activeClone.style.height = `auto`;
    
    // Añadimos la clase activa al clon y lo añadimos al body
    activeClone.classList.add('context-active');
    document.body.appendChild(activeClone);

    // Ocultamos la burbuja original
    messageElement.classList.add('context-hidden');

    // --- LÓGICA DE MENÚ Y OVERLAY ---
    const overlay = document.getElementById('context-menu-overlay');
    const menu = document.getElementById('context-menu');
    const replyBtn = document.getElementById('reply-from-menu-btn');
    const copyBtn = document.getElementById('copy-btn');
    const deleteBtn = document.getElementById('delete-from-menu-btn');
    
    contextMenuTarget = messageElement; // Guardamos el original
    
    deleteBtn.style.display = messageElement.classList.contains('sent') ? 'flex' : 'none';
    overlay.classList.add('visible');

    // Posicionar el menú (lógica sin cambios)
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

    // --- ASIGNACIÓN DE EVENTOS DE CIERRE ---
    replyBtn.onclick = () => {
        const username = messageElement.classList.contains('sent') ? 'Tú' : document.getElementById('chat-partner-username').textContent;
        const content = messageElement.querySelector('p').textContent;
        enterReplyMode(messageElement.id.replace('msg-', ''), username, content);
        closeContextMenu(); // Llamada a la función de cierre
    };
    copyBtn.onclick = () => {
        copyMessageText(messageElement);
        closeContextMenu(); // Llamada a la función de cierre
    };
    deleteBtn.onclick = () => {
        deleteMessage(messageElement.id.replace('msg-', ''));
        closeContextMenu(); // Llamada a la función de cierre
    };
    overlay.onclick = closeContextMenu; // Llamada a la función de cierre
}

/**
 * Cierra el menú contextual, elimina el clon y restaura la visibilidad del mensaje original.
 */
function closeContextMenu() {
    const overlay = document.getElementById('context-menu-overlay');
    const menu = document.getElementById('context-menu');
    
    // 1. Ocultar el overlay y el menú
    overlay.classList.remove('visible');
    menu.classList.remove('visible');

    // 2. Si hay un clon activo, eliminarlo del DOM.
    if (activeClone) {
        activeClone.remove();
        activeClone = null;
    }
    
    // 3. Si hay una burbuja original oculta (guardada en contextMenuTarget),
    //    quitar la clase 'context-hidden' para que vuelva a ser visible.
    if (contextMenuTarget) {
        contextMenuTarget.classList.remove('context-hidden');
    }
    
    // 4. Limpiar las variables de estado.
    contextMenuTarget = null;
    originalParent = null;
    nextSibling = null;
}
function addSwipeToReplyHandlers(messageElement) {
    let startX = 0, deltaX = 0, longPressTimer;
    const swipeThreshold = 60;

    messageElement.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        deltaX = 0;
        messageElement.style.transition = 'transform 0.1s ease-out';
        longPressTimer = setTimeout(() => {
            e.preventDefault(); 
            openContextMenu(messageElement);
        }, 500);
    }, { passive: false });

    messageElement.addEventListener('touchmove', (e) => {
        clearTimeout(longPressTimer);
        deltaX = e.touches[0].clientX - startX;
        if (deltaX > 0) {
            const pullDistance = Math.min(deltaX, swipeThreshold + 30);
            messageElement.style.transform = `translateX(${pullDistance}px)`;
        }
    }, { passive: true });

    messageElement.addEventListener('touchend', () => {
        clearTimeout(longPressTimer);
        messageElement.style.transition = 'transform 0.3s ease-out';
        if (deltaX > swipeThreshold) {
            const messageId = messageElement.id.replace('msg-', '');
            const isSent = messageElement.classList.contains('sent');
            const username = isSent ? "Tú" : document.getElementById('chat-partner-username').textContent;
            const content = messageElement.querySelector('p').textContent;
            enterReplyMode(messageId, username, content);
            messageElement.style.transform = `translateX(40px)`;
            setTimeout(() => { messageElement.style.transform = 'translateX(0)'; }, 150);
        } else {
            messageElement.style.transform = 'translateX(0)';
        }
    });
}

function appendMessage(message, container) {
    if (!loggedInUserId) return;
    const lastMessageEl = container.querySelector('.message-bubble:last-child');
    const messageDiv = document.createElement('div');
    const isSent = message.sender_id === loggedInUserId;
    
    const messageId = message.message_id || 'temp-' + Date.now();
    const createdAt = message.created_at || new Date().toISOString();

    messageDiv.id = `msg-${messageId}`;
    messageDiv.className = `message-bubble ${isSent ? 'sent' : 'received'}`;
    messageDiv.dataset.senderId = message.sender_id;
    messageDiv.dataset.timestamp = createdAt;

    // --- LÓGICA DE SNIPPET DE RESPUESTA (SIN CAMBIOS) ---
    if (message.parent_message_id) {
        let parentUsername = message.parent_username;
        let parentContent = message.parent_content;
        if (isSent && !parentContent) {
            const parentMessageEl = document.getElementById(`msg-${message.parent_message_id}`);
            if (parentMessageEl) {
                parentContent = parentMessageEl.querySelector('p').textContent;
                parentUsername = parentMessageEl.classList.contains('sent') 
                    ? 'Tú' 
                    : document.getElementById('chat-partner-username').textContent;
            }
        }
         if (parentContent) {
            const repliedSnippetLink = document.createElement('a');
            repliedSnippetLink.className = 'replied-to-snippet';
            repliedSnippetLink.href = '#';

            // --- LOG #1 ---
            const targetId = `msg-${message.parent_message_id}`;
            console.log(`RENDER: Creando snippet clicable que apuntará a ID: "${targetId}"`);

            repliedSnippetLink.onclick = (e) => { 
                e.preventDefault(); 
                // --- LOG #2 ---
                console.log(`🔵 CLICK: Se ha hecho clic en el snippet. Llamando a scrollToMessage con ID: "${targetId}"`);
                scrollToMessage(targetId); 
            };
            repliedSnippetLink.innerHTML = `<span class="replied-user">${parentUsername || 'Usuario'}</span><span class="replied-text">${parentContent}</span>`;
            messageDiv.appendChild(repliedSnippetLink);
        }
    }
    
    
    // ==========================================================
    // === ¡AQUÍ ESTÁ LA NUEVA ESTRUCTURA PARA EL CONTENIDO! ===
    // ==========================================================
    // Creamos el contenedor para el texto y la hora
    const mainContentWrapper = document.createElement('div');
    mainContentWrapper.className = 'message-main-content';
    const contentP = document.createElement('p');
    contentP.textContent = message.content;
    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'message-timestamp';
    
    // Esta línea ahora funcionará porque `formatMessageTime` está importada.
    timestampSpan.innerHTML = String(messageId).startsWith('temp-') ? '🕒' : formatMessageTime(createdAt);
    
    mainContentWrapper.appendChild(contentP);
    mainContentWrapper.appendChild(timestampSpan);
    messageDiv.appendChild(mainContentWrapper);
    
    container.appendChild(messageDiv);
    
    if (lastMessageEl) {
        lastMessageEl.className = lastMessageEl.className.replace(/single|start-group|middle-group|end-group/g, '').trim() + ' ' + getGroupClassFor(lastMessageEl);
    }
    messageDiv.classList.add(getGroupClassFor(messageDiv));
    addSwipeToReplyHandlers(messageDiv);
    container.scrollTop = container.scrollHeight;
}

/**
 * Renderiza una lista completa de mensajes, incluyendo los separadores de fecha.
 * @param {Array} messages - La lista de mensajes del historial.
 * @param {HTMLElement} container - El elemento DOM donde se renderizará el chat.
 */
function renderMessages(messages, container) {
    container.innerHTML = '';
    if (!loggedInUserId) return;

    let lastDate = null; // Variable para rastrear el último día renderizado

    messages.forEach(msg => {
        const messageDate = new Date(msg.created_at).toDateString();

        // Si el día del mensaje actual es diferente al del mensaje anterior...
        if (messageDate !== lastDate) {
            // ...creamos e insertamos un separador de fecha.
            const separator = document.createElement('div');
            separator.className = 'date-separator';
            // Usamos la función de formato para obtener el texto "Hoy", "Ayer", etc.
            separator.innerHTML = `<span>${formatDateSeparator(msg.created_at)}</span>`;
            container.appendChild(separator);
            
            // Actualizamos la última fecha vista.
            lastDate = messageDate;
        }
        
        // Renderizamos la burbuja del mensaje como siempre.
        appendMessage(msg, container);
    });
    
    container.scrollTop = container.scrollHeight;
}
// ==========================================================
// === LÓGICA PRINCIPAL DE INICIALIZACIÓN
// ==========================================================
document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. REFERENCIAS A ELEMENTOS DEL DOM ---
    const closeBtn = document.getElementById('close-button');
    const registerBtn = document.getElementById('register-btn');
    const mainViewHeader = document.querySelector('body > header');
    const mainViewContent = document.querySelector('body > main');
    const chatView = document.getElementById('chat-view');
    const backToMainViewBtn = document.getElementById('back-to-main-view-btn');
    const chatPartnerAvatar = document.getElementById('chat-partner-avatar');
    const chatPartnerUsername = document.getElementById('chat-partner-username');
    const messagesContainer = document.getElementById('chat-messages-container');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-message-input');
    const tabs = document.querySelectorAll('.nav-tab');
    const pages = document.querySelectorAll('.page-content');
    const chatListContainer = document.getElementById('chat-list-container');
    const cancelReplyButton = document.getElementById('cancel-reply-btn');
    let currentChatPartnerId = null;
    let currentRoomName = null;

    // --- 2. PUENTE DE COMUNICACIÓN (NATIVO O SIMULADO) ---
    const NativeBridge = {
        closeWindow: () => {
            if (window.Android) Android.closeWindow();
            else window.parent.postMessage('closeWindow', '*');
        },
        reopenWindow: () => {
            if (window.Android) Android.reopenWindow();
            else location.reload();
        },
        requestWindowFocus: () => {
            if (window.Android) Android.requestWindowFocus();
            else console.log("DEBUG: Solicitando foco (simulado).");
        },
        releaseWindowFocus: () => {
            if (window.Android) Android.releaseWindowFocus();
            else console.log("DEBUG: Liberando foco (simulado).");
        },
        jsReady: () => {
            if (window.Android) Android.jsReady();
            else window.parent.postMessage('jsReady', '*');
        },
        getAuthToken: async () => {
            if (window.Android) {
                return await Android.getAuthToken();
            } else {
                // Para depurar, intentamos obtenerlo del localStorage del dominio padre.
                // Esto requiere que hayas iniciado sesión en la app principal en otra pestaña.
                // Si no, usa un token de prueba.
                return localStorage.getItem('authToken') || "tu_token_de_prueba_para_debug";
            }
        }
    };



    // --- 3. FUNCIONES GLOBALES Y LISTENERS INICIALES ---
        // --- FUNCIONES GLOBALES Y LISTENERS ---
    window.updateGameInfo = (gameData) => updateGameStatus(gameData);
    window.applyThemeUpdate = applyThemeUpdate;
    if (closeBtn) closeBtn.addEventListener('click', () => NativeBridge.closeWindow());
    
    // --- NUEVO LISTENER PARA EL SIMULADOR ---
    window.addEventListener('message', (event) => {
        // Solo aceptamos mensajes del contenedor padre (debug_overlay.html)
        if (event.source !== window.parent) return;

        const { type, data } = event.data;
        if (type === 'updateGameInfo' && window.updateGameInfo) {
            window.updateGameInfo(data);
        } 
        // ¡LÍNEA CLAVE! Escuchamos el evento de tema
        else if (type === 'applyThemeUpdate' && window.applyThemeUpdate) {
            window.applyThemeUpdate(data);
        }
    });

    // --- 4. FUNCIONES DE GESTIÓN DE VISTAS ---
    async function openChatView(userId, username, avatarUrl) {
        mainViewHeader.style.display = 'none';
        mainViewContent.style.display = 'none';
        chatView.style.display = 'flex';
        chatView.dataset.activeChatUserId = userId;
        currentChatPartnerId = userId;
        currentRoomName = [loggedInUserId, parseInt(userId)].sort().join('-');
        if (socket) socket.emit('join_room', currentRoomName);
        NativeBridge.requestWindowFocus();
        chatPartnerAvatar.src = avatarUrl;
        chatPartnerUsername.textContent = username;
        messagesContainer.innerHTML = '<p style="text-align:center; color: var(--text-secondary-color);">Cargando mensajes...</p>';
        try {
            const historyResponse = await apiFetch(`/api/chat/history/${userId}`);
            if (historyResponse.success) renderMessages(historyResponse.messages, messagesContainer);
        } catch (e) {
            messagesContainer.innerHTML = `<p style="color:red;">${e.message}</p>`;
        }
    }
    function closeChatView() {
        chatView.style.display = 'none';
        mainViewHeader.style.display = 'flex';
        mainViewContent.style.display = 'block';
        chatView.dataset.activeChatUserId = '';
        currentChatPartnerId = null;
        currentRoomName = null;
        cancelReplyMode();
        NativeBridge.releaseWindowFocus();
    }

    // --- 5. INICIALIZACIÓN PRINCIPAL ---
    try {
        const token = await NativeBridge.getAuthToken();
        if (!token) throw new Error("Error de Autenticación");
        localStorage.setItem('authToken', token);

        const userResponse = await apiFetch('/api/user/me');
        if (!userResponse.success) throw new Error("No se pudieron obtener los datos del usuario.");
        loggedInUserId = userResponse.data.userId;
        renderProfile(userResponse.data);

        const friendsContainer = document.getElementById('friends-container');
        const friendsResponse = await apiFetch('/api/user/friends');
        if (friendsResponse.success) await renderFriends(friendsResponse.friends, friendsContainer);
        
        const { default: io } = await import('https://cdn.socket.io/4.7.5/socket.io.esm.min.js');
        socket = io(API_BASE_URL.replace('/app', ''), { path: "/app/socket.io/" });
        
        socket.on('connect', () => socket.emit('authenticate', token));
        socket.on('friend_status_update', (data) => updateFriendStatusInUI(data));

        socket.on('receive_message', (message) => {
            if (message.sender_id === loggedInUserId) return; // Ignorar ecos
            const activeChatUserId = chatView.dataset.activeChatUserId;
            if (chatView.style.display === 'flex' && String(message.sender_id) === activeChatUserId) {
                appendMessage(message, messagesContainer);
            }
        });

        // ==========================================================
        // === ¡AQUÍ ESTÁ EL LISTENER QUE FALTABA! ===
        // ==========================================================
        socket.on('message_confirmed', ({ tempId, realMessage }) => {
        console.log(`FLOATING: Confirmación recibida. Actualizando ID temporal ${tempId} a ${realMessage.message_id}`);
        const tempBubble = document.getElementById(`msg-${tempId}`);
        if (tempBubble) {
            tempBubble.id = `msg-${realMessage.message_id}`;
            
            // --- ¡LÍNEA AÑADIDA! ---
            // Buscamos el span del timestamp y actualizamos el reloj por la hora real.
            const timestampSpan = tempBubble.querySelector('.message-timestamp');
            if (timestampSpan) {
                timestampSpan.innerHTML = formatMessageTime(realMessage.created_at);
            }
        }
    });
        // ==========================================================

        // ==========================================================
        // === ¡AÑADIMOS EL LISTENER PARA MENSAJES ELIMINADOS! ===
        // ==========================================================
        socket.on('message_deleted', ({ messageId }) => {
        console.log(`FLOATING: Recibido evento para eliminar mensaje ID: ${messageId}`);
        const messageElement = document.getElementById(`msg-${messageId}`);
        if (messageElement) {
            // --- ¡NUEVA LÓGICA! Obtenemos referencias a los vecinos ANTES de eliminar ---
            let prevMessageEl = messageElement.previousElementSibling;
            while (prevMessageEl && !prevMessageEl.classList.contains('message-bubble')) {
                prevMessageEl = prevMessageEl.previousElementSibling;
            }
            let nextMessageEl = messageElement.nextElementSibling;
            while (nextMessageEl && !nextMessageEl.classList.contains('message-bubble')) {
                nextMessageEl = nextMessageEl.nextElementSibling;
            }

            // Animación de eliminación (sin cambios)
            messageElement.style.transition = 'opacity 0.3s, transform 0.3s, height 0.3s, margin 0.3s';
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'scale(0.8)';
            messageElement.style.marginTop = '0';
            messageElement.style.marginBottom = `-${messageElement.offsetHeight}px`;
            
            setTimeout(() => {
                messageElement.remove();

                // --- ¡NUEVA LÓGICA! Recalculamos las clases de los vecinos DESPUÉS de eliminar ---
                if (prevMessageEl) {
                    prevMessageEl.className = prevMessageEl.className.replace(/single|start-group|middle-group|end-group/g, '').trim();
                    prevMessageEl.classList.add(getGroupClassFor(prevMessageEl));
                }
                if (nextMessageEl) {
                    nextMessageEl.className = nextMessageEl.className.replace(/single|start-group|middle-group|end-group/g, '').trim();
                    nextMessageEl.classList.add(getGroupClassFor(nextMessageEl));
                }
            }, 300);
        }
    });
        // ==========================================================


        // --- LISTENERS DE EVENTOS DE LA UI ---
        tabs.forEach(tab => {
            tab.addEventListener('click', async () => {
                const tabName = tab.dataset.tab;
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                pages.forEach(p => p.style.display = 'none');
                const activePage = document.getElementById(`${tabName}-content`);
                if (activePage) activePage.style.display = 'block';

                if (tabName === 'chats' && !activePage.dataset.loaded) {
                    chatListContainer.innerHTML = '<p class="friend-status" style="padding: 1rem; text-align: center;">Cargando chats...</p>';
                    try {
                        const chatResponse = await apiFetch('/api/chat/conversations');
                        if (chatResponse.success) {
                            renderChatList(chatResponse.conversations, chatListContainer);
                            activePage.dataset.loaded = 'true';
                        }
                    } catch (error) {
                        chatListContainer.innerHTML = `<p class="friend-status" style="color: red;">${error.message}</p>`;
                    }
                }
            });
        });
        chatListContainer.addEventListener('click', (e) => {
            const chatItem = e.target.closest('.chat-list-item');
            if (chatItem) {
                const userId = chatItem.dataset.userId;
                const username = chatItem.querySelector('.chat-list-username').textContent;
                const avatarUrl = chatItem.querySelector('.chat-list-avatar').src;
                openChatView(userId, username, avatarUrl);
            }
        });
        backToMainViewBtn.addEventListener('click', closeChatView);
        cancelReplyButton.addEventListener('click', cancelReplyMode);

        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const content = chatInput.value.trim();
            if (content && socket && currentChatPartnerId) {
                const tempId = `temp-${Date.now()}`;
                const messageData = { 
                    message_id: tempId,
                    sender_id: loggedInUserId, 
                    receiver_id: currentChatPartnerId, 
                    content: content,
                    parent_message_id: currentReplyToId,
                    roomName: currentRoomName 
                };
                socket.emit('send_message', messageData);
                appendMessage(messageData, messagesContainer); 
                chatInput.value = '';
                cancelReplyMode();
            }
        });

        registerBtn.addEventListener('click', () => {
            const newAppName = prompt(`Dale un nombre a la aplicación:\n${currentPackageName}`);
            if (newAppName && newAppName.trim() !== '') {
                const appData = { packageName: currentPackageName, appName: newAppName };
                apiFetch('/api/apps/add', {
                    method: 'POST',
                    body: JSON.stringify(appData),
                }).then(response => {
                    if (response.success) {
                        NativeBridge.reopenWindow();
                    }
                }).catch(error => alert(`Error: ${error.message}`));
            }
        });


         // ==========================================================
        // === ¡NUEVA LÓGICA PARA EL HEADER DE FECHA PEGAJOSO! ===
        // ==========================================================
        const messagesContainer = document.getElementById('chat-messages-container');
        const stickyHeader = document.getElementById('sticky-date-header');
        const stickyHeaderText = stickyHeader.querySelector('span');
        let hideHeaderTimeout;

        messagesContainer.addEventListener('scroll', () => {
            const dateSeparators = Array.from(messagesContainer.querySelectorAll('.date-separator'));
            if (dateSeparators.length === 0) return;

            let activeSeparatorText = null;
            const containerTop = messagesContainer.getBoundingClientRect().top;

            // Buscamos el último separador de fecha que ha pasado por encima
            // del borde superior del contenedor de mensajes.
            for (let i = dateSeparators.length - 1; i >= 0; i--) {
                const separator = dateSeparators[i];
                if (separator.getBoundingClientRect().top < containerTop) {
                    activeSeparatorText = separator.querySelector('span').textContent;
                    break; // Encontramos el correcto, salimos del bucle.
                }
            }

            // Actualizamos la visibilidad y el texto del header pegajoso.
            if (activeSeparatorText) {
                stickyHeaderText.textContent = activeSeparatorText;
                stickyHeader.classList.add('visible');
            } else {
                // Si no hay ningún separador por encima, ocultamos el header.
                stickyHeader.classList.remove('visible');
            }

            // Opcional: Ocultar el header si el usuario deja de hacer scroll.
            clearTimeout(hideHeaderTimeout);
            hideHeaderTimeout = setTimeout(() => {
                stickyHeader.classList.remove('visible');
            }, 1500); // Se oculta después de 1.5 segundos de inactividad.
        });
        // ==========================================================
    } catch (error) {
        document.body.innerHTML = `<h1 style="color:white; text-align:center; padding: 20px;">${error.message}</h1>`;
    }
    
    // Avisar al contenedor (nativo o simulado) que el JS ha terminado de cargarse.
    NativeBridge.jsReady();
});