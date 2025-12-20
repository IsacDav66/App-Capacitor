// /js/modules/ui/nativeBridge.js

const NAV_HISTORY_KEY = 'navigationHistory';
let isBackButtonListenerAttached = false;

export let Toast;
export let GameDetectorPlugin;
export let GoogleAuth;
export let AppUpdater; // <-- ¡AÑADE ESTA LÍNEA!

export function initializeCapacitorPlugins() {
    if (window.Capacitor) {
        console.log("Capacitor API cargada. Modo Nativo.");
        const { Plugins } = Capacitor;
        Toast = Plugins.Toast;
        GameDetectorPlugin = Plugins.GameDetector;
        GoogleAuth = Plugins.GoogleAuth;
        
        if (GoogleAuth) {
            GoogleAuth.initialize();
        }
        AppUpdater = Plugins.AppUpdater; // <-- ¡AÑADE ESTA LÍNEA!
    } else {
        console.log("Capacitor NO DEFINIDO. Modo Navegador.");
    }
}

export async function configureStatusBar() {
    if (!window.Capacitor || !window.Capacitor.Plugins.StatusBar) return;
    try {
        const { StatusBar } = window.Capacitor.Plugins;
        await StatusBar.setOverlaysWebView({ overlay: false });
        console.log("✅ Status bar configurada para no superponerse.");
    } catch (error) {
        console.error("❌ Error al configurar el overlay de la status bar:", error);
    }
}

export async function updateNativeUIColors() {
    if (!window.Capacitor || !window.Capacitor.Plugins) return;
    try {
        const { StatusBar, NavigationBar } = window.Capacitor.Plugins;
        const uiColor = getComputedStyle(document.documentElement).getPropertyValue('--color-ui').trim();
        const currentMode = localStorage.getItem('app-mode') || 'dark';

        await StatusBar.setBackgroundColor({ color: uiColor });
        await StatusBar.setStyle({ style: currentMode === 'dark' ? 'DARK' : 'LIGHT' });

        if (NavigationBar) {
            await NavigationBar.setColor({ color: uiColor, darkButtons: currentMode === 'light' });
        }
    } catch (error) {
        console.error('❌ Error al actualizar los colores de las barras nativas:', error);
    }
}

export async function syncNativeTheme() {
    if (!GameDetectorPlugin) return;
    try {
        const styles = getComputedStyle(document.documentElement);
        const theme = {
            surfaceColor: styles.getPropertyValue('--color-bg').trim(),
            textColor: styles.getPropertyValue('--color-text').trim(),
            textSecondaryColor: styles.getPropertyValue('--color-text-secondary').trim()
        };
        await GameDetectorPlugin.setTheme({ theme });
    } catch (error) {
        console.error("Error al sincronizar el tema nativo:", error);
    }
}

function updateNavigationHistory() {
    // Esta función sigue siendo útil para la navegación web si la necesitaras,
    // pero el botón de atrás usará la lógica nativa del historial del navegador.
    const currentPathAndQuery = window.location.pathname + window.location.search;
    let navigationHistory = JSON.parse(sessionStorage.getItem(NAV_HISTORY_KEY) || '[]');
    const lastPathInHistory = navigationHistory[navigationHistory.length - 1];
    if (currentPathAndQuery !== lastPathInHistory) {
        navigationHistory.push(currentPathAndQuery);
        sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(navigationHistory));
    }
}


// ======================================================================
// === FUNCIÓN CORREGIDA ===
// ======================================================================

export function attachBackButtonHandler() {
    updateNavigationHistory(); // Registra la página actual en nuestro historial manual al cargar.

    if (!window.Capacitor || !window.Capacitor.Plugins.App || isBackButtonListenerAttached) {
        return;
    }

    const { App } = window.Capacitor.Plugins;

    App.addListener('backButton', () => {
        // Obtiene la ruta actual (ej. "/home.html", "/user_profile.html")
        const currentPath = window.location.pathname;
        
        // Define las páginas consideradas "raíz" o de primer nivel.
        // Si el usuario está aquí, el siguiente "atrás" es salir de la app.
        const rootPages = ['/home.html', '/index.html', '/register.html', '/'];

        // REGLA 1: Si la página actual es una de las páginas raíz, cierra la aplicación.
        if (rootPages.some(rootPage => currentPath.endsWith(rootPage))) {
            App.exitApp();
        } else {
            // REGLA 2: Si estamos en una página "profunda" (comentarios, perfil, etc.),
            // simplemente usamos la función de retroceso estándar del historial del navegador.
            window.history.back();
        }
    });

    isBackButtonListenerAttached = true;
    console.log("✅ Listener del botón 'Atrás' (CORREGIDO) añadido.");
}