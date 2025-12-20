// --- MÓDULOS PRINCIPALES ---
import { fetchCurrentUser, getCurrentUser } from './modules/state.js';
// <-- 1. ¡CORRECCIÓN AQUÍ! AÑADIMOS GameDetectorPlugin A LA IMPORTACIÓN
import { initializeCapacitorPlugins, GameDetectorPlugin, attachBackButtonHandler, configureStatusBar, updateNativeUIColors } from './modules/ui/nativeBridge.js';

// Módulo del Socket
import { getSocket } from './modules/socket.js';

// Módulos que dependen del Socket
import { initNotifications } from './modules/ui/notifications.js';
import { initializeNativeAppDetectionListener } from './modules/ui/appDetector.js';
import { initFriendsSidebarListener } from './modules/ui/friendsSidebar.js';

// Otros módulos
import { deletePost, toggleLike, toggleSave } from './modules/ui/postActions.js';
import { registerForPushNotifications } from './modules/ui/push.js';

import { checkForUpdates } from './modules/ui/updater.js'; // <-- ¡AÑADE ESTA IMPORTACIÓN!
// Asignaciones globales
window.deletePost = deletePost;
window.toggleLike = toggleLike;
window.toggleSave = toggleSave;

// PUNTO DE ENTRADA
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicialización síncrona
    initializeCapacitorPlugins();
    configureStatusBar();
    updateNativeUIColors();

    // --- 2. ¡AHORA ESTA LLAMADA FUNCIONARÁ! ---
    // Sincroniza el tema actual con la capa nativa al arrancar la app.
    if (GameDetectorPlugin) {
        const styles = getComputedStyle(document.documentElement);
        const theme = {
            bgColor: styles.getPropertyValue('--color-bg').trim(),
            textColor: styles.getPropertyValue('--color-text').trim(),
            secondaryTextColor: styles.getPropertyValue('--color-text-secondary').trim(),
            surfaceColor: styles.getPropertyValue('--color-surface').trim(),
            accentColor: styles.getPropertyValue('--color-accent').trim(),
            
            // --- ¡AÑADE ESTAS DOS LÍNEAS QUE FALTABAN! ---
            uiColor: styles.getPropertyValue('--color-ui').trim(),
            borderColor: styles.getPropertyValue('--color-border').trim() // Usamos 'borderColor'
        };
        
        console.log("Sincronizando tema completo con la capa nativa:", theme);
        GameDetectorPlugin.syncThemeToNative({ theme: theme });
    }

    attachBackButtonHandler();

    // 2. Listener de Deep Linking
    if (window.Capacitor && Capacitor.Plugins.App) {
        Capacitor.Plugins.App.addListener('appUrlOpen', (event) => {
            const path = event.url.split('://open/')[1];
            if (path) window.location.replace(path);
        });
    }

    // 3. Autenticación
    await fetchCurrentUser();
    
    // 4. Si el usuario está logueado, inicia todos los sistemas asíncronos
    if (getCurrentUser()) {
        try {
            const socket = await getSocket();
            if (socket) {
                initNotifications(socket);
                initFriendsSidebarListener(socket);
                initializeNativeAppDetectionListener(socket);
                registerForPushNotifications().catch(err => console.warn(err.message));
            }
        } catch (error) {
            console.error("❌ APP: Error durante la inicialización de módulos en tiempo real:", error);
        }
    }
    
    // 5. Enrutamiento
    // Al final del bloque `DOMContentLoaded`, justo antes de llamar a routePage()
    await checkForUpdates(); // <-- ¡AÑADE ESTA LÍNEA!
    
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
        } else if (path.includes('chat_list.html')) {
            const { initChatListPage } = await import('./modules/pages/chatList.js');
            initChatListPage();
        // === ¡AÑADE ESTA NUEVA RUTA! ===
        } else if (path.includes('categorize_apps.html')) {
            const { initCategorizeAppsPage } = await import('./modules/pages/categorizeApps.js');
            initCategorizeAppsPage();
        }
    } catch (error) {
        console.error(`Error al cargar el módulo de la página para: ${path}`, error);
    }
}