// /js/app.js (El nuevo punto de entrada principal)

import { fetchCurrentUser, getCurrentUser } from './modules/state.js';
import { initializeCapacitorPlugins, attachBackButtonHandler, configureStatusBar, updateNativeUIColors } from './modules/ui/nativeBridge.js';
// <-- 1. IMPORTAMOS LAS NUEVAS ACCIONES
import { deletePost, toggleLike, toggleSave } from './modules/ui/postActions.js';
// --- AÑADE ESTA IMPORTACIÓN ---
import { initNotifications } from './modules/ui/notifications.js';

import { registerForPushNotifications } from './modules/ui/push.js';


// <-- 2. ASIGNAMOS LAS FUNCIONES AL OBJETO GLOBAL `window`
// Esto hace que estén disponibles para los atributos `onclick="..."` en el HTML de cualquier página.
window.deletePost = deletePost;
window.toggleLike = toggleLike;
window.toggleSave = toggleSave;


// --- PUNTO DE ENTRADA PRINCIPAL DE LA APP ---
document.addEventListener('DOMContentLoaded', async () => {
    initializeCapacitorPlugins();
    configureStatusBar();
    updateNativeUIColors();

    attachBackButtonHandler();
    // ==========================================================
    // === ¡AQUÍ ESTÁ EL LISTENER PARA LA ACCIÓN DE CLIC! ===
    // ==========================================================
    if (window.Capacitor && Capacitor.Plugins.App) {
        Capacitor.Plugins.App.addListener('appUrlOpen', (event) => {
            console.log('App abierta por URL (Deep Link):', event.url);
            // La URL ahora será algo como: com.omletwebfinal://open/chat.html?userId=30
            // Necesitamos extraer la parte que nos interesa
            const path = event.url.split('://open/')[1];
            if (path) {
                console.log(`Navegando a la ruta interna: ${path}`);
                // Usamos `location.replace` para una mejor experiencia de "atrás"
                window.location.replace(path);
            }
        });
    }

    // ==========================================================

    await fetchCurrentUser();
    // --- CAMBIO AQUÍ ---
    // La llamada ya no necesita el argumento `io`
     if (getCurrentUser()) {
        initNotifications();
        // El import de push.js ya no es necesario aquí si solo se llama desde notifications.js
        const { registerForPushNotifications } = await import('./modules/ui/push.js');
        registerForPushNotifications().catch(err => console.warn(err.message));
    }
    routePage();
});

// --- ENRUTADOR DE PÁGINAS (SIN CAMBIOS) ---
async function routePage() {
    const path = window.location.pathname;
    const user = getCurrentUser();

    // Rutas de autenticación
    if (path.includes('index.html') || path.includes('register.html') || path === '/' || path.endsWith('/Omlet-Web-Arcade/')) {
        if (localStorage.getItem('authToken')) {
            window.location.href = 'home.html';
            return;
        }
        const { initAuthPage } = await import('./modules/pages/auth.js');
        initAuthPage();
        return;
    }

    // Rutas protegidas
    if (!localStorage.getItem('authToken') || !user) {
        window.location.href = 'index.html';
        return;
    }
    
    if (!user.isProfileComplete && !path.includes('profile.html')) {
        window.location.href = 'profile.html';
        return;
    }

    // Carga dinámica de módulos
    try {
        if (path.includes('home.html')) {
            const { initHomePage } = await import('./modules/pages/home.js');
            initHomePage();
        } else if (path.includes('create_post.html')) {
            const { initCreatePostPage } = await import('./modules/pages/createPost.js');
            initCreatePostPage();
        } else if (path.includes('user_profile.html')) {
            const { initUserProfilePage } = await import('./modules/pages/userProfile.js');
            initUserProfilePage();
        } else if (path.includes('profile.html')) {
            const { initProfilePage } = await import('./modules/pages/profile.js');
            initProfilePage();
        } else if (path.includes('comments.html')) {
            const { initCommentsPage } = await import('./modules/pages/comments.js');
            initCommentsPage();
        } else if (path.includes('settings.html')) {
            const { initSettingsPage } = await import('./modules/pages/settings.js');
            initSettingsPage();
        } else if (path.includes('themes.html')) {
            const { initThemesPage } = await import('./modules/ui/themeManager.js');
            initThemesPage();
        } else if (path.includes('search.html')) {
            const { initSearchPage } = await import('./modules/pages/search.js');
            initSearchPage();
        } else if (path.includes('followers_list.html')) {
            const { initFollowersListPage } = await import('./modules/pages/followersList.js');
            initFollowersListPage();
        } else if (path.includes('chat.html')) {
            const { initChatPage } = await import('./modules/pages/chat.js');
            initChatPage();
        } else if (path.includes('chat_list.html')) { // <-- AÑADE ESTA LÍNEA
            const { initChatListPage } = await import('./modules/pages/chatList.js');
            initChatListPage();
        }
    } catch (error) {
        console.error(`Error al cargar el módulo de la página para: ${path}`, error);
    }
}