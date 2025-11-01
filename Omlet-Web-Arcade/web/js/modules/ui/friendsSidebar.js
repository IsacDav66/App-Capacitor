// /js/modules/ui/friendsSidebar.js (Versión Final conectada a la BD)

import { apiFetch } from '../api.js';
import { getFullImageUrl } from '../utils.js';

/**
 * Renderiza la lista completa de amigos, incluyendo su estado actual.
 * @param {Array} friends - La lista de amigos obtenida de la API.
 * @param {HTMLElement} container - El elemento DOM donde se renderizará la lista.
 */
const renderFriendList = (friends, container) => {
    if (!friends || friends.length === 0) {
        container.innerHTML = '<p class="friend-status" style="padding: 1rem; text-align: center;">Aún no tienes amigos.</p>';
        return;
    }

    container.innerHTML = friends.map(friend => {
        let statusText = 'Desconectado';
        let statusClass = 'offline';
        let statusIconHTML = '';

        if (friend.is_online) {
            // Si el servidor nos envió una app actual...
            if (friend.current_app && friend.current_app_icon) {
                statusText = `Jugando a ${friend.current_app}`;
                statusClass = 'playing';
                statusIconHTML = `<img src="${getFullImageUrl(friend.current_app_icon)}" class="status-app-icon" alt="${friend.current_app}">`;
            } else if (friend.current_app) {
                statusText = `En ${friend.current_app}`; // Sin icono
                statusClass = 'playing';
            }
            else {
                statusText = 'En línea';
                statusClass = 'online';
            }
        }
        
        return `
            <a href="chat.html?userId=${friend.id}" class="friend-item" data-user-id="${friend.id}">
                <div class="friend-avatar-container">
                    <img src="${getFullImageUrl(friend.profile_pic_url)}" class="friend-avatar" alt="Avatar de ${friend.username}">
                    <div class="status-dot ${statusClass}">${statusIconHTML}</div>
                </div>
                <div class="friend-info">
                    <div class="friend-username">${friend.username}</div>
                    <div class="friend-status">${statusText}</div>
                </div>
            </a>`;
    }).join('');
};

/**
 * Actualiza el estado de un único amigo en la UI en tiempo real.
 */
const updateFriendStatusInUI = (data) => {
    const { userId, isOnline, currentApp, currentAppIcon } = data;
    const friendItem = document.querySelector(`.friend-item[data-user-id="${userId}"]`);
    if (!friendItem) return;

    const statusDot = friendItem.querySelector('.status-dot');
    const statusText = friendItem.querySelector('.friend-status');

    let newStatusText = 'Desconectado';
    let newStatusClass = 'offline';
    let newStatusIconHTML = '';

    if (isOnline) {
        if (currentApp && currentAppIcon) {
            newStatusText = `Jugando a ${currentApp}`;
            newStatusClass = 'playing';
            newStatusIconHTML = `<img src="${getFullImageUrl(currentAppIcon)}" class="status-app-icon" alt="${currentApp}">`;
        } else if (currentApp) {
            newStatusText = `En ${currentApp}`;
            newStatusClass = 'playing';
        }
        else {
            newStatusText = 'En línea';
            newStatusClass = 'online';
        }
    }
    
    statusDot.className = `status-dot ${newStatusClass}`;
    statusDot.innerHTML = newStatusIconHTML;
    statusText.textContent = newStatusText;
};

/**
 * Inicializa la UI de la barra lateral (botones de abrir/cerrar).
 */
export function initFriendsSidebarUI() {
    const sidebarBtn = document.getElementById('friends-sidebar-btn');
    const sidebar = document.getElementById('friends-sidebar');
    const overlay = document.getElementById('friends-overlay');
    const container = document.getElementById('friends-list-container');
    
    if (!sidebarBtn || !sidebar || !overlay || !container) return;

    const openSidebar = async () => {
        sidebar.classList.add('open');
        overlay.classList.add('show');
        
        container.innerHTML = '<p class="friend-status" style="padding: 1rem; text-align: center;">Cargando amigos...</p>';
        try {
            const data = await apiFetch('/api/user/friends');
            if (data.success) {
                renderFriendList(data.friends, container);
            }
        } catch (error) {
            container.innerHTML = `<p class="friend-status" style="padding: 1rem; text-align: center; color: red;">${error.message}</p>`;
        }
    };

    const closeSidebar = () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    };

    sidebarBtn.addEventListener('click', openSidebar);
    overlay.addEventListener('click', closeSidebar);
}

/**
 * Inicializa el listener de Socket.IO para las actualizaciones de estado de amigos.
 */
export function initFriendsSidebarListener(socket) {
    if (!socket) {
        console.warn("FRIENDS-SIDEBAR: No se pudo inicializar el listener de estado (no hay socket).");
        return;
    }

    socket.on('friend_status_update', (data) => {
        console.log('🔔 FRIENDS-SIDEBAR: Evento "friend_status_update" RECIBIDO:', data);
        updateFriendStatusInUI(data);
    });
    
    console.log("🟢 FRIENDS-SIDEBAR: Listener de estado de amigos inicializado.");
}