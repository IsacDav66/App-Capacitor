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


// =========================================================
// === PUNTO DE ENTRADA PRINCIPAL DE LA APP ===
// =========================================================

// Se ejecuta cuando el HTML de CUALQUIER página ha cargado.
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa los plugins de Capacitor (si están disponibles).
    initializeCapacitorPlugins();

    // 2. Añade el listener del botón "Atrás" (garantiza que solo se ejecute una vez).
    attachBackButtonHandler();

    // 3. Gestiona nuestro historial de navegación manual.
    updateNavigationHistory();

    // 4. Ejecuta el código específico para la página actual.
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
    }
}


// =========================================================
// === FUNCIONES AUXILIARES Y DE PÁGINA ===
// =========================================================

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

            if (isLiked) {
                heartIcon.style.color = '#FF4466';
                heartIcon.classList.add('liked');
            } else {
                heartIcon.style.color = '#aaa';
                heartIcon.classList.remove('liked');
            }

            setTimeout(() => {
                heartIcon.classList.remove('liked');
            }, 300);
            
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
            if (data.action === 'saved') {
                saveIcon.style.color = '#4A90E2';
                saveIcon.classList.add('saved');
            } else {
                saveIcon.style.color = '#aaa';
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

function createPostHTML(post) {
    const imageUrl = post.image_url ? API_BASE_URL + post.image_url : null;
    const isLiked = post.is_liked_by_user === true;
    const heartColor = isLiked ? '#FF4466' : '#aaa';
    const isSaved = post.is_saved_by_user === true;
    const saveIconColor = isSaved ? '#4A90E2' : '#aaa';
    const formattedLikes = (parseInt(post.total_likes) || 0);
    const formattedComments = (parseInt(post.total_comments) || 0);
    let profilePicUrl = post.profile_pic_url ? API_BASE_URL + post.profile_pic_url : './assets/img/default-avatar.png';
    const postImageHTML = imageUrl ? `<div class="mb-3"><img src="${imageUrl}" class="w-full h-auto object-cover rounded-lg"></div>` : '';
    const avatarHTML = `<a href="user_profile.html?id=${post.user_id}"><img src="${profilePicUrl}" alt="Avatar" class="post-avatar" onerror="this.onerror=null; this.src='./assets/img/default-avatar.png';"/></a>`;

    return `
        <div class="post-card">
            <div class="post-header">
                ${avatarHTML}
                <div>
                    <div class="post-username"><a href="user_profile.html?id=${post.user_id}">${post.username || 'Anónimo'}</a></div>
                    <div class="post-time">${formatTimeAgo(post.created_at)}</div>
                </div>
            </div>
            <div class="post-content">${post.content || ''}</div>
            ${postImageHTML}
            <div class="post-actions">
                <button onclick="toggleLike(${post.post_id}, this)">
                    <span class="like-icon" style="color: ${heartColor};">${HEART_SVG}</span>
                    <span class="like-count">${formattedLikes}</span>
                </button>
                <a href="comments.html?postId=${post.post_id}" style="text-decoration: none;">
                    <button style="border: none; background: none; color: inherit; display: flex; align-items: center; gap: 6px;">
                        <img src="./assets/icons/actions/comment.svg" width="18"> 
                        <span>${formattedComments}</span>
                    </button>
                </a>
                <button onclick="toggleSave(${post.post_id}, this)">
                    <span class="save-icon" style="color: ${saveIconColor}; transition: color 0.2s;">
                        ${SAVE_SVG}
                    </span>
                </button>
                <button><img src="./assets/icons/share.svg" width="18"> Compartir</button>
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
        } else {
            logOutput.textContent = `❌ Error al cargar feed: ${data.message}`;
        }
    } catch (error) {
        logOutput.textContent = '❌ Error de red al cargar el feed.';
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
            menuAvatar.src = userData.profile_pic_url ? `${API_BASE_URL}${userData.profile_pic_url}` : './assets/img/default-avatar.png';
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
    const fileInput = document.getElementById('post-file-input');
    const previewImg = document.getElementById('post-image-preview');
    const placeholder = document.getElementById('image-placeholder');
    const output = document.getElementById('post-output');
    const token = localStorage.getItem('authToken');
    if (!token) { window.location.href = 'index.html'; return; }
    let selectedFile = null;

    cancelBtn.addEventListener('click', () => { window.location.href = 'home.html'; });
    selectImageBtn.addEventListener('click', (e) => { e.preventDefault(); fileInput.click(); });
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            selectedFile = file;
            const reader = new FileReader();
            reader.onload = e => {
                previewImg.src = e.target.result;
                previewImg.style.display = 'block';
                placeholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
            output.textContent = 'Imagen seleccionada. Lista para publicar.';
        } else {
            selectedFile = null;
        }
    });

    publishBtn.addEventListener('click', async () => {
        const content = contentInput.value.trim();
        if (!content && !selectedFile) {
            output.textContent = '❌ La publicación no puede estar vacía.';
            return;
        }
        output.textContent = 'Enviando publicación...';
        let headers = {};
        let body;
        if (selectedFile) {
            const postFormData = new FormData();
            postFormData.append('content', content);
            postFormData.append('postImage', selectedFile);
            body = postFormData;
        } else {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify({ content: content });
        }
        try {
            const response = await fetch(API_BASE_URL + '/api/posts/create', {
                method: 'POST',
                headers: { ...headers, 'Authorization': `Bearer ${token}` },
                credentials: 'omit',
                body: body
            });
            const data = await response.json();
            if (response.ok) {
                output.textContent = '✅ Publicación completada. Redirigiendo a Home.';
                setTimeout(() => { window.location.href = 'home.html'; }, 500);
            } else {
                output.textContent = `❌ Error: ${data.message}`;
            }
        } catch (error) {
            output.textContent = '❌ Error de red al crear la publicación.';
            console.error('Error al crear post:', error);
        }
    });
}

function getPostIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('postId'));
}

async function loadOriginalPost(postId, token, originalPostContainer) {
    if (!originalPostContainer) return;
    try {
        const response = await fetch(API_BASE_URL + `/api/posts/${postId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            originalPostContainer.innerHTML = createPostHTML(data.post);
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
    const commentsFeed = document.getElementById('comments-feed');
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
    
    let currentUserId = null;
    let parentCommentId = null;

    try {
        const userMeResponse = await fetch(API_BASE_URL + '/api/user/me', { headers: { 'Authorization': `Bearer ${token}` } });
        if (userMeResponse.ok) {
            currentUserId = (await userMeResponse.json()).data.userId;
        }
    } catch (e) { console.error("Error fetching user id", e); }

    async function loadComments() {
        commentsFeed.innerHTML = '<p class="text-center text-gray-500 pt-8">Cargando...</p>';
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
                const commentsHTML = topLevelComments.map(c => renderComment(c, currentUserId)).join('');
                commentsFeed.innerHTML = commentsHTML || '<p class="text-center text-gray-500 pt-8">Sé el primero en comentar.</p>';
            } else {
                output.textContent = `❌ Error al cargar comentarios: ${data.message}`;
            }
        } catch (error) {
            output.textContent = '❌ Error de red al cargar comentarios.';
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
    let loggedInUserId = null;
    const token = localStorage.getItem('authToken');

    if (token) {
        try {
            const meResponse = await fetch(`${API_BASE_URL}/api/user/me`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (meResponse.ok) {
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
            if (avatar) avatar.src = user.profile_pic_url ? `${API_BASE_URL}${user.profile_pic_url}` : './assets/img/default-avatar.png';
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