// /js/modules/ui/notifications.js

import { apiFetch } from '../api.js';
import { getFullImageUrl, formatTimeAgo } from '../utils.js';
import { Toast } from './nativeBridge.js';

const API_BASE_URL = 'https://davcenter.servequake.com/app';
export let socket = null; // <-- Cambia `let socket = null` a `export let socket = null`

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

export async function initNotifications() {
    const bellBtn = document.getElementById('notification-bell-btn');
    const panel = document.getElementById('notification-panel');
    const list = document.getElementById('notification-list');
    
    if (!bellBtn || !panel) return;
    
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
            setTimeout(markAsRead, 2500); // Marca como leídas después de 2.5 segundos
        }
    });
    
    document.addEventListener('click', () => {
        if (isPanelOpen) {
            isPanelOpen = false;
            panel.classList.remove('visible');
        }
    });

    panel.addEventListener('click', (e) => e.stopPropagation());

    try {
        const { default: io } = await import('https://cdn.socket.io/4.7.5/socket.io.esm.min.js');
        const token = localStorage.getItem('authToken');
        if (token) {
            socket = io(API_BASE_URL.replace('/app', ''), { path: "/app/socket.io/" });
            
            socket.on('connect', () => socket.emit('authenticate', token));

            socket.on('new_notification', (notification) => {
                allNotifications.unshift(notification);
                if (isPanelOpen) {
                    list.innerHTML = allNotifications.map(renderNotification).join('');
                }
                updateNotificationBadge(allNotifications);
                //if (Toast) Toast.show({ text: `Nuevo seguidor: ${notification.sender_username}` });
            });
        }
        fetchNotifications();
    } catch (error) {
        console.error("No se pudo cargar Socket.IO. Notificaciones en tiempo real desactivadas.", error);
        fetchNotifications(); // Carga las notificaciones estáticas de todas formas
    }
}