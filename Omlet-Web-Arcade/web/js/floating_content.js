// /js/floating_content.js

import { apiFetch, API_BASE_URL } from './modules/api.js';
import { getFullImageUrl, formatTimeAgo } from './modules/utils.js';
import { initChatController } from './modules/controllers/chatController.js'; // <-- ¡IMPORTAMOS EL CONTROLADOR!
import { getFormattedSnippet } from './modules/utils.js';


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
        
        // --- AÑADE ESTA LÍNEA DE DEPURACIÓN ---
        console.log("Respuesta de la API para " + packageName + ":", data);

        if (data.found) {
            // Se añade 'is_game' al objeto que guardamos en caché
            const appData = { name: data.app.app_name, icon: data.app.icon_url, is_game: data.app.is_game };
            appDataCache.set(packageName, appData);
            return appData;
        } else {
            appDataCache.set(packageName, null);
            return null;
        }
    } catch (error) {
        console.error(`Error al obtener datos de la app para ${packageName}:`, error);
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


const renderChatList = (conversations, container) => {
    if (!conversations || conversations.length === 0) {
        container.innerHTML = '<p class="friend-status">No tienes chats recientes.</p>';
        return;
    }
    
    container.innerHTML = conversations.map(convo => {
        const snippetHTML = getFormattedSnippet(convo.last_message_content);
        
        return `
            <div class="chat-list-item" data-user-id="${convo.user_id}">
                <img src="${getFullImageUrl(convo.profile_pic_url)}" class="chat-list-avatar">
                <div class="chat-list-content">
                    <div class="chat-list-header">
                        <span class="chat-list-username">${convo.username}</span>
                    </div>
                    <p class="chat-list-snippet" style="display: flex; align-items: center; gap: 4px;">
                        ${snippetHTML}
                    </p>
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
    const mainViewHeader = document.querySelector('body > header');
    const mainViewContent = document.querySelector('body > main');
    const chatView = document.getElementById('chat-view');
    const backToMainViewBtn = document.getElementById('back-to-main-view-btn');
    const tabs = document.querySelectorAll('.nav-tab');
    const pages = document.querySelectorAll('.page-content');
    const chatListContainer = document.getElementById('chat-list-container');
    
    const registerSection = document.getElementById('registration-section');
    const registerInitialView = document.getElementById('register-initial-view');
    const registerFormView = document.getElementById('register-form-view');
    const registerBtn = document.getElementById('register-btn');
    const appNameInput = document.getElementById('register-app-name-input');
    const saveAppBtn = document.getElementById('save-app-btn');

    let socket;
    
    // ==========================================================
    // === ¡NUEVA BANDERA DE ESTADO PARA PROTEGER LA UI! ===
    // ==========================================================
    let isInteractingWithForm = false;

    // --- FUNCIONES DE UI DENTRO DEL ÁMBITO ---

    function resetRegistrationForm() {
        if (!registerInitialView || !registerFormView || !appNameInput || !saveAppBtn) return;
        registerFormView.style.display = 'none';
        registerInitialView.style.display = 'block';
        appNameInput.value = '';
        saveAppBtn.disabled = false;
        saveAppBtn.textContent = 'Guardar';
        // <-- AÑADE ESTA LÍNEA
        isInteractingWithForm = false; // Asegura que el estado de bloqueo se reinicie
    }

    async function updateGameStatus({ appName, packageName })  {
        // --- LOG 4: Confirmar que la función JS fue llamada desde Java ---
        console.log(`[JS LOG] updateGameStatus llamado con: ${packageName}`);

        // ==========================================================
        // === ¡NUEVA LÓGICA DE EMISIÓN DE SOCKET! ===
        // ==========================================================
        // Si tenemos una conexión de socket y un nombre de paquete,
        // notificamos al backend sobre la app actual.
        if (socket && socket.connected && packageName) {
            console.log(`[JS LOG] Emitiendo 'update_current_app' al backend con paquete: ${packageName}`);
            socket.emit('update_current_app', { package: packageName, name: appName });
        }
        // ==========================================================
        
        if (isInteractingWithForm) {
            console.log("[JS LOG] UI Bloqueada: Interacción en progreso. Se ignora la actualización de UI.");
            return;
        }

        const gameInfoSection = document.getElementById('game-info');
        if (!gameInfoSection) return;

        const gameNameEl = document.getElementById('game-name');
        const gameIconEl = document.getElementById('game-icon');
        // Usamos la referencia a 'registerSection' que ya obtuvimos al principio del DOMContentLoaded
        const classificationSection = document.getElementById('classification-section');
        const titleEl = gameInfoSection.querySelector('.section-title');

        if (!gameNameEl || !gameIconEl || !registerSection || !classificationSection || !titleEl) return;

        registerSection.style.display = 'none';
        classificationSection.style.display = 'none';

        currentPackageName = packageName;
        const appData = await getAppData(packageName);
        
        console.log("Datos de la App recibidos en updateGameStatus:", appData);

        if (appData) {
            titleEl.textContent = "Jugando ahora:";
            gameNameEl.textContent = appData.name;
            gameIconEl.src = getFullImageUrl(appData.icon) || '';
            gameIconEl.style.display = 'block';
            gameInfoSection.style.display = 'block';
            
            if (appData.is_game === null) {
                classificationSection.style.display = 'block';
            }
        } else if (packageName) {
            titleEl.textContent = "Juego no registrado:";
            gameNameEl.textContent = packageName;
            gameIconEl.style.display = 'none';
            resetRegistrationForm(); // Esta llamada ahora es válida porque está en el mismo ámbito
            registerSection.style.display = 'block';
            gameInfoSection.style.display = 'block';
        } else {
            gameInfoSection.style.display = 'none';
        }
    }

    
    function applyThemeUpdate(theme) {
        console.log("FLOATING: Aplicando actualización de tema completa:", theme);
        const root = document.documentElement;
        if (theme.bgColor) root.style.setProperty('--color-bg', theme.bgColor);
        if (theme.textColor) root.style.setProperty('--color-text', theme.textColor);
        if (theme.secondaryTextColor) root.style.setProperty('--text-secondary-color', theme.secondaryTextColor);
        if (theme.surfaceColor) root.style.setProperty('--color-surface', theme.surfaceColor);
        if (theme.accentColor) root.style.setProperty('--color-accent', theme.accentColor);
        if (theme.uiColor) root.style.setProperty('--color-ui', theme.uiColor);
        if (theme.borderColor) root.style.setProperty('--color-border', theme.borderColor);
    }
    
    const updateFriendStatusInUI = async (data) => {
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

    const renderChatList = (conversations, container) => {
        if (!conversations || conversations.length === 0) {
            container.innerHTML = '<p class="friend-status" style="padding: 1rem; text-align: center;">No tienes chats recientes.</p>';
            return;
        }
        container.innerHTML = conversations.map(convo => {
            const snippet = convo.last_message_content.length > 25 ? convo.last_message_content.substring(0, 25) + '...' : convo.last_message_content;
            return `<div class="chat-list-item" data-user-id="${convo.user_id}"><img src="${getFullImageUrl(convo.profile_pic_url)}" class="chat-list-avatar"><div class="chat-list-content"><div class="chat-list-header"><span class="chat-list-username">${convo.username}</span><span class="chat-list-time">${formatTimeAgo(convo.last_message_at)}</span></div><p class="chat-list-snippet">${snippet}</p></div></div>`;
        }).join('');
    };

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
            return `<div class="friend-item" data-user-id="${friend.id}"><div class="friend-avatar-container"><img src="${getFullImageUrl(friend.profile_pic_url)}" class="friend-avatar" alt="Avatar de ${friend.username}"><div class="status-dot ${statusClass}">${statusIconHTML}</div></div><div class="friend-info"><div class="friend-username">${friend.username}</div><div class="friend-status">${statusText}</div></div></div>`;
        }));
        container.innerHTML = friendItemsHTML.join('');
    };

    // --- PUENTE DE COMUNICACIÓN ---
    const NativeBridge = {
        closeWindow: () => {
            NativeBridge.releaseWindowFocus();
            if (window.Android) Android.closeWindow(); else window.parent.postMessage('closeWindow', '*');
        },
        reopenWindow: () => {
            if (window.Android) Android.reopenWindow(); else location.reload();
        },
        requestWindowFocus: () => {
            if (window.Android) Android.requestWindowFocus(); else console.log("DEBUG: Solicitando foco (simulado).");
        },
        releaseWindowFocus: () => {
            if (window.Android) Android.releaseWindowFocus(); else console.log("DEBUG: Liberando foco (simulado).");
        },
        jsReady: () => {
            if (window.Android) Android.jsReady(); else window.parent.postMessage('jsReady', '*');
        },
        getAuthToken: async () => {
            if (window.Android) return await Android.getAuthToken();
            else return localStorage.getItem('authToken');
        }
    };

    window.updateGameInfo = updateGameStatus;
    window.applyThemeUpdate = applyThemeUpdate;
    if (closeBtn) closeBtn.addEventListener('click', () => NativeBridge.closeWindow());
    NativeBridge.jsReady();

    async function openChatView(userId, username, avatarUrl) {
        mainViewHeader.style.display = 'none';
        mainViewContent.style.display = 'none';
        chatView.style.display = 'flex';
        NativeBridge.requestWindowFocus();
        const domElements = {
            messagesContainer: document.getElementById('chat-messages-container'),
            userAvatar: document.getElementById('chat-partner-avatar'),
            userUsername: document.getElementById('chat-partner-username'),
            chatForm: document.getElementById('chat-form'),
            chatInput: document.getElementById('chat-message-input'),
            replyContextBar: document.getElementById('reply-context-bar'),
            replyToUser: document.getElementById('reply-to-user'),
            replySnippet: document.getElementById('reply-snippet'),
            cancelReplyBtn: document.getElementById('cancel-reply-btn'),
            contextMenuOverlay: document.getElementById('context-menu-overlay'),
            contextMenu: document.getElementById('context-menu'),
            replyFromMenuBtn: document.getElementById('reply-from-menu-btn'),
            copyBtn: document.getElementById('copy-btn'),
            deleteBtn: document.getElementById('delete-from-menu-btn'),
            stickyHeader: document.getElementById('sticky-date-header'),
            stickyHeaderText: document.getElementById('sticky-date-header')?.querySelector('span'),
            deleteConfirmModal: document.getElementById('delete-confirm-modal'),
            cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
            confirmDeleteBtn: document.getElementById('confirm-delete-btn')
        };
        domElements.userAvatar.src = avatarUrl;
        domElements.userUsername.textContent = username;
        await initChatController(domElements, userId, loggedInUserId);
    }
    
    function closeChatView() {
        mainViewHeader.style.display = 'flex';
        mainViewContent.style.display = 'block';
        chatView.style.display = 'none';
        NativeBridge.releaseWindowFocus();
    }

    window.addEventListener('message', (event) => {
        if (event.source !== window.parent) return;
        const { type, data } = event.data;
        if (type === 'updateGameInfo' && window.updateGameInfo) {
            window.updateGameInfo(data);
        } 
        else if (type === 'applyThemeUpdate' && window.applyThemeUpdate) {
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
        
        // ==========================================================
        // === ¡AQUÍ ESTÁ LA LÍNEA CRÍTICA CORREGIDA! ===
        // ==========================================================
        // Pasamos `friendsResponse.friends` (el array) en lugar del objeto completo.
        if (friendsResponse.success) await renderFriends(friendsResponse.friends, friendsContainer);
        // ==========================================================
        
        const { default: io } = await import('https://cdn.socket.io/4.7.5/socket.io.esm.min.js');
        socket = io(API_BASE_URL.replace('/app', ''), { path: "/app/socket.io/" });
        
        socket.on('connect', () => {
            console.log("[JS LOG] Socket conectado. Autenticando...");
            socket.emit('authenticate', token);

            // ==========================================================
            // === ¡AQUÍ ESTÁ LA LÓGICA CORREGIDA! ===
            // ==========================================================
            // Solo DESPUÉS de conectar y autenticar, le decimos a Java
            // que puede empezar a enviarnos actualizaciones de apps.
            console.log("[JS LOG] Notificando a la capa nativa que el JS y el Socket están listos.");
            NativeBridge.jsReady();
            // ==========================================================
        });
        socket.on('friend_status_update', (data) => updateFriendStatusInUI(data));

        // --- LISTENERS DE EVENTOS DE LA UI (el resto del código no cambia) ---
        
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
                // <-- AÑADE ESTO
                // Si el usuario cambia de pestaña, cancelamos la acción de registro
                resetRegistrationForm(); 
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
        // --- LÓGICA DE REGISTRO CORREGIDA ---
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                isInteractingWithForm = true; // <-- ¡NUEVA LÍNEA! Bloqueamos la UI
                NativeBridge.requestWindowFocus();
                if (registerInitialView) registerInitialView.style.display = 'none';
                if (registerFormView) registerFormView.style.display = 'block';
                if (appNameInput) {
                    setTimeout(() => appNameInput.focus(), 100);
                }
            });
        }

        if (saveAppBtn) {
            saveAppBtn.addEventListener('click', () => {
                const newAppName = appNameInput.value.trim();
                if (newAppName && currentPackageName) {
                    saveAppBtn.disabled = true;
                    saveAppBtn.textContent = 'Guardando...';
                    const appData = { packageName: currentPackageName, appName: newAppName };

                    apiFetch('/api/apps/add', {
                        method: 'POST',
                        body: JSON.stringify(appData),
                    }).then(response => {
                        if (response.success) {
                            NativeBridge.releaseWindowFocus();
                            appDataCache.delete(currentPackageName);
                            resetRegistrationForm(); // <-- Esta función ahora también pone el flag en false
                            updateGameStatus({ packageName: currentPackageName, appName: newAppName });
                        }
                    }).catch(error => {
                        alert(`Error: ${error.message}`);
                        NativeBridge.releaseWindowFocus();
                        resetRegistrationForm(); // <-- También reseteamos en caso de error
                    });
                }
            });
        }
        
        async function classifyApp(isGame) {
            if (!currentPackageName) return;
            
            // Obtenemos las referencias a los botones
            const yesBtn = document.getElementById('classify-yes-btn');
            const noBtn = document.getElementById('classify-no-btn');

            // Deshabilitamos los botones al iniciar la acción
            if (yesBtn) yesBtn.disabled = true;
            if (noBtn) noBtn.disabled = true;

            try {
                // La lógica de la API no cambia
                await apiFetch('/api/apps/classify', {
                    method: 'POST',
                    body: JSON.stringify({ packageName: currentPackageName, is_game: isGame })
                });
                appDataCache.delete(currentPackageName);
                await updateGameStatus({ packageName: currentPackageName, appName: '' });
            } catch (error) {
                alert(`Error al clasificar: ${error.message}`);
            } finally {
                // ==========================================================
                // === ¡AQUÍ ESTÁ LA CORRECCIÓN! ===
                // ==========================================================
                // Este bloque se ejecutará SIEMPRE, después del try o del catch.
                // Nos aseguramos de que los botones estén listos para la próxima vez.
                if (yesBtn) yesBtn.disabled = false;
                if (noBtn) noBtn.disabled = false;
            }
        }
        const classifyYesBtn = document.getElementById('classify-yes-btn');
        const classifyNoBtn = document.getElementById('classify-no-btn');
        if (classifyYesBtn) classifyYesBtn.addEventListener('click', () => classifyApp(true));
        if (classifyNoBtn) classifyNoBtn.addEventListener('click', () => classifyApp(false));

    } catch (error) {
        // Esta línea es la que causaba el error final
        document.body.innerHTML = `<h1 style="color:white; text-align:center; padding: 20px;">${error.message}</h1>`;
    }
    
    NativeBridge.jsReady();
});