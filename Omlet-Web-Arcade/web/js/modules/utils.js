// /js/modules/utils.js

import { API_BASE_URL } from './api.js';
const ICONS = {
    sticker: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256"><path fill="currentColor" d="M168 32H88a56.06 56.06 0 0 0-56 56v80a56.06 56.06 0 0 0 56 56h48a8 8 0 0 0 2.53-.41c26.23-8.75 76.31-58.83 85.06-85.06A8 8 0 0 0 224 136V88a56.06 56.06 0 0 0-56-56m-32 175.42V176a40 40 0 0 1 40-40h31.42c-9.26 21.55-49.87 62.16-71.42 71.42"/></svg>`,
    image: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align: middle; margin-right: 4px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
    video: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align: middle; margin-right: 4px;"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`
};

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


export function getFormattedSnippet(content) {
    if (!content) return "";

    // 1. Sticker
    if (content.includes('/uploads/stickers') || content.includes('giphy.com')) {
        return `${ICONS.sticker} Sticker`;
    } 
    // 2. Imagen
    if (content.match(/\.(jpeg|jpg|gif|png|webp)$/i) && content.startsWith('http')) {
        return `${ICONS.image} Imagen`;
    }
    // 3. Video
    if (content.match(/\.(mp4|webm)$/i) && content.startsWith('http')) {
        return `${ICONS.video} Video`;
    }
    
    // Texto normal truncado
    return content.length > 30 ? content.substring(0, 30) + '...' : content;
}