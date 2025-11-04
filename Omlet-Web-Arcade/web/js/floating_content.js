// /js/floating_content.js

import { apiFetch, API_BASE_URL } from './modules/api.js';
import { getFullImageUrl, formatTimeAgo } from './modules/utils.js';
import { initChatController } from './modules/controllers/chatController.js'; // <-- ¡IMPORTAMOS EL CONTROLADOR!


// --- VARIABLES GLOBALES DEL MÓDULO ---
let loggedInUserId = null;
let currentPackageName = null;
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

const renderFriends = async (friends, container) => {
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
const updateFriendStatusInUI = async (data) => {
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
async function updateGameStatus({ appName, packageName })  {
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

// ==========================================================
// === LÓGICA PRINCIPAL DE INICIALIZACIÓN
// ==========================================================
document.addEventListener('DOMContentLoaded', async () => {
    // --- REFERENCIAS AL DOM ---
    const closeBtn = document.getElementById('close-button');
    const registerBtn = document.getElementById('register-btn');
    const mainViewHeader = document.querySelector('body > header');
    const mainViewContent = document.querySelector('body > main');
    const chatView = document.getElementById('chat-view');
    const backToMainViewBtn = document.getElementById('back-to-main-view-btn');
    const tabs = document.querySelectorAll('.nav-tab');
    const pages = document.querySelectorAll('.page-content');
    const chatListContainer = document.getElementById('chat-list-container');
    let socket; // La instancia del socket ahora es local a esta inicialización.

    // --- PUENTE DE COMUNICACIÓN ---
    // --- ¡PUENTE DE COMUNICACIÓN SIMULADO RESTAURADO! ---
    const NativeBridge = {
        closeWindow: () => {
            // Antes de cerrar, nos aseguramos de liberar el foco.
            NativeBridge.releaseWindowFocus();
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
            if (window.Android) {
                Android.jsReady();
            } else {
                // Avisa a la página contenedora (debug_overlay.html) que el JS está listo
                window.parent.postMessage('jsReady', '*');
            }
        },
        getAuthToken: async () => {
            if (window.Android) {
                return await Android.getAuthToken();
            } else {
                // Para depurar, intentamos obtenerlo del localStorage del dominio principal.
                // Asegúrate de haber iniciado sesión en la app (http://localhost:8080) en otra pestaña primero.
                return localStorage.getItem('authToken');
            }
        }
    };
    window.updateGameInfo = updateGameStatus;
    window.applyThemeUpdate = applyThemeUpdate;
    if (closeBtn) closeBtn.addEventListener('click', () => NativeBridge.closeWindow());
    NativeBridge.jsReady();

    // --- FUNCIONES DE GESTIÓN DE VISTAS ---
    async function openChatView(userId, username, avatarUrl) {
        mainViewHeader.style.display = 'none';
        mainViewContent.style.display = 'none';
        chatView.style.display = 'flex';
        
        NativeBridge.requestWindowFocus();

        // 1. Recopilamos los elementos del DOM de la VISTA DE CHAT FLOTANTE
         const domElements = {
            // Contenedores principales
            messagesContainer: document.getElementById('chat-messages-container'),
            
            // Elementos del header
            userAvatar: document.getElementById('chat-partner-avatar'),
            userUsername: document.getElementById('chat-partner-username'),
            
            // Formulario de envío
            chatForm: document.getElementById('chat-form'),
            chatInput: document.getElementById('chat-message-input'),
            
            // Elementos de la barra de respuesta (¡LOS QUE FALTABAN!)
            replyContextBar: document.getElementById('reply-context-bar'),
            replyToUser: document.getElementById('reply-to-user'),
            replySnippet: document.getElementById('reply-snippet'),
            cancelReplyBtn: document.getElementById('cancel-reply-btn'),
            
            // Elementos del menú contextual
            contextMenuOverlay: document.getElementById('context-menu-overlay'),
            contextMenu: document.getElementById('context-menu'),
            replyFromMenuBtn: document.getElementById('reply-from-menu-btn'),
            copyBtn: document.getElementById('copy-btn'),
            deleteBtn: document.getElementById('delete-from-menu-btn'),
            
            // Elementos del header de fecha pegajoso
            stickyHeader: document.getElementById('sticky-date-header'),
            stickyHeaderText: document.getElementById('sticky-date-header')?.querySelector('span'),
            // --- ¡AÑADE ESTAS LÍNEAS! ---
            deleteConfirmModal: document.getElementById('delete-confirm-modal'),
            cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
            confirmDeleteBtn: document.getElementById('confirm-delete-btn')
        };
        // ==========================================================

        // Rellenamos el header manualmente antes de pasar el control
        domElements.userAvatar.src = avatarUrl;
        domElements.userUsername.textContent = username;

        // Pasamos el objeto de elementos completo al controlador.
        await initChatController(domElements, userId, loggedInUserId);
    }
    
    function closeChatView() {
        chatView.style.display = 'none';
        mainViewHeader.style.display = 'flex';
        mainViewContent.style.display = 'block';
        NativeBridge.releaseWindowFocus();
        // Opcional: Podríamos tener una función "destroy" en el controlador para limpiar listeners
    }

    // --- ¡LISTENER PARA EL SIMULADOR RESTAURADO! ---
    // Escucha los mensajes que le envía la página contenedora (debug_overlay.html)
    window.addEventListener('message', (event) => {
        if (event.source !== window.parent) return; // Seguridad: solo aceptar mensajes del padre

        const { type, data } = event.data;
        if (type === 'updateGameInfo' && window.updateGameInfo) {
            console.log("DEBUG: Recibido 'updateGameInfo' del simulador.", data);
            window.updateGameInfo(data);
        } 
        else if (type === 'applyThemeUpdate' && window.applyThemeUpdate) {
            console.log("DEBUG: Recibido 'applyThemeUpdate' del simulador.", data);
            window.applyThemeUpdate(data);
        }
    });
    // --- INICIALIZACIÓN PRINCIPAL ---
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
        // Ya no necesitamos el listener 'receive_message' aquí, el controlador lo manejará.

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
                    chatListContainer.innerHTML = '<p class="friend-status" style="text-align: center;">Cargando chats...</p>';
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
        registerBtn.addEventListener('click', () => {
            // --- ¡LÍNEA CLAVE AÑADIDA! ---
            // Antes de mostrar el input, le pedimos al sistema nativo que le dé el foco a nuestra ventana.
            NativeBridge.requestWindowFocus();

            const registerSection = document.getElementById('registration-section');
            if (!registerSection) return;

            registerSection.innerHTML = '';
            const appNameInput = document.createElement('input');
            appNameInput.type = 'text';
            appNameInput.placeholder = 'Dale un nombre (ej. Minecraft)';
            appNameInput.className = 'register-input';
            
            const saveBtn = document.createElement('button');
            saveBtn.textContent = 'Guardar';
            saveBtn.className = 'register-btn';

            saveBtn.onclick = () => {
                const newAppName = appNameInput.value.trim();
                if (newAppName && currentPackageName) {
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Guardando...';
                    const appData = { packageName: currentPackageName, appName: newAppName };
                    apiFetch('/api/apps/add', {
                        method: 'POST',
                        body: JSON.stringify(appData),
                    }).then(response => {
                        if (response.success) {
                            // Al terminar, liberamos el foco antes de recargar.
                            NativeBridge.releaseWindowFocus(); 
                            NativeBridge.reopenWindow();
                        }
                    }).catch(error => {
                        alert(`Error: ${error.message}`);
                        saveBtn.disabled = false;
                        saveBtn.textContent = 'Guardar';
                        // Si falla, también liberamos el foco.
                        NativeBridge.releaseWindowFocus();
                    });
                }
            };

            registerSection.appendChild(appNameInput);
            registerSection.appendChild(saveBtn);
            
            // Un pequeño retardo para asegurar que el DOM esté listo y el foco se haya concedido.
            setTimeout(() => {
                appNameInput.focus();
            }, 100);
        });
        // ==========================================================

    } catch (error) {
        document.body.innerHTML = `<h1 style="color:white; text-align:center; padding: 20px;">${error.message}</h1>`;
    }
    
    // Avisar al contenedor (nativo o simulado) que el JS ha terminado de cargarse.
    NativeBridge.jsReady();
});