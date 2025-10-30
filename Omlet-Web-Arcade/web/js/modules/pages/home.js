// /js/modules/pages/home.js

import { apiFetch } from '../api.js';
import { renderPosts } from '../components/postCard.js';
import { setupSideMenu, loadSideMenuData } from '../ui/sideMenu.js';
import { initFriendsSidebar } from '../ui/friendsSidebar.js'; // <-- 1. Importa la nueva función
import { socket } from '../ui/notifications.js'; // <-- 2. Importa el socket de las notificaciones

export function initHomePage() {
    const logOutput = document.getElementById('log-output');
    const postsContainer = document.getElementById('posts-container');
    
    // Configurar el menú lateral
    setupSideMenu();
    loadSideMenuData();
    initFriendsSidebar(socket); // <-- 3. Llama a la inicialización
    
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

    // Cargar el feed al inicializar la página
    loadFeed();

    // ¡¡¡YA NO NECESITAMOS DEFINIR window.toggleLike, etc., AQUÍ!!!
    // Se definirán globalmente en app.js
}