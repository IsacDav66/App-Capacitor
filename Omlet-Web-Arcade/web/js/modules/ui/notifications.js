// /js/modules/ui/notifications.js

import { apiFetch } from '../api.js';
import { getFullImageUrl, formatTimeAgo } from '../utils.js';
import { Toast } from './nativeBridge.js';

// No exportamos el socket desde aquí. Lo recibimos como parámetro.
let localSocket = null;

const renderNotification = (notif) => {
    let message = '';
    if (notif.type === 'new_follower') {
        message = `<strong>${notif.sender_username}</strong> ha comenzado a seguirte.`;
    }
    // Aquí podrías añadir más tipos, como 'like' o 'comment'
    // if (notif.type === 'like') { ... }

    return `
        <a href="user_profile.html?id=${notif.sender_id}" class="notification-item">
            <img src="${getFullImageUrl(notif.sender_profile_pic_url)}" class="notification-avatar">
            <div class="notification-content">
                <p>${message}</p>
                <p class="notification-time">${formatTimeAgo(notif.created_at)}</p>
            </div>
            ${!notif.is_read ? '<div class="notification-unread-dot"></div>' : ''}
        </a>
    `;
};

const updateNotificationBadge = (notifications) => {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    const hasUnread = notifications.some(n => !n.is_read);
    badge.style.display = hasUnread ? 'block' : 'none';
};

/**
 * Inicializa la UI del panel de notificaciones y configura el listener de Socket.IO.
 * @param {object} socket - La instancia activa y conectada de Socket.IO.
 */
export async function initNotifications(socket) {
    const bellBtn = document.getElementById('notification-bell-btn');
    const panel = document.getElementById('notification-panel');
    const list = document.getElementById('notification-list');
    
    if (!bellBtn || !panel) return;
    
    // Asignamos el socket recibido a nuestra variable local.
    localSocket = socket;

    let allNotifications = [];
    let isPanelOpen = false;

    const fetchNotifications = async () => {
        list.innerHTML = `<p class="notification-list-status">Cargando...</p>`;
        try {
            const data = await apiFetch('/api/notifications');
            allNotifications = data.notifications;
            list.innerHTML = allNotifications.length > 0
                ? allNotifications.map(renderNotification).join('')
                : '<p class="notification-list-status">No tienes notificaciones.</p>';
            updateNotificationBadge(allNotifications);
        } catch (error) {
            list.innerHTML = `<p class="notification-list-status error">${error.message}</p>`;
        }
    };
    
    const markAsRead = async () => {
        const badge = document.getElementById('notification-badge');
        if (badge && badge.style.display === 'block') {
            badge.style.display = 'none';
            allNotifications.forEach(n => n.is_read = true);
            list.innerHTML = allNotifications.map(renderNotification).join('');
            try {
                await apiFetch('/api/notifications/mark-read', { method: 'POST' });
            } catch (error) {
                console.error("Error al marcar notificaciones como leídas:", error);
            }
        }
    };

    bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isPanelOpen = !isPanelOpen;
        panel.classList.toggle('visible', isPanelOpen);
        if (isPanelOpen) {
            fetchNotifications();
            setTimeout(markAsRead, 2500);
        }
    });
    
    document.addEventListener('click', () => {
        if (isPanelOpen) {
            isPanelOpen = false;
            panel.classList.remove('visible');
        }
    });

    panel.addEventListener('click', (e) => e.stopPropagation());

    // Configurar el listener de Socket.IO
    if (localSocket) {
        localSocket.on('new_notification', (notification) => {
            console.log('🔔 NOTIFICATIONS: Evento "new_notification" RECIBIDO:', notification);
            // Añade la nueva notificación a la lista en memoria.
            allNotifications.unshift(notification);

            // Si el panel está abierto, lo re-renderiza para mostrar la nueva notificación al instante.
            if (isPanelOpen) {
                list.innerHTML = allNotifications.map(renderNotification).join('');
            }
            // Actualiza la insignia (el punto rojo).
            updateNotificationBadge(allNotifications);
        });
        console.log("🟢 NOTIFICATIONS: Listener de notificaciones en tiempo real inicializado.");
    } else {
        console.warn("🟡 NOTIFICATIONS: No se recibió una instancia de socket. Las notificaciones en tiempo real no funcionarán.");
    }
    
    // Carga inicial de notificaciones desde la API.
    fetchNotifications();
}