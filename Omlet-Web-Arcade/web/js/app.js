// =========================================================
// ARCHIVO: /web/js/app.js (VERSIÓN FINAL Y ESTRUCTURADA)
// =========================================================

// --- VARIABLES GLOBALES Y CONSTANTES ---
const API_BASE_URL = 'https://davcenter.servequake.com/app';
const NAV_HISTORY_KEY = 'navigationHistory';
let isBackButtonListenerAttached = false;
let Toast;
let GameDetectorPlugin;

const HEART_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-heart">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
</svg>`;

const SAVE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-bookmark">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
</svg>`;

const SUN_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M11 0.25C11.1989 0.25 11.3897 0.329018 11.5303 0.46967C11.671 0.610322 11.75 0.801088 11.75 1V2C11.75 2.19891 11.671 2.38968 11.5303 2.53033C11.3897 2.67098 11.1989 2.75 11 2.75C10.8011 2.75 10.6103 2.67098 10.4697 2.53033C10.329 2.38968 10.25 2.19891 10.25 2V1C10.25 0.801088 10.329 0.610322 10.4697 0.46967C10.6103 0.329018 10.8011 0.25 11 0.25ZM3.399 3.399C3.53963 3.25855 3.73025 3.17966 3.929 3.17966C4.12775 3.17966 4.31837 3.25855 4.459 3.399L4.852 3.791C4.98869 3.93239 5.06437 4.1218 5.06276 4.31845C5.06114 4.5151 4.98235 4.70325 4.84336 4.84237C4.70437 4.98149 4.5163 5.06046 4.31965 5.06226C4.123 5.06406 3.93352 4.98855 3.792 4.852L3.399 4.459C3.25855 4.31837 3.17966 4.12775 3.17966 3.929C3.17966 3.73025 3.25855 3.53963 3.399 3.399ZM18.601 3.399C18.7414 3.53963 18.8203 3.73025 18.8203 3.929C18.8203 4.12775 18.7414 4.31837 18.601 4.459L18.208 4.852C18.0658 4.98448 17.8778 5.0566 17.6835 5.05317C17.4892 5.04975 17.3038 4.97104 17.1664 4.83362C17.029 4.69621 16.9503 4.51082 16.9468 4.31652C16.9434 4.12222 17.0155 3.93417 17.148 3.792L17.541 3.399C17.6816 3.25855 17.8722 3.17966 18.071 3.17966C18.2698 3.17966 18.4604 3.25855 18.601 3.399ZM0.25 11C0.25 10.8011 0.329018 10.6103 0.46967 10.4697C0.610322 10.329 0.801088 10.25 1 10.25H2C2.19891 10.25 2.38968 10.329 2.53033 10.4697C2.67098 10.6103 2.75 10.8011 2.75 11C2.75 11.1989 2.67098 11.3897 2.53033 11.5303C2.38968 11.671 2.19891 11.75 2 11.75H1C0.801088 11.75 0.610322 11.671 0.46967 11.5303C0.329018 11.3897 0.25 11.1989 0.25 11ZM19.25 11C19.25 10.8011 19.329 10.6103 19.4697 10.4697C19.6103 10.329 19.8011 10.25 20 10.25H21C21.1989 10.25 21.3897 10.329 21.5303 10.4697C21.671 10.6103 21.75 10.8011 21.75 11C21.75 11.1989 21.671 11.3897 21.5303 11.5303C21.3897 11.671 21.1989 11.75 21 11.75H20C19.8011 11.75 19.6103 11.671 19.4697 11.5303C19.329 11.3897 19.25 11.1989 19.25 11ZM17.148 17.148C17.2886 17.0076 17.4792 16.9287 17.678 16.9287C17.8768 16.9287 18.0674 17.0076 18.208 17.148L18.601 17.541C18.6747 17.6097 18.7338 17.6925 18.7748 17.7845C18.8158 17.8765 18.8378 17.9758 18.8396 18.0765C18.8414 18.1772 18.8228 18.2772 18.7851 18.3706C18.7474 18.464 18.6913 18.5488 18.62 18.62C18.5488 18.6913 18.464 18.7474 18.3706 18.7851C18.2772 18.8228 18.1772 18.8414 18.0765 18.8396C17.9758 18.8378 17.8765 18.8158 17.7845 18.7748C17.6925 18.7338 17.6097 18.6747 17.541 18.601L17.148 18.208C17.0076 18.0674 16.9287 17.8768 16.9287 17.678C16.9287 17.4792 17.0076 17.2886 17.148 17.148ZM4.852 17.148C4.99245 17.2886 5.07134 17.4792 5.07134 17.678C5.07134 17.8768 4.99245 18.0674 4.852 18.208L4.459 18.601C4.39034 18.6747 4.30754 18.7338 4.21554 18.7748C4.12354 18.8158 4.02423 18.8378 3.92352 18.8396C3.82282 18.8414 3.72279 18.8228 3.6294 18.7851C3.53601 18.7474 3.45118 18.6913 3.37996 18.62C3.30874 18.5488 3.2526 18.464 3.21488 18.3706C3.17716 18.2772 3.15863 18.1772 3.16041 18.0765C3.16219 17.9758 3.18423 17.8765 3.22522 17.7845C3.26621 17.6925 3.32531 17.6097 3.399 17.541L3.791 17.148C3.86065 17.0783 3.94335 17.023 4.03438 16.9853C4.1254 16.9476 4.22297 16.9282 4.3215 16.9282C4.42003 16.9282 4.5176 16.9476 4.60862 16.9853C4.69965 17.023 4.78235 17.0783 4.852 17.148ZM11 19.25C11.1989 19.25 11.3897 19.329 11.5303 19.4697C11.671 19.6103 11.75 19.8011 11.75 20V21C11.75 21.1989 11.671 21.3897 11.5303 21.5303C11.3897 21.671 11.1989 21.75 11 21.75C10.8011 21.75 10.6103 21.671 10.4697 21.5303C10.329 21.3897 10.25 21.1989 10.25 21V20C10.25 19.8011 10.329 19.6103 10.4697 19.4697C10.6103 19.329 10.8011 19.25 11 19.25Z" fill="white"/>
</svg>`;

const MOON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
  <path d="M5 2.99994C5 9.07994 9.92 13.9999 16 13.9999C16.53 13.9999 17.05 13.9599 17.56 13.8899C15.95 16.3599 13.17 17.9999 10 17.9999C5.03 17.9999 1 13.9699 1 8.99994C1 5.82994 2.64 3.04994 5.11 1.43994C5.04 1.94994 5 2.46994 5 2.99994Z" fill="#1D1D1D" stroke="#1D1D1D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`; // Inserta aquí el SVG de una luna


let loggedInUserId = null;


// =========================================================
// === PUNTO DE ENTRADA PRINCIPAL DE LA APP ===
// =========================================================

// Se ejecuta cuando el HTML de CUALQUIER página ha cargado.
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa los plugins de Capacitor (si están disponibles).
    initializeCapacitorPlugins();


    // NUEVO: Inicializar el plugin de Google Auth ANTES de usarlo.
    // Esto crea los objetos nativos necesarios y evita el crash.
    if (window.Capacitor && Capacitor.Plugins.GoogleAuth) {
        Capacitor.Plugins.GoogleAuth.initialize();
    }
    

     // LLAMA A LA FUNCIÓN AQUÍ PARA ESTABLECER EL COLOR INICIAL
    configureStatusBar(); // <-- AÑADIR ESTA LÍNEA
    updateNativeUIColors();

     // 2. NUEVO: Llama a la función para personalizar la UI del sistema.
    setSystemUIColors();

    // 3. Añade el listener del botón "Atrás" (garantiza que solo se ejecute una vez).
    attachBackButtonHandler();

    // 4. Gestiona nuestro historial de navegación manual.
    updateNavigationHistory();

    // 5. Ejecuta el código específico para la página actual.
    routePage();
});


// =========================================================
// === FUNCIONES DE INICIALIZACIÓN Y ENRUTAMIENTO ===
// =========================================================

function initializeCapacitorPlugins() {
    if (window.Capacitor) {
        console.log("Capacitor API cargada. Modo Nativo.");
        const { Plugins } = Capacitor;
        Toast = Plugins.Toast;
        GameDetectorPlugin = Plugins.GameDetector;
    } else {
        console.log("Capacitor NO DEFINIDO. Modo Navegador.");
    }
}

async function setSystemUIColors() {
  if (!window.Capacitor || !window.Capacitor.Plugins.StatusBar) return;

  try {
    const { StatusBar, Style } = window.Capacitor.Plugins;
    await StatusBar.setStyle({ style: Style.Light }); // Solo cambia color de texto
    console.log("✅ Barra de estado configurada.");
  } catch (err) {
    console.error('Error al personalizar la barra de estado:', err);
  }
}


function attachBackButtonHandler() {
    if (!window.Capacitor || !window.Capacitor.Plugins.App || isBackButtonListenerAttached) {
        return;
    }

    const { App } = window.Capacitor.Plugins;

    App.addListener('backButton', () => {
        const currentPath = window.location.pathname;
        const rootPages = ['/home.html', '/index.html', '/register.html', '/'];
        
        // REGLA 1: Si estamos en una página raíz, salimos de la app.
        if (rootPages.includes(currentPath)) {
            App.exitApp();
            return;
        }

        // REGLA 2: Si no, usamos nuestro historial para volver atrás.
        let history = JSON.parse(sessionStorage.getItem(NAV_HISTORY_KEY) || '[]');
        if (history.length > 1) {
            history.pop();
            const previousPage = history[history.length - 1];
            sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(history));
            window.location.href = previousPage.substring(1);
        } else {
            // Fallback: si algo va mal con el historial, vamos a home.
            window.location.href = 'home.html';
        }
    });

    isBackButtonListenerAttached = true;
    console.log("✅ Listener del botón 'Atrás' añadido con éxito.");
}

function updateNavigationHistory() {
    const currentPathAndQuery = window.location.pathname + window.location.search;
    let navigationHistory = JSON.parse(sessionStorage.getItem(NAV_HISTORY_KEY) || '[]');
    const lastPathInHistory = navigationHistory[navigationHistory.length - 1];
    if (currentPathAndQuery !== lastPathInHistory) {
        navigationHistory.push(currentPathAndQuery);
        sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(navigationHistory));
    }
}

function routePage() {
    const currentUrl = window.location.href;

    if (currentUrl.includes('index.html') || currentUrl.includes('register.html') || currentUrl.endsWith('/')) {
        const existingToken = localStorage.getItem('authToken');
        if (existingToken) {
            window.location.href = 'home.html';
            return;
        }
        const loginForm = document.getElementById('login-form');
        if (loginForm) loginForm.addEventListener('submit', (e) => { e.preventDefault(); handleAuth(false); });
        
        const registerForm = document.getElementById('register-form');
        if (registerForm) registerForm.addEventListener('submit', (e) => { e.preventDefault(); handleAuth(true); });

    } else if (currentUrl.includes('home.html')) {
        loadProtectedData();
        loadSideMenuData();
        setupSideMenu(); // Lógica del menú lateral

    } else if (currentUrl.includes('create_post.html')) {
        initCreatePostPage();
    } else if (/profile\.html$/.test(currentUrl)) {
        initProfilePage();
    } else if (currentUrl.includes('comments.html')) {
        initCommentsPage();
    } else if (currentUrl.includes('user_profile.html')) {
        initUserProfilePage();
    } else if (currentUrl.includes('settings.html')) {
        initSettingsPage();
    } else if (currentUrl.includes('themes.html')) { // <-- AÑADIR ESTA LÍNEA
        initThemesPage(); // <-- AÑADIR ESTA LÍNEA
    }
}

// =========================================================
// === FUNCIONES AUXILIARES Y DE PÁGINA ===
// =========================================================

// AÑADE ESTA NUEVA FUNCIÓN COMPLETA
async function signInWithGoogle() {
    const output = document.getElementById('output');
    output.textContent = 'Iniciando sesión con Google...';

    try {
        // 1. Llama al plugin nativo
        const googleUser = await Capacitor.Plugins.GoogleAuth.signIn();
        
        // 2. Si tiene éxito, envía el token al backend
        if (googleUser && googleUser.authentication && googleUser.authentication.idToken) {
            output.textContent = 'Verificando con el servidor...';
            
            const response = await fetch(API_BASE_URL + '/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: googleUser.authentication.idToken })
            });

            const data = await response.json();

            // 3. Procesa la respuesta del backend
            if (response.ok) {
                output.textContent = `✅ ${data.message} ¡Redirigiendo!`;
                localStorage.setItem('authToken', data.token);
                setTimeout(() => { window.location.href = 'home.html'; }, 500);
            } else {
                output.textContent = `❌ Error del servidor: ${data.message}`;
            }
        } else {
             output.textContent = '❌ No se pudo obtener la información de Google.';
        }
    } catch (error) {
        console.error("Error en el inicio de sesión con Google:", error);
        output.textContent = '❌ Inicio de sesión con Google cancelado o fallido.';
    }
}

// REEMPLAZA TU FUNCIÓN CON ESTA VERSIÓN ACTUALIZADA
function initializeVideoPlayers() {
    const videoElements = document.querySelectorAll('.plyr__video-embed:not(.plyr--ready)');
    const playerInstances = []; 

    videoElements.forEach(element => {
        const player = new Plyr(element, {
            clickToPlay: false,
            youtube: { noCookie: true, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1 },
            
            // Ocultamos la barra de volumen para un look más limpio
            controls: [
                'play-large',   // El botón de play grande en el centro
                'play',         // El botón de play/pausa pequeño en la barra
                'progress',     // La barra de progreso
                'current-time', // El tiempo actual
                'mute',         // Botón de silencio (este se queda)
                // 'volume',    // <-- HEMOS ELIMINADO ESTA LÍNEA
                'fullscreen'    // Botón de pantalla completa
            ]
        });

        // Lógica del "Bucle Inteligente" (sin cambios)
        player.on('timeupdate', event => {
            const currentTime = player.currentTime;
            const duration = player.duration;
            if (!duration) return;
            if ((duration - currentTime) < 0.3) {
                player.currentTime = 0;
            }
        });

        playerInstances.push(player);
    });
    
    return playerInstances;
}


// PEGA ESTA FUNCIÓN COMPLETAMENTE NUEVA
function setupAutoplayObserver(playersToObserve) {
    // Si no hay reproductores que observar, no hacemos nada
    if (!playersToObserve || playersToObserve.length === 0) return;

    // Opciones para el observador:
    // El video se considerará "visible" cuando al menos el 75% de él esté en pantalla.
    const options = {
        root: null, // El viewport del navegador es el área de observación
        rootMargin: '0px',
        threshold: 0.75 
    };

    // La función que se ejecutará cada vez que un video entre o salga de la vista
    const callback = (entries, observer) => {
        entries.forEach(entry => {
            // Buscamos la instancia de Plyr correspondiente al elemento HTML que cambió
            const player = playersToObserve.find(p => p.elements.container === entry.target);
            if (!player) return;

            // Si el video está "intersectando" (es visible)...
            if (entry.isIntersecting) {
                // Pausamos todos los demás videos para que solo uno se reproduzca a la vez
                playersToObserve.forEach(otherPlayer => {
                    if (otherPlayer !== player && !otherPlayer.paused) {
                        otherPlayer.pause();
                    }
                });
                
                // Reproducimos el video actual en silencio
                player.muted = true;
                player.play().catch(error => console.warn("Autoplay bloqueado por el navegador.", error));

            // Si el video ya no es visible...
            } else {
                // Lo pausamos
                player.pause();
            }
        });
    };

    // Creamos el observador
    const observer = new IntersectionObserver(callback, options);

    // Le decimos al observador que empiece a vigilar cada uno de los reproductores de video
    playersToObserve.forEach(player => {
        observer.observe(player.elements.container);
    });
}


// =========================================================
// === INICIO DE LA MODIFICACIÓN ===
// =========================================================

// NUEVA FUNCIÓN AUXILIAR para construir la URL de la imagen correctamente
function getFullImageUrl(pathOrUrl) {
    if (!pathOrUrl) {
        return './assets/img/default-avatar.png'; // Devuelve el avatar por defecto si no hay nada
    }
    // Si la URL ya es completa (empieza con http), la usamos directamente.
    if (pathOrUrl.startsWith('http')) {
        return pathOrUrl;
    }
    // Si es una ruta local, le añadimos la base de la API.
    return API_BASE_URL + pathOrUrl;
}

// =========================================================
// === FIN DE LA MODIFICACIÓN ===
// =========================================================


// AÑADE ESTA NUEVA FUNCIÓN COMPLETA
async function updateNativeUIColors() {
    if (!window.Capacitor || !window.Capacitor.Plugins) {
        console.log("Modo Navegador: No se actualizarán las barras nativas.");
        return;
    }

    try {
        // 1. Obtenemos los plugins que vamos a usar
        const { StatusBar, NavigationBar } = window.Capacitor.Plugins;

        // 2. Leemos el valor actual de la variable CSS --color-ui
        const uiColor = getComputedStyle(document.documentElement).getPropertyValue('--color-ui').trim();
        const currentMode = localStorage.getItem('app-mode') || 'dark';

        // --- CONTROL DE LA STATUS BAR (SUPERIOR) ---
        await StatusBar.setBackgroundColor({ color: uiColor });

        // === CORRECCIÓN AQUÍ ===
        // Usamos las cadenas de texto 'DARK' y 'LIGHT' en lugar del objeto Style
        await StatusBar.setStyle({ style: currentMode === 'dark' ? 'DARK' : 'LIGHT' });
        // =======================

        // --- CONTROL DE LA NAVIGATION BAR (INFERIOR) ---
        // Comprobamos si nuestro plugin personalizado NavigationBar está disponible
        if (NavigationBar) {
            await NavigationBar.setColor({
                color: uiColor,
                darkButtons: currentMode === 'light'
            });
        } else {
             console.warn("El plugin personalizado NavigationBar no fue encontrado.");
        }

        console.log(`✅ Barras nativas actualizadas al color: ${uiColor}`);

    } catch (error) {
        console.error('❌ Error al actualizar los colores de las barras nativas:', error);
    }
}

// NUEVA FUNCIÓN para configurar el comportamiento de la Status Bar
async function configureStatusBar() {
    if (!window.Capacitor || !window.Capacitor.Plugins.StatusBar) return;

    try {
        const { StatusBar } = window.Capacitor.Plugins;
        
        // La línea MÁGICA:
        // Le decimos a Capacitor que la webview NO debe superponerse a la barra de estado.
        await StatusBar.setOverlaysWebView({ overlay: false });

        console.log("✅ Status bar configurada para no superponerse al contenido.");
    } catch (error) {
        console.error("❌ Error al configurar el overlay de la status bar:", error);
    }
}



function setupSideMenu() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sideMenu = document.getElementById('side-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    const logoutBtn = document.getElementById('logout-btn');

    const openMenu = () => {
        if (sideMenu) sideMenu.classList.add('open');
        if (menuOverlay) menuOverlay.classList.add('show');
    };

    const closeMenu = () => {
        if (sideMenu) sideMenu.classList.remove('open');
        if (menuOverlay) menuOverlay.classList.remove('show');
    };

    if (hamburgerBtn) hamburgerBtn.addEventListener('click', openMenu);
    if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                localStorage.removeItem('authToken');
                window.location.href = 'index.html';
            }
        });
    }

    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 50;
    const edgeThreshold = 40;
    document.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX < edgeThreshold && (touchEndX - touchStartX) > swipeThreshold) {
            openMenu();
        }
        if (sideMenu && sideMenu.classList.contains('open') && (touchStartX - touchEndX) > swipeThreshold) {
            closeMenu();
        }
    });
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const secondsAgo = Math.round((now - date) / 1000);

    const minutesAgo = Math.round(secondsAgo / 60);
    const hoursAgo = Math.round(minutesAgo / 60);
    const daysAgo = Math.round(hoursAgo / 24);

    if (secondsAgo < 60) {
        return `Hace ${secondsAgo} segundos`;
    } else if (minutesAgo < 60) {
        const unit = minutesAgo === 1 ? 'minuto' : 'minutos';
        return `Hace ${minutesAgo} ${unit}`;
    } else if (hoursAgo < 24) {
        const unit = hoursAgo === 1 ? 'hora' : 'horas';
        return `Hace ${hoursAgo} ${unit}`;
    } else if (hoursAgo < 48) {
        const time = date.toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true });
        return `Ayer a la(s) ${time}`;
    } else if (now.getFullYear() === date.getFullYear()) {
        return date.toLocaleDateString('es-ES', { month: 'long', day: 'numeric' });
    } else {
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    }
}

// REEMPLAZA TU FUNCIÓN deletePost CON ESTA VERSIÓN
async function deletePost(postId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.')) {
        return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('Error de sesión. Por favor, inicia sesión de nuevo.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
            // === INICIO DE LA MEJORA DE UX ===
            // Comprobamos si estamos en la página de comentarios
            if (window.location.href.includes('comments.html')) {
                // Y si el post que se muestra es el que acabamos de borrar
                const originalPostContainer = document.getElementById('original-post-container');
                if (originalPostContainer && originalPostContainer.querySelector(`#post-${postId}`)) {
                    alert('Publicación eliminada. Serás redirigido a la página de inicio.');
                    window.location.href = 'home.html';
                    return; // Salimos de la función
                }
            }
            // === FIN DE LA MEJORA DE UX ===

            // Si no estamos en el caso anterior, simplemente eliminamos la tarjeta del DOM
            const postCard = document.getElementById(`post-${postId}`);
            if (postCard) {
                postCard.style.transition = 'opacity 0.5s ease';
                postCard.style.opacity = '0';
                setTimeout(() => postCard.remove(), 500);
            }
            if (Toast) Toast.show({ text: 'Publicación eliminada' });

        } else {
            alert(`Error: ${data.message}`);
        }

    } catch (error) {
        console.error('Error de red al eliminar el post:', error);
        alert('Error de red. No se pudo eliminar la publicación.');
    }
}
window.deletePost = deletePost;

async function toggleLike(postId, buttonElement) {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const heartIcon = buttonElement.querySelector('.like-icon');
    const counterElement = buttonElement.querySelector('.like-count');
    
    buttonElement.disabled = true;
    buttonElement.style.opacity = 0.8;

    try {
        const response = await fetch(API_BASE_URL + `/api/posts/react/${postId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'omit'
        });
        const data = await response.json();

        if (response.ok) {
            const isLiked = data.action === 'liked';
            let currentCount = parseInt(counterElement.textContent.replace('K', '000').replace('M', '000000')) || 0;
            
            currentCount = isLiked ? currentCount + 1 : currentCount - 1;
            const formattedCount = currentCount > 999 ? (currentCount / 1000).toFixed(1).replace('.0', '') + 'K' : currentCount;
            counterElement.textContent = formattedCount;

            // --- CAMBIO CLAVE AQUÍ ---
            // Ya no manipulamos el color, solo añadimos o quitamos la clase.
            if (isLiked) {
                heartIcon.classList.add('liked');
            } else {
                heartIcon.classList.remove('liked');
            }
            // El 'setTimeout' que tenías para la animación ya no es necesario
            // porque la clase ahora debe persistir para mostrar el estado.
            // La animación se disparará sola cuando se añada la clase.
            
        } else {
            alert(`Error al dar/quitar like: ${data.message}`);
        }
    } catch (error) {
        console.error('Error de red en like:', error);
    } finally {
        buttonElement.disabled = false;
        buttonElement.style.opacity = 1;
    }
}


// REEMPLAZA TU FUNCIÓN toggleSave CON ESTA VERSIÓN

async function toggleSave(postId, buttonElement) {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const saveIcon = buttonElement.querySelector('.save-icon');
    buttonElement.disabled = true;

    try {
        const response = await fetch(API_BASE_URL + `/api/posts/save/${postId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
            // --- CAMBIO CLAVE AQUÍ ---
            // Ya no manipulamos el color, solo añadimos o quitamos la clase.
            if (data.action === 'saved') {
                saveIcon.classList.add('saved');
            } else { // 'unsaved'
                saveIcon.classList.remove('saved');
            }
        } else {
            alert(`Error al guardar: ${data.message}`);
        }
    } catch (error) {
        console.error('Error de red al guardar:', error);
    } finally {
        buttonElement.disabled = false;
    }
}

/**
 * Genera el HTML para una tarjeta de publicación (post).
 * Esta versión incluye:
 * - Renderizado de imágenes o videos de YouTube.
 * - Un botón para eliminar la publicación, visible solo para el autor del post.
 * @param {object} post - El objeto de la publicación que viene de la API.
 * @returns {string} - La cadena de texto HTML para la tarjeta de publicación.
 */
function createPostHTML(post) {
    // 1. Determinar el estado de las interacciones del usuario (like y guardado)
    const isLiked = post.is_liked_by_user === true;
    const isSaved = post.is_saved_by_user === true;
    
    // 2. Formatear los contadores de likes y comentarios
    const formattedLikes = parseInt(post.total_likes) || 0;
    const formattedComments = parseInt(post.total_comments) || 0;
    
    // 3. Obtener la URL de la foto de perfil del autor
    const profilePicUrl = getFullImageUrl(post.profile_pic_url);

    // 4. Construir el HTML del avatar del autor
    const avatarHTML = `
        <a href="user_profile.html?id=${post.user_id}">
            <img src="${profilePicUrl}" alt="Avatar" class="post-avatar" onerror="this.onerror=null; this.src='./assets/img/default-avatar.png';"/>
        </a>
    `;

    // 5. Lógica para mostrar el botón de eliminar solo si el usuario es el autor
    let deleteButtonHTML = '';
    // La variable global 'loggedInUserId' debe ser establecida al iniciar sesión
    if (loggedInUserId && post.user_id === loggedInUserId) {
        deleteButtonHTML = `
            <button class="delete-post-btn" onclick="deletePost(${post.post_id})">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </button>
        `;
    }

    // 6. Lógica para renderizar el medio (imagen o video)
    let mediaHTML = '';
    if (post.video_id) {
        mediaHTML = `
            <div class="mb-3 plyr__video-embed" data-plyr-provider="youtube" data-plyr-embed-id="${post.video_id}"></div>
        `;
    } else if (post.image_url) {
        const imageUrl = API_BASE_URL + post.image_url;
        mediaHTML = `<div class="mb-3"><img src="${imageUrl}" class="w-full h-auto object-cover rounded-lg"></div>`;
    }

    // 7. Construir la tarjeta completa del post, añadiendo un ID único al contenedor principal
    return `
        <div class="post-card" id="post-${post.post_id}">
            <div class="post-header">
                <div class="post-author-info">
                    ${avatarHTML}
                    <div>
                        <div class="post-username">
                            <a href="user_profile.html?id=${post.user_id}">${post.username || 'Anónimo'}</a>
                        </div>
                        <div class="post-time">${formatTimeAgo(post.created_at)}</div>
                    </div>
                </div>
                ${deleteButtonHTML}
            </div>
            
            <div class="post-content">${post.content || ''}</div>
            
            ${mediaHTML}
            
            <div class="post-actions">
                <button onclick="toggleLike(${post.post_id}, this)">
                    <span class="like-icon ${isLiked ? 'liked' : ''}">${HEART_SVG}</span>
                    <span class="like-count">${formattedLikes}</span>
                </button>
                <a href="comments.html?postId=${post.post_id}" style="text-decoration: none;">
                    <button class="comment-icon" style="border: none; background: none; display: flex; align-items: center; gap: 6px;">
                        <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.99998 0.399994H13.8C15.12 0.399994 16.2 1.47999 16.2 2.79999V11.2C16.2 12.52 15.12 13.6 13.8 13.6H11.4L4 15.5L5.39998 13.6H2.99998C1.67998 13.6 0.599976 12.52 0.599976 11.2V2.79999C0.599976 1.47999 1.67998 0.399994 2.99998 0.399994Z"/>
                        </svg>
                        <span>${formattedComments}</span>
                    </button>
                </a>
                <button onclick="toggleSave(${post.post_id}, this)">
                    <span class="save-icon ${isSaved ? 'saved' : ''}">${SAVE_SVG}</span>
                </button>
                <button>
                    <img src="./assets/icons/actions/share.svg" width="18"> Compartir
                </button>
            </div>
        </div>
    `;
}

async function loadFeed() {
    const logOutput = document.getElementById('log-output');
    const postsContainer = document.getElementById('posts-container');
    const token = localStorage.getItem('authToken');
    if (!token || !postsContainer) return;

    try {
        logOutput.textContent = 'Cargando feed...';
        const response = await fetch(API_BASE_URL + '/api/posts', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'omit'
        });
        const data = await response.json();
        if (response.ok) {
            logOutput.textContent = `Feed cargado: ${data.posts.length} publicaciones.`;
            if (data.posts.length === 0) {
                postsContainer.innerHTML = '<p class="text-center text-gray-500 mt-8">Aún no hay publicaciones. ¡Crea una!</p>';
                return;
            }
            const postsHTML = data.posts.map(post => createPostHTML(post)).join('');
            postsContainer.innerHTML = postsHTML;
            
            // === CAMBIO AQUÍ ===
            // 1. Creamos los reproductores y obtenemos sus instancias
            const players = initializeVideoPlayers();
            // 2. Iniciamos el observador de autoplay para esos reproductores
            setupAutoplayObserver(players);

        } else {
            logOutput.textContent = `❌ Error al cargar feed: ${data.message}`;
        }
    } catch (error) {
        logOutput.textContent = `❌ Error de red al cargar el feed: ${error.message}`;
        console.error('Error de red al cargar feed:', error);
    }
}

function renderComment(comment, currentUserId) {
    const profilePicUrl = comment.profile_pic_url ? `${API_BASE_URL}${comment.profile_pic_url}` : './assets/img/default-avatar.png';
    const time = formatTimeAgo(comment.created_at);
    const commentAuthorIdStr = String(comment.user_id);
    const currentUserIdStr = String(currentUserId);
    const deleteButtonHTML = (commentAuthorIdStr === currentUserIdStr) ? ` 
        <button onclick="window.deleteComment(${comment.comment_id})" class="text-red-500 hover:text-red-700 text-xs flex-shrink-0" style="padding: 0 5px;">Eliminar</button>` : '';
    const replyButtonHTML = `<button onclick="window.startReply(${comment.comment_id}, '${comment.username || 'Usuario'}')" class="text-gray-400 hover:text-white text-xs flex-shrink-0" style="padding: 0 5px;">Responder</button>`;
    let repliesHTML = '';
    if (comment.children && comment.children.length > 0) {
        repliesHTML = `
            <div class="replies-container">
                ${comment.children.map(reply => renderComment(reply, currentUserId)).join('')}
            </div>
        `;
    }
    return `
        <div class="comment-thread">
            <div class="comment-item">
                <div class="flex-shrink-0">
                    <a href="user_profile.html?id=${comment.user_id}">
                        <img src="${profilePicUrl}" alt="Avatar" class="comment-avatar" onerror="this.onerror=null; this.src='./assets/img/default-avatar.png';"/>
                    </a>
                </div>
                <div class="flex flex-col flex-grow min-w-0">
                    <div class="flex justify-between items-center w-full"> 
                        <p class="font-bold text-sm truncate">
                            <a href="user_profile.html?id=${comment.user_id}" class="hover:underline">${comment.username || 'Usuario'}</a>
                            <span class="text-xs text-gray-400 font-normal ml-2">${time}</span>
                        </p>
                        <div class="flex items-center flex-shrink-0 space-x-1 ml-2">
                            ${replyButtonHTML}
                            ${deleteButtonHTML}
                        </div>
                    </div>
                    <p class="text-sm mt-1 break-words">${comment.content}</p>
                </div>
            </div>
            ${repliesHTML}
        </div>
    `;
}

async function handleAuth(isRegister = false) {
    const emailInput = document.getElementById(isRegister ? 'register-email' : 'login-email');
    const passwordInput = document.getElementById(isRegister ? 'register-password' : 'login-password');
    const output = document.getElementById('output');
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const credentials = { email: emailInput.value, password: passwordInput.value };

    if (isRegister) {
        const repeatPasswordInput = document.getElementById('repeat-password');
        if (passwordInput.value !== repeatPasswordInput.value) {
            output.textContent = '❌ Error de registro: Las contraseñas no coinciden.';
            passwordInput.value = '';
            repeatPasswordInput.value = '';
            return;
        }
        if (!passwordInput.value) {
            output.textContent = '❌ Error de registro: La contraseña no puede estar vacía.';
            return;
        }
    }
    
    try {
        output.textContent = `Enviando solicitud de ${isRegister ? 'registro' : 'acceso'}...`;
        const response = await fetch(API_BASE_URL + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'omit',
            body: JSON.stringify(credentials)
        });
        const data = await response.json();
        if (response.ok) {
            output.textContent = `✅ ${data.message} ¡Redirigiendo!`;
            if (data.token) {
                 localStorage.setItem('authToken', data.token); 
            } else {
                 console.error('El servidor no devolvió el token.');
            }
            setTimeout(() => { window.location.href = 'home.html'; }, 500); 
        } else {
            output.textContent = `❌ Error: ${data.message} (Código: ${response.status})`;
        }
    } catch (error) {
        output.textContent = '❌ Error de red: No se pudo conectar al servidor.';
        console.error('Error de conexión al backend:', error);
    }
}

async function loadProtectedData() {
    const logOutput = document.getElementById('log-output');
    if (!logOutput) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
        logOutput.textContent = '❌ Sesión no encontrada. Redirigiendo a Login...';
        setTimeout(() => { window.location.href = 'index.html'; }, 500);
        return;
    }

    try {
        logOutput.textContent = 'Verificando sesión con Token JWT...';
        const response = await fetch(API_BASE_URL + '/api/user/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'omit'
        });
        const data = await response.json();
        if (response.ok) {
            loggedInUserId = data.data.userId;
            const isProfileComplete = data.data.isProfileComplete;
            if (isProfileComplete) {
                logOutput.textContent = `✅ Sesión OK. Usuario: ${data.data.username} (ID: ${data.data.userId})`;
                loadFeed();
            } else {
                console.log('Perfil incompleto. Redirigiendo a completar perfil.');
                sessionStorage.setItem('currentUserId', data.data.userId);
                window.location.href = 'profile.html';
            }
        } else {
            logOutput.textContent = `❌ Error de Sesión: ${data.message} (Código: ${response.status}). Redirigiendo...`;
            localStorage.removeItem('authToken');
            setTimeout(() => { window.location.href = 'index.html'; }, 500);
        }
    } catch (error) {
        logOutput.textContent = `❌ Error de red al verificar sesión.`;
        console.error('Error de red al verificar sesión:', error);
    }
}

async function loadSideMenuData() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const menuProfileBg = document.getElementById('menu-profile-bg');
    const menuAvatarLink = document.getElementById('menu-avatar-link');
    const menuAvatar = document.getElementById('menu-avatar');
    const menuUsername = document.getElementById('menu-username');
    if (!menuProfileBg || !menuAvatarLink || !menuAvatar || !menuUsername) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/user/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.success) {
            const userData = data.data;
            menuUsername.textContent = userData.username || 'Usuario';
            menuAvatar.src = getFullImageUrl(userData.profile_pic_url);
            if (userData.userId) {
                menuAvatarLink.href = `user_profile.html?id=${userData.userId}`;
            }
            menuProfileBg.style.backgroundImage = userData.cover_pic_url ? `url(${API_BASE_URL}${userData.cover_pic_url})` : 'none';
        }
    } catch (error) {
        console.error('Error al cargar datos del menú lateral:', error);
    }
}

function generateRandomUsername(userId) {
    const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
    const baseName = userId ? `Player${userId}` : 'User';
    return `${baseName}${randomSuffix}`;
}

async function initProfilePage() {
    const usernameInput = document.getElementById('username-input');
    const ageInput = document.getElementById('age-input');
    const genderSelect = document.getElementById('gender-select');
    const diceBtn = document.getElementById('dice-btn');
    const completeBtn = document.getElementById('complete-profile-btn');
    const output = document.getElementById('profile-output');
    const fileInput = document.getElementById('file-input');
    const profileImg = document.getElementById('profile-img');
    const defaultSvg = document.getElementById('default-avatar-svg');
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    
    let currentUserId = null;
    let selectedFile = null;
    
    try {
        const response = await fetch(API_BASE_URL + '/api/user/me', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'omit'
        });
        const data = await response.json();
        
        if (data.data.profilePicUrl) {
            profileImg.src = API_BASE_URL + data.data.profilePicUrl;
            profileImg.style.display = 'block';
            defaultSvg.style.display = 'none';
        } else {
            profileImg.style.display = 'none';
            defaultSvg.style.display = 'block';
        }
        
        if (data.ok && data.data.isProfileComplete) {
            window.location.href = 'home.html';
            return;
        }

        currentUserId = data.data.userId;
        let currentUsername = data.data.username || generateRandomUsername(currentUserId);
        usernameInput.value = currentUsername;
        usernameInput.readOnly = false;
        
    } catch (error) {
         output.textContent = '❌ Error al cargar datos iniciales.';
         console.error('Error al cargar perfil inicial:', error);
         localStorage.removeItem('authToken');
         window.location.href = 'index.html';
         return;
    }

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            selectedFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                profileImg.src = e.target.result;
                profileImg.style.display = 'block';
                defaultSvg.style.display = 'none';
            };
            reader.readAsDataURL(file);
            output.textContent = 'Imagen lista para subir. Pulsa "Completar perfil".';
        } else {
            selectedFile = null;
        }
    });

    diceBtn.addEventListener('click', () => {
        const newUsername = generateRandomUsername(currentUserId);
        usernameInput.value = newUsername;
        usernameInput.focus();
        usernameInput.selectionStart = usernameInput.selectionEnd = newUsername.length;
    });

    completeBtn.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const age = parseInt(ageInput.value);
        const gender = genderSelect.value;
        
        if (!username || username.length < 3) {
            output.textContent = '❌ El nombre de usuario debe tener al menos 3 caracteres.';
            return;
        }
        if (isNaN(age) || age < 10 || age > 99) {
            output.textContent = '❌ La edad debe ser entre 10 y 99.';
            return;
        }

        output.textContent = 'Iniciando proceso de actualización...';
        let finalProfilePicUrl = null;
        if (selectedFile) {
            finalProfilePicUrl = await uploadProfilePicture(selectedFile, token, output);
            if (!finalProfilePicUrl) return;
        }
        
        output.textContent = '2/2: Guardando datos de perfil...';
        try {
            const bodyData = { username, age, gender, profilePicUrl: finalProfilePicUrl };
            const response = await fetch(API_BASE_URL + '/api/user/complete-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                credentials: 'omit',
                body: JSON.stringify(bodyData)
            });
            const data = await response.json();
            if (response.ok) {
                output.textContent = '✅ Perfil completado. Redirigiendo a Home.';
                setTimeout(() => { window.location.href = 'home.html'; }, 500);
            } else {
                output.textContent = `❌ Error: ${data.message}`;
            }
        } catch (error) {
            output.textContent = '❌ Error de red al guardar el perfil.';
            console.error('Error al guardar perfil:', error);
        }
    });
}

async function startStreaming() {
    const appStatus = document.getElementById('app-status');
    const logOutput = document.getElementById('log-output');
    if (!appStatus || !logOutput) return;

    if (window.Capacitor && GameDetectorPlugin) {
        try {
            appStatus.textContent = 'Iniciando servicio de fondo...';
            const resultStart = await GameDetectorPlugin.startFloatingOverlay();
            appStatus.textContent = `✅ Servicio Activo. ${resultStart.message}`;
            logOutput.textContent = 'Servicio iniciado. ¡Puedes salir de la app ahora!';
            setInterval(async () => {
                const detection = await GameDetectorPlugin.getForegroundApp();
                document.getElementById('app-status').textContent = `🎯 App en uso: ${detection.appName} (${detection.packageName})`;
            }, 2000);
        } catch (e) {
            appStatus.textContent = `⚠️ Error de inicio: ${e.message}`;
            logOutput.textContent = 'Verifica que el permiso de Overlay esté concedido.';
        }
    } else {
        alert('Función nativa no disponible. Compila el APK para probar.');
        appStatus.textContent = '⚠️ Modo Navegador: No se puede iniciar el servicio nativo.';
    }
}

async function uploadProfilePicture(file, token, outputElement) {
    const formData = new FormData();
    formData.append('profilePic', file);
    outputElement.textContent = '1/2: Subiendo imagen...';
    try {
        const response = await fetch(API_BASE_URL + '/api/user/upload-profile-pic', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'omit',
            body: formData
        });
        const data = await response.json();
        if (response.ok) {
            outputElement.textContent = '1/2: Imagen subida con éxito.';
            return data.profilePicUrl;
        } else {
            outputElement.textContent = `❌ Error al subir foto: ${data.message}`;
            return null;
        }
    } catch (error) {
        outputElement.textContent = '❌ Error de red al subir foto.';
        console.error('Error al subir foto:', error);
        return null;
    }
}

async function uploadPostImage(file, token, outputElement) {
    const formData = new FormData();
    formData.append('postImage', file);
    outputElement.textContent = 'Subiendo imagen...';
    try {
        const response = await fetch(API_BASE_URL + '/api/posts/create-image', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'omit',
            body: formData
        });
        const data = await response.json();
        if (response.ok) {
            outputElement.textContent = 'Imagen lista.';
            return data.imageUrl;
        } else {
            outputElement.textContent = `❌ Error al subir foto: ${data.message}`;
            return null;
        }
    } catch (error) {
        outputElement.textContent = '❌ Error de red al subir imagen de post.';
        console.error('Error al subir imagen:', error);
        return null;
    }
}

async function initCreatePostPage() {
    const publishBtn = document.getElementById('publish-btn');
    if (!publishBtn) return;
    const contentInput = document.getElementById('post-content');
    const cancelBtn = document.getElementById('cancel-post-btn');
    const selectImageBtn = document.getElementById('select-image-btn');
    const selectVideoBtn = document.getElementById('select-video-btn');
    const imageInput = document.getElementById('post-image-input');
    const videoInput = document.getElementById('post-video-input');
    const previewImg = document.getElementById('post-image-preview');
    const previewVideo = document.getElementById('post-video-preview');
    const placeholder = document.getElementById('image-placeholder');
    const output = document.getElementById('post-output');
    const token = localStorage.getItem('authToken');
    if (!token) { window.location.href = 'index.html'; return; }

    let selectedFile = null;
    let fileType = null; // 'image' o 'video'

    const resetPreviews = () => {
        previewImg.style.display = 'none';
        previewVideo.style.display = 'none';
        previewImg.src = '';
        previewVideo.src = '';
        URL.revokeObjectURL(previewVideo.src); // Limpia la memoria
        placeholder.style.display = 'block';
        selectedFile = null;
        fileType = null;
    };

    selectImageBtn.addEventListener('click', () => { imageInput.value = null; imageInput.click(); });
    selectVideoBtn.addEventListener('click', () => { videoInput.value = null; videoInput.click(); });

    imageInput.addEventListener('change', (event) => {
        resetPreviews();
        const file = event.target.files[0];
        if (file) {
            selectedFile = file;
            fileType = 'image';
            previewImg.src = URL.createObjectURL(file);
            previewImg.style.display = 'block';
            placeholder.style.display = 'none';
        }
    });

    videoInput.addEventListener('change', (event) => {
        resetPreviews();
        const file = event.target.files[0];
        if (file) {
            selectedFile = file;
            fileType = 'video';
            previewVideo.src = URL.createObjectURL(file);
            previewVideo.style.display = 'block';
            placeholder.style.display = 'none';
        }
    });
    
    cancelBtn.addEventListener('click', () => { window.location.href = 'home.html'; });

    publishBtn.addEventListener('click', async () => {
        const content = contentInput.value.trim();
        if (!content && !selectedFile) {
            output.textContent = '❌ La publicación no puede estar vacía.';
            return;
        }

        publishBtn.disabled = true;
        publishBtn.textContent = 'Subiendo...';
        
        const formData = new FormData();
        formData.append('content', content);
        
        let endpoint = '';

        if (selectedFile) {
            // El backend espera el archivo en 'postImage' para ambos casos
            formData.append('postImage', selectedFile, selectedFile.name); 
            endpoint = fileType === 'image' ? '/api/posts/create' : '/api/posts/create-video-post';
            output.textContent = fileType === 'video' ? 'Subiendo video a YouTube... Esto puede tardar varios minutos.' : 'Subiendo imagen...';
        } else {
             endpoint = '/api/posts/create'; // Post de solo texto
             output.textContent = 'Publicando...';
        }

        try {
            const response = await fetch(API_BASE_URL + endpoint, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                output.textContent = '✅ ¡Publicado! Redirigiendo...';
                setTimeout(() => { window.location.href = 'home.html'; }, 800);
            } else {
                output.textContent = `❌ Error: ${data.message}`;
                publishBtn.disabled = false;
                publishBtn.textContent = 'Publicar';
            }
        } catch (error) {
            output.textContent = '❌ Error de red al crear la publicación.';
            console.error('Error al crear post:', error);
            publishBtn.disabled = false;
            publishBtn.textContent = 'Publicar';
        }
    });
}

function getPostIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('postId'));
}

// REEMPLAZA TU FUNCIÓN CON ESTA VERSIÓN CORREGIDA
async function loadOriginalPost(postId, token, originalPostContainer) {
    if (!originalPostContainer) return;
    try {
        const response = await fetch(API_BASE_URL + `/api/posts/${postId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            // 1. Creamos e inyectamos el HTML del post
            originalPostContainer.innerHTML = createPostHTML(data.post);
            
            // =========================================================
            // === LAS LÍNEAS QUE FALTABAN ===
            // =========================================================
            // 2. Le decimos a Plyr que active cualquier video nuevo
            const players = initializeVideoPlayers();
            // 3. (Opcional pero recomendado) Activamos el autoplay también para esta página
            setupAutoplayObserver(players);
            // =========================================================

        } else {
            originalPostContainer.innerHTML = `<p class="text-center text-red-500">❌ Error: ${data.message}</p>`;
        }
    } catch (error) {
        console.error('Error de red al cargar el post original:', error);
        originalPostContainer.innerHTML = '<p class="text-center text-red-500">❌ Error de red al cargar el post original.</p>';
    }
}

async function initCommentsPage() {
    const postId = getPostIdFromUrl();
    const token = localStorage.getItem('authToken');
    const commentsFeed = document.getElementById('comments-list-container'); // <-- CAMBIAMOS EL ID
    const commentInput = document.getElementById('comment-content');
    const sendBtn = document.getElementById('send-comment-btn');
    const backBtn = document.getElementById('back-to-home-btn');
    const output = document.getElementById('comment-output');
    const originalPostContainer = document.getElementById('original-post-container');
    const replyStatusDiv = document.getElementById('reply-to-status');
    const replyUsernameSpan = document.getElementById('reply-to-username');
    const cancelReplyBtn = document.getElementById('cancel-reply-btn');
    const charCounter = document.getElementById('char-counter');
    const MAX_CHARS = 500;

    if (!postId || !token) {
        if (output) output.textContent = 'Error: Post ID no encontrado o sesión inválida.';
        return;
    }
    
    if (commentInput && charCounter) {
        commentInput.addEventListener('input', () => {
            const remaining = MAX_CHARS - commentInput.value.length;
            charCounter.textContent = remaining;
            charCounter.style.color = remaining < 20 ? '#ef4444' : '#666';
        });
    }
    
    // let currentUserId = null; // <-- Opcional: puedes mantenerla si la usas para otra cosa
    let parentCommentId = null;

    try {
        const userMeResponse = await fetch(API_BASE_URL + '/api/user/me', { headers: { 'Authorization': `Bearer ${token}` } });
        if (userMeResponse.ok) {
            const userData = (await userMeResponse.json()).data;
            // Asignamos el valor a AMBAS variables (la local y la global)
            const currentUserId = userData.userId; 
            loggedInUserId = userData.userId;
        }
    } catch (e) { console.error("Error fetching user id", e); }

        async function loadComments() {
        //commentsFeed.innerHTML = '<p class="text-center text-gray-500 pt-8">Cargando...</p>';
        try {
            const response = await fetch(API_BASE_URL + `/api/posts/${postId}/comments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                const comments = data.comments;
                const commentsMap = {};
                const topLevelComments = [];
                comments.forEach(comment => {
                    comment.children = [];
                    commentsMap[comment.comment_id] = comment;
                });
                comments.forEach(comment => {
                    if (comment.parent_comment_id && commentsMap[comment.parent_comment_id]) {
                        commentsMap[comment.parent_comment_id].children.push(comment);
                    } else {
                        topLevelComments.push(comment);
                    }
                });
                
                // === LA LÍNEA CORREGIDA ===
                // Cambiamos 'currentUserId' por la variable global 'loggedInUserId'
                const commentsHTML = topLevelComments.map(c => renderComment(c, loggedInUserId)).join('');
                
                commentsFeed.innerHTML = commentsHTML || '<p class="text-center text-gray-500 pt-8">Sé el primero en comentar.</p>';
            } else {
                output.textContent = `❌ Error al cargar comentarios: ${data.message}`;
            }
        } catch (error) {
            output.textContent = `❌ Error de red al cargar comentarios: ${error.message}`;
            console.error('Error de red:', error);
        }
    }

    function startReplyMode(commentId, username) {
        parentCommentId = commentId;
        replyUsernameSpan.textContent = username;
        replyStatusDiv.style.display = 'block';
        commentInput.placeholder = `Respondiendo a ${username}...`;
        commentInput.focus();
    }
    
    function cancelReplyMode() {
        parentCommentId = null;
        replyStatusDiv.style.display = 'none';
        commentInput.placeholder = 'Escribe un comentario...';
    }
    
    window.startReply = startReplyMode;
    window.deleteComment = async (commentId) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) return;
        output.textContent = 'Eliminando...';
        try {
            const response = await fetch(API_BASE_URL + `/api/posts/comment/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                output.textContent = 'Comentario eliminado.';
                await loadComments();
            } else {
                 const data = await response.json();
                 output.textContent = `❌ Error: ${data.message}`;
            }
        } catch (error) {
            output.textContent = '❌ Error de red al eliminar.';
        }
    };
    
    backBtn.addEventListener('click', () => { window.history.back(); }); // Use history for better back navigation
    cancelReplyBtn.addEventListener('click', cancelReplyMode);
    
    sendBtn.addEventListener('click', async () => {
        const content = commentInput.value.trim();
        if (!content) return;
        sendBtn.disabled = true;
        output.textContent = 'Enviando...';
        try {
            const bodyData = { content, parent_comment_id: parentCommentId };
            const response = await fetch(API_BASE_URL + `/api/posts/${postId}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(bodyData)
            });
            if (response.ok) {
                commentInput.value = '';
                output.textContent = 'Comentario enviado.';
                cancelReplyMode();
                await loadComments();
            } else {
                 const data = await response.json();
                 output.textContent = `❌ Error al enviar: ${data.message}`;
            }
        } catch (error) {
            output.textContent = '❌ Error de red al enviar comentario.';
        } finally {
            sendBtn.disabled = false;
        }
    });

    await loadOriginalPost(postId, token, originalPostContainer);
    loadComments();
}

async function initUserProfilePage() {
    const params = new URLSearchParams(window.location.search);
    let targetUserId = params.get('id');
    // let loggedInUserId = null; // <-- ELIMINAMOS LA DECLARACIÓN LOCAL
    const token = localStorage.getItem('authToken');

    if (token) {
        try {
            const meResponse = await fetch(`${API_BASE_URL}/api/user/me`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (meResponse.ok) {
                // Asignamos el valor a la variable GLOBAL que ya existe
                loggedInUserId = (await meResponse.json()).data.userId; 
            }
        } catch (e) { console.error("No se pudo obtener el usuario logueado", e); }
    }
    if (!targetUserId) {
        targetUserId = loggedInUserId;
        if (!targetUserId) {
            window.location.href = 'index.html';
            return;
        }
    }

    const bioEditorEl = document.getElementById('bio-editor');
    if (!bioEditorEl) return;

    const profileBg = document.getElementById('profile-bg-element');
    const editCoverBtn = document.getElementById('edit-cover-btn');
    const coverFileInput = document.getElementById('cover-file-input');
    const avatar = document.getElementById('profile-avatar');
    const profileFileInput = document.getElementById('profile-file-input');
    const username = document.getElementById('profile-username');
    const postCount = document.getElementById('post-count');
    const followersCount = document.getElementById('followers-count');
    const followingCount = document.getElementById('following-count');
    const editBtn = document.getElementById('edit-profile-btn');
    const savedTab = document.getElementById('saved-tab');
    
    const quill = new Quill(bioEditorEl, {
        modules: {
            toolbar: [
                [{ 'size': ['small', false, 'large', 'huge'] }],
                ['bold', 'italic', 'underline'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                ['image', 'link']
            ]
        },
        theme: 'snow'
    });
    quill.enable(false);
    
    try {
        const profileResponse = await fetch(`${API_BASE_URL}/api/user/profile/${targetUserId}`);
        if (profileResponse.ok) {
            const user = (await profileResponse.json()).data;
            if (avatar) avatar.src = getFullImageUrl(user.profile_pic_url);
            if (username) username.textContent = user.username || 'Usuario';
            if (postCount) postCount.textContent = user.post_count;
            if (followersCount) followersCount.textContent = user.followers_count;
            if (followingCount) followingCount.textContent = user.following_count;
            quill.root.innerHTML = user.bio || '<p>Este usuario aún no ha escrito una biografía.</p>';
            if (profileBg && user.cover_pic_url) {
                profileBg.style.backgroundImage = `url(${API_BASE_URL}${user.cover_pic_url})`;
            }
            if (document.getElementById('about-content') && user.bio_bg_url) {
                document.getElementById('about-content').style.backgroundImage = `url(${API_BASE_URL}${user.bio_bg_url})`;
            }

            if (String(loggedInUserId) === String(targetUserId)) {
                if(editBtn) editBtn.style.display = 'inline';
                if(savedTab) savedTab.style.display = 'block';

                const bioControls = document.getElementById('bio-edit-controls');
                const editBioBtn = document.getElementById('edit-bio-btn');
                const saveBioBtn = document.getElementById('save-bio-btn');
                const editBioBgBtn = document.getElementById('edit-bio-bg-btn');
                const bioBgInput = document.getElementById('bio-bg-input');
                if (bioControls) bioControls.style.display = 'flex';
                if (editBioBtn) {
                    editBioBtn.addEventListener('click', () => {
                        const toolbar = quill.getModule('toolbar').container;
                        if (!toolbar) return;
                        const isEditing = bioEditorEl.classList.contains('editing');
                        quill.enable(!isEditing);
                        bioEditorEl.classList.toggle('editing');
                        if (saveBioBtn) saveBioBtn.style.display = isEditing ? 'none' : 'inline-block';
                        toolbar.style.display = isEditing ? 'none' : 'block';
                        editBioBtn.textContent = isEditing ? '✏️ Editar' : '❌ Cancelar';
                    });
                }
                if (saveBioBtn) {
                    saveBioBtn.addEventListener('click', async () => {
                        const bioContent = quill.root.innerHTML;
                        const response = await fetch(`${API_BASE_URL}/api/user/complete-profile`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ bio: bioContent })
                        });
                        if (response.ok) {
                            quill.enable(false);
                            bioEditorEl.classList.remove('editing');
                            saveBioBtn.style.display = 'none';
                            const toolbar = quill.getModule('toolbar').container;
                            if (toolbar) toolbar.style.display = 'none';
                            if (editBioBtn) editBioBtn.textContent = '✏️ Editar';
                            alert('Biografía guardada.');
                        } else {
                            alert('Error al guardar la biografía.');
                        }
                    });
                }
                
                quill.getModule('toolbar').addHandler('image', () => {
                    const input = document.createElement('input');
                    input.setAttribute('type', 'file');
                    input.setAttribute('accept', 'image/*');
                    input.click();
                    input.onchange = async () => {
                        const file = input.files[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('image', file);
                        const response = await fetch(`${API_BASE_URL}/api/user/upload-bio-image`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
                        if (response.ok) {
                            const data = await response.json();
                            const range = quill.getSelection(true);
                            quill.insertEmbed(range.index, 'image', `${API_BASE_URL}${data.url}`);
                        }
                    };
                });
                
                if (editBioBgBtn && bioBgInput) editBioBgBtn.addEventListener('click', () => bioBgInput.click());
                if (bioBgInput) {
                    bioBgInput.addEventListener('change', async (event) => {
                        const file = event.target.files[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('image', file);
                        const response = await fetch(`${API_BASE_URL}/api/user/upload-bio-bg`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
                        if (response.ok) {
                            const data = await response.json();
                            if (document.getElementById('about-content')) document.getElementById('about-content').style.backgroundImage = `url(${API_BASE_URL}${data.url})`;
                        }
                    });
                }

                if (editCoverBtn) editCoverBtn.style.display = 'block';
                if (editCoverBtn && coverFileInput) editCoverBtn.addEventListener('click', () => coverFileInput.click());
                if (profileBg && coverFileInput) profileBg.addEventListener('click', () => coverFileInput.click());
                if (coverFileInput) {
                    coverFileInput.addEventListener('change', async (event) => {
                        const file = event.target.files[0];
                        if (!file || !editCoverBtn) return;
                        editCoverBtn.disabled = true;
                        editCoverBtn.style.opacity = '0.5';
                        const formData = new FormData();
                        formData.append('coverPic', file);
                        try {
                            const uploadResponse = await fetch(`${API_BASE_URL}/api/user/upload-cover-pic`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
                            if (uploadResponse.ok) {
                                const result = await uploadResponse.json();
                                if (profileBg) profileBg.style.backgroundImage = `url(${API_BASE_URL}${result.coverPicUrl})`;
                            } else {
                                alert(`Error: ${(await uploadResponse.json()).message}`);
                            }
                        } catch (e) {
                            alert('Error de red al subir la portada.');
                        } finally {
                            editCoverBtn.disabled = false;
                            editCoverBtn.style.opacity = '1';
                        }
                    });
                }

                if (avatar) avatar.classList.add('editable');
                if (avatar && profileFileInput) avatar.addEventListener('click', () => profileFileInput.click());
                if (profileFileInput) {
                    profileFileInput.addEventListener('change', async (event) => {
                        const file = event.target.files[0];
                        if (!file || !avatar) return;
                        avatar.style.opacity = '0.5';
                        const formData = new FormData();
                        formData.append('profilePic', file);
                        try {
                            const uploadResponse = await fetch(`${API_BASE_URL}/api/user/upload-profile-pic`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
                            if (uploadResponse.ok) {
                                const result = await uploadResponse.json();
                                avatar.src = `${API_BASE_URL}${result.profilePicUrl}`;
                            } else {
                                alert(`Error: ${(await uploadResponse.json()).message}`);
                            }
                        } catch (e) {
                            alert('Error de red al subir la foto de perfil.');
                        } finally {
                            avatar.style.opacity = '1';
                        }
                    });
                }
            }
        } else {
            const errorData = await profileResponse.json();
            if (document.querySelector('main')) document.querySelector('main').innerHTML = `<p class="text-center text-red-500 p-8">${errorData.message}</p>`;
        }
    } catch (e) {
        console.error("Error fatal al cargar perfil", e);
        if (document.querySelector('main')) document.querySelector('main').innerHTML = `<p class="text-center text-red-500 p-8">No se pudo conectar para cargar el perfil.</p>`;
    }
    
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = Array.from(document.querySelectorAll('.tab-content'));
    const tabContentContainer = document.getElementById('tab-content-container');
    let currentTabIndex = 0;

    async function goToTab(index) {
        if (index < 0 || index >= tabs.length || index === currentTabIndex) return;
        const prevIndex = currentTabIndex;
        const newContent = tabContents[index];
        const prevContent = tabContents[prevIndex];
        const direction = index > prevIndex ? 'right' : 'left';
        tabs[prevIndex].classList.remove('active');
        tabs[index].classList.add('active');

        const tabId = tabs[index].dataset.tab;
        const containerId = `${tabId}-container`;
        const container = document.getElementById(containerId);
        if (container && container.innerHTML.trim() === '') {
            let url = '';
            if (tabId === 'posts') url = `${API_BASE_URL}/api/posts/user/${targetUserId}`;
            else if (tabId === 'saved') url = `${API_BASE_URL}/api/posts/saved`;
            if (url) {
                container.innerHTML = `<p class='text-center text-gray-400 p-8'>Cargando...</p>`;
                try {
                    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                    const response = await fetch(url, { headers });
                    if (response.ok) {
                        const data = await response.json();
                        container.innerHTML = (data.posts && data.posts.length > 0)
                            ? data.posts.map(createPostHTML).join('')
                            : `<p class='text-center text-gray-400 p-8'>No hay contenido para mostrar.</p>`;
                             // === CAMBIO AQUÍ ===
                            const players = initializeVideoPlayers();
                            setupAutoplayObserver(players);
                    } else {
                        container.innerHTML = `<p class='text-center text-red-500 p-8'>Error al cargar contenido.</p>`;
                    }
                } catch (e) {
                    container.innerHTML = `<p class='text-center text-red-500 p-8'>Error de red.</p>`;
                }
            }
        }
        
        prevContent.style.display = 'block';
        newContent.style.display = 'block';
        newContent.classList.add(direction === 'right' ? 'slide-in-right' : 'slide-in-left');
        
        requestAnimationFrame(() => {
            if (tabContentContainer) tabContentContainer.style.height = `${newContent.scrollHeight}px`;
            prevContent.classList.remove('active');
            prevContent.classList.add(direction === 'right' ? 'slide-out-left' : 'slide-out-right');
            newContent.classList.add('active');
            newContent.classList.remove('slide-in-left', 'slide-in-right');
        });

        setTimeout(() => {
            prevContent.style.display = 'none';
            prevContent.classList.remove('slide-out-left', 'slide-out-right');
            if (currentTabIndex === index && tabContentContainer) {
                 tabContentContainer.style.height = 'auto';
            }
        }, 350);
        currentTabIndex = index;
    }

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => goToTab(index));
    });

    let touchStartX = 0;
    const swipeThreshold = 75;
    if (tabContentContainer) {
        tabContentContainer.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        tabContentContainer.addEventListener('touchend', e => {
            const touchEndX = e.changedTouches[0].screenX;
            const deltaX = touchEndX - touchStartX;
            if (Math.abs(deltaX) < swipeThreshold) return;
            const visibleTabs = Array.from(tabs).filter(tab => tab.offsetParent !== null);
            if (deltaX < 0) {
                goToTab(Math.min(currentTabIndex + 1, visibleTabs.length - 1));
            } else {
                goToTab(Math.max(currentTabIndex - 1, 0));
            }
        });
    }

    const initialTab = tabContents[0];
    if (initialTab) {
        initialTab.style.display = 'block';
        initialTab.classList.add('active');
        requestAnimationFrame(() => {
           if(tabContentContainer) {
                tabContentContainer.style.height = `${initialTab.scrollHeight}px`;
                setTimeout(() => tabContentContainer.style.height = 'auto', 350);
           }
        });
    }
}

async function initSettingsPage() {
    const bubbleToggle = document.getElementById('bubble-toggle');
    const output = document.getElementById('settings-output');
    if (!bubbleToggle || !output) return;

    bubbleToggle.addEventListener('change', async () => {
        if (bubbleToggle.checked) {
            output.textContent = 'Iniciando servicio de fondo...';
            if (window.Capacitor && GameDetectorPlugin) {
                try {
                    const result = await GameDetectorPlugin.startFloatingOverlay();
                    output.textContent = `✅ Servicio Activo: ${result.message}`;
                } catch (e) {
                    output.textContent = `⚠️ Error: ${e.message}. Asegúrate de conceder el permiso de superposición.`;
                    bubbleToggle.checked = false;
                }
            } else {
                output.textContent = '⚠️ Función nativa no disponible en el navegador.';
                alert('Esta función solo está disponible en la aplicación móvil.');
                bubbleToggle.checked = false;
            }
        } else {
            output.textContent = 'Servicio detenido.';
        }
    });
}




// REEMPLAZA TU FUNCIÓN initThemesPage CON ESTA VERSIÓN ACTUALIZADA
async function initThemesPage() {
    const themeSelector = document.getElementById('theme-selector-container');
    const modeToggleButton = document.getElementById('theme-mode-toggle');
    if (!themeSelector) return;

    // El objeto 'themes' no necesita cambios
    const themes = {
        'purple': {
            image: 'linear-gradient(#000, #000), linear-gradient(#111, #111), linear-gradient(#222, #222), linear-gradient(#8A2BE2, #8A2BE2), linear-gradient(#FFF, #FFF)',
            size: '20% 100%, 20% 100%, 20% 100%, 20% 100%, 20% 100%',
            position: '0% 0, 20% 0, 40% 0, 60% 0, 80% 0'
        },
        'green': {
            image: 'linear-gradient(#011C13, #011C13), linear-gradient(#0A2E22, #0A2E22), linear-gradient(#133F31, #133F31), linear-gradient(#26DE9D, #26DE9D), linear-gradient(#FFF, #FFF)',
            size: '20% 100%, 20% 100%, 20% 100%, 20% 100%, 20% 100%',
            position: '0% 0, 20% 0, 40% 0, 60% 0, 80% 0'
        },
        'rose': {
            image: 'linear-gradient(#2B191D, #2B191D), linear-gradient(#40262C, #40262C), linear-gradient(#57333B, #57333B), linear-gradient(#F48A9C, #F48A9C), linear-gradient(#FFF, #FFF)',
            size: '20% 100%, 20% 100%, 20% 100%, 20% 100%, 20% 100%',
            position: '0% 0, 20% 0, 40% 0, 60% 0, 80% 0'
        },
        'blue': {
            image: 'linear-gradient(#291F37, #291F37), linear-gradient(#3C3552, #3C3552), linear-gradient(#5D5279, #5D5279), linear-gradient(#9384A9, #9384A9), linear-gradient(#DABFEE, #DABFEE)',
            size: '20% 100%, 20% 100%, 20% 100%, 20% 100%, 20% 100%',
            position: '0% 0, 20% 0, 40% 0, 60% 0, 80% 0'
        }
    };
    // =========================================================
    // === FIN DE LA SOLUCIÓN ===
    // =========================================================

    let currentTheme = localStorage.getItem('app-theme') || 'purple';
    let currentMode = localStorage.getItem('app-mode') || 'dark';

    // =========================================================
    // === INICIO DE LA MODIFICACIÓN EN renderThemeCircles ===
    // =========================================================
    function renderThemeCircles() {
        themeSelector.innerHTML = '';
        for (const themeName in themes) {
            // 1. Creamos el contenedor exterior (el círculo)
            const circleWrapper = document.createElement('div');
            circleWrapper.className = 'theme-circle';
            
            // 2. Creamos el contenedor interior (las bandas de color)
            const colorBands = document.createElement('div');
            colorBands.className = 'theme-color-bands';

            // 3. Aplicamos los fondos al div INTERIOR
            colorBands.style.backgroundImage = themes[themeName].image;
            colorBands.style.backgroundSize = themes[themeName].size;
            colorBands.style.backgroundPosition = themes[themeName].position;
            colorBands.style.backgroundRepeat = 'no-repeat';

            // 4. Ponemos el div de las bandas DENTRO del div del círculo
            circleWrapper.appendChild(colorBands);

            // 5. El resto de la lógica se aplica al contenedor exterior (wrapper)
            if (themeName === currentTheme) {
                circleWrapper.classList.add('active');
            }
            circleWrapper.dataset.theme = themeName;
            circleWrapper.addEventListener('click', () => {
                currentTheme = themeName;
                localStorage.setItem('app-theme', currentTheme);
                document.documentElement.setAttribute('data-theme', currentTheme);
                renderThemeCircles();
                updateNativeUIColors(); // <-- AÑADIR AQUÍ
            });


            themeSelector.appendChild(circleWrapper);
        }
    }
    // =========================================================
    // === FIN DE LA MODIFICACIÓN ===
    // =========================================================
    
    // El resto de la función no necesita cambios...
    function applyMode(mode) {
        document.documentElement.setAttribute('data-mode', mode);
        modeToggleButton.innerHTML = mode === 'dark' ? SUN_ICON : MOON_ICON;
    }
    
    modeToggleButton.addEventListener('click', () => {
        currentMode = currentMode === 'dark' ? 'light' : 'dark';
        localStorage.setItem('app-mode', currentMode);
        applyMode(currentMode);
        updateNativeUIColors(); // <-- AÑADIR AQUÍ
    });


    renderThemeCircles();
    applyMode(currentMode);
    updateNativeUIColors(); // <-- Y TAMBIÉN AQUÍ

}