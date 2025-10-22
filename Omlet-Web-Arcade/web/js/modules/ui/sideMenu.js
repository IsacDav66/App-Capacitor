// /js/modules/ui/sideMenu.js

import { apiFetch } from '../api.js';
import { getFullImageUrl } from '../utils.js';

export function setupSideMenu() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sideMenu = document.getElementById('side-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    const logoutBtn = document.getElementById('logout-btn');

    if (!hamburgerBtn || !sideMenu || !menuOverlay) return;

    const openMenu = () => {
        sideMenu.classList.add('open');
        menuOverlay.classList.add('show');
    };
    const closeMenu = () => {
        sideMenu.classList.remove('open');
        menuOverlay.classList.remove('show');
    };

    hamburgerBtn.addEventListener('click', openMenu);
    menuOverlay.addEventListener('click', closeMenu);

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                localStorage.removeItem('authToken');
                window.location.href = 'index.html';
            }
        });
    }

    // Swipe gestures
    let touchStartX = 0;
    const swipeThreshold = 50;
    const edgeThreshold = 40;
    document.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    document.addEventListener('touchend', e => {
        const touchEndX = e.changedTouches[0].screenX;
        if (touchStartX < edgeThreshold && (touchEndX - touchStartX) > swipeThreshold) {
            openMenu();
        }
        if (sideMenu.classList.contains('open') && (touchStartX - touchEndX) > swipeThreshold) {
            closeMenu();
        }
    });
}

export async function loadSideMenuData() {
    const menuProfileBg = document.getElementById('menu-profile-bg');
    const menuAvatarLink = document.getElementById('menu-avatar-link');
    const menuAvatar = document.getElementById('menu-avatar');
    const menuUsername = document.getElementById('menu-username');

    if (!menuAvatar || !menuUsername) return;

    try {
        const { data: userData } = await apiFetch('/api/user/me');
        if (userData) {
            menuUsername.textContent = userData.username || 'Usuario';
            menuAvatar.src = getFullImageUrl(userData.profile_pic_url);
            if (userData.userId) {
                menuAvatarLink.href = `user_profile.html?id=${userData.userId}`;
            }
            if (menuProfileBg && userData.cover_pic_url) {
                menuProfileBg.style.backgroundImage = `url(${getFullImageUrl(userData.cover_pic_url)})`;
            }
        }
    } catch (error) {
        console.error('Error al cargar datos del menú lateral:', error);
    }
}