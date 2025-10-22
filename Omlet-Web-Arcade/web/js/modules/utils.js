// /js/modules/utils.js

import { API_BASE_URL } from './api.js';

export function getFullImageUrl(pathOrUrl) {
    if (!pathOrUrl) {
        return './assets/img/default-avatar.png';
    }
    if (pathOrUrl.startsWith('http')) {
        return pathOrUrl;
    }
    return `${API_BASE_URL}${pathOrUrl}`;
}

export function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const secondsAgo = Math.round((now - date) / 1000);
    const minutesAgo = Math.round(secondsAgo / 60);
    const hoursAgo = Math.round(minutesAgo / 60);

    if (secondsAgo < 60) return `Hace ${secondsAgo}s`;
    if (minutesAgo < 60) return `Hace ${minutesAgo}m`;
    if (hoursAgo < 24) return `Hace ${hoursAgo}h`;
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}

export function formatMessageTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString(navigator.language, {
        hour: 'numeric',
        minute: '2-digit'
    });
}

export function formatDateSeparator(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((nowStart - dateStart) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays > 1 && diffDays < 7) {
        return new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(date);
    }
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(date);
}

export function generateRandomUsername(userId) {
    const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
    const baseName = userId ? `Player${userId}` : 'User';
    return `${baseName}${randomSuffix}`;
}