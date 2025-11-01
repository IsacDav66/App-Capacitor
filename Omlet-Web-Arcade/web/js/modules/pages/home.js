// /js/modules/pages/home.js

import { apiFetch } from '../api.js';
import { renderPosts } from '../components/postCard.js';
import { setupSideMenu, loadSideMenuData } from '../ui/sideMenu.js';
// <-- 1. CAMBIAMOS LA IMPORTACIÓN
import { initFriendsSidebarUI } from '../ui/friendsSidebar.js'; 
// <-- 2. ELIMINAMOS LA IMPORTACIÓN DEL SOCKET

export function initHomePage() {
    // Inicializa todos los componentes de UI de la página
    setupSideMenu();
    loadSideMenuData();
    initFriendsSidebarUI(); // <-- 3. LLAMAMOS A LA FUNCIÓN DE UI, QUE NO NECESITA SOCKET

    const logOutput = document.getElementById('log-output');
    const postsContainer = document.getElementById('posts-container');
    
    // Función para cargar el feed
    async function loadFeed() {
        if (!logOutput || !postsContainer) return;
        logOutput.textContent = 'Cargando feed...';
        try {
            const data = await apiFetch('/api/posts');
            if (data.success) {
                logOutput.textContent = `Feed cargado: ${data.posts.length} publicaciones.`;
                renderPosts(data.posts, postsContainer);
            }
        } catch (error) {
            logOutput.textContent = `❌ Error al cargar feed: ${error.message}`;
        }
    }

    loadFeed();
}