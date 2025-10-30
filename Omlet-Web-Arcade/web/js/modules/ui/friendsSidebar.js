// /js/modules/ui/friendsSidebar.js

import { apiFetch } from '../api.js';
import { getFullImageUrl } from '../utils.js';

// Variable para asegurar que la lista solo se cargue una vez al abrir
let hasLoaded = false;

const renderFriendList = (friends, container) => {
    if (!friends || friends.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center p-4">Aún no tienes amigos.</p>';
        return;
    }

    container.innerHTML = friends.map(friend => `
        <a href="chat.html?userId=${friend.id}" class="friend-item" data-user-id="${friend.id}">
            <div class="friend-avatar-container">
                <img src="${getFullImageUrl(friend.profile_pic_url)}" class="friend-avatar">
                <div class="status-dot ${friend.is_online ? 'online' : 'offline'}"></div>
            </div>
            <div class="friend-info">
                <div class="friend-username">${friend.username}</div>
                <div class="friend-status">${friend.is_online ? 'En línea' : 'Desconectado'}</div>
            </div>
        </a>
    `).join('');
};

const updateFriendStatusInUI = ({ userId, isOnline }) => {
    const friendItem = document.querySelector(`.friend-item[data-user-id="${userId}"]`);
    if (!friendItem) return;

    const statusDot = friendItem.querySelector('.status-dot');
    const statusText = friendItem.querySelector('.friend-status');

    statusDot.className = `status-dot ${isOnline ? 'online' : 'offline'}`;
    statusText.textContent = isOnline ? 'En línea' : 'Desconectado';
};

export function initFriendsSidebar(socket) {
    const sidebarBtn = document.getElementById('friends-sidebar-btn');
    const sidebar = document.getElementById('friends-sidebar');
    const overlay = document.getElementById('friends-overlay');
    const container = document.getElementById('friends-list-container');
    
    if (!sidebarBtn || !sidebar || !overlay || !container) return;

    const openSidebar = async () => {
        sidebar.classList.add('open');
        overlay.classList.add('show');
        if (!hasLoaded) {
            container.innerHTML = '<p class="text-gray-500 text-center p-4">Cargando amigos...</p>';
            try {
                const data = await apiFetch('/api/user/friends');
                if (data.success) {
                    renderFriendList(data.friends, container);
                    hasLoaded = true;
                }
            } catch (error) {
                container.innerHTML = `<p class="text-red-500 text-center p-4">${error.message}</p>`;
            }
        }
    };

    const closeSidebar = () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    };

    sidebarBtn.addEventListener('click', openSidebar);
    overlay.addEventListener('click', closeSidebar);

    // Escuchar actualizaciones de estado en tiempo real
    if (socket) {
        socket.on('friend_status_update', (data) => {
            console.log('Actualización de estado de amigo recibida:', data);
            updateFriendStatusInUI(data);
        });
    }
}