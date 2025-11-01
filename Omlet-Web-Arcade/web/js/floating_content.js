// /js/floating_content.js

import { apiFetch, API_BASE_URL } from './modules/api.js';
import { getFullImageUrl, formatTimeAgo } from './modules/utils.js';

let socket;
let currentPackageName = null;
const appDataCache = new Map(); // El caché se queda aquí

// ==========================================================
// === ¡AÑADIMOS LA FUNCIÓN AQUÍ, AHORA PERTENECE A ESTE MÓDULO! ===
// ==========================================================
/**
 * Obtiene los datos de una app desde nuestra propia API.
 * Utiliza una caché para evitar peticiones de red repetidas.
 */
async function getAppData(packageName) {
    if (!packageName) return null;
    if (appDataCache.has(packageName)) return appDataCache.get(packageName);

    try {
        const data = await apiFetch(`/api/apps/${packageName}`);
        if (data.found) {
            const appData = {
                name: data.app.app_name,
                icon: data.app.icon_url,
            };
            appDataCache.set(packageName, appData);
            return appData;
        } else {
            appDataCache.set(packageName, null);
            return null;
        }
    } catch (error) {
        console.error(`Error al obtener datos de la app desde nuestra API para ${packageName}:`, error);
        return null;
    }
}
// ==========================================================
// --- FUNCIONES DE RENDERIZADO DE LA UI ---

/**
 * Rellena la pestaña de perfil con el avatar y el nombre del usuario.
 * @param {object} user - El objeto de datos del usuario.
 */
function renderProfile(user) {
    const profileTab = document.getElementById('profile-tab');
    if (profileTab && user) {
        profileTab.innerHTML = `
            <img src="${getFullImageUrl(user.profile_pic_url)}" alt="Avatar de ${user.username}">
            <span>${user.username}</span>
        `;
    }
}

// ==========================================================
// === LÓGICA PARA RENDERIZAR AMIGOS (IGUAL QUE EN friendsSidebar.js) ===
// ==========================================================
const renderFriends = async (friends, container) => {
    if (!friends || friends.length === 0) {
        container.innerHTML = '<p class="friend-status" style="padding: 1rem; text-align: center;">Aún no tienes amigos.</p>';
        return;
    }

    const friendItemsHTML = await Promise.all(friends.map(async (friend) => {
        let statusText = 'Desconectado';
        let statusClass = 'offline';
        let statusIconHTML = '';

        if (friend.is_online) {
            if (friend.current_app && friend.current_app_package) {
                const appData = await getAppData(friend.current_app_package);
                if (appData) {
                    statusText = `Jugando a ${appData.name}`;
                    statusClass = 'playing';
                    statusIconHTML = `<img src="${appData.icon}" class="status-app-icon" alt="${appData.name}">`;
                } else {
                    statusText = `En ${friend.current_app}`;
                    statusClass = 'playing';
                }
            } else {
                statusText = 'En línea';
                statusClass = 'online';
            }
        }
        
        return `
            <div class="friend-item" data-user-id="${friend.id}">
                <div class="friend-avatar-container">
                    <img src="${getFullImageUrl(friend.profile_pic_url)}" class="friend-avatar" alt="Avatar de ${friend.username}">
                    <div class="status-dot ${statusClass}">${statusIconHTML}</div>
                </div>
                <div class="friend-info">
                    <div class="friend-username">${friend.username}</div>
                    <div class="friend-status">${statusText}</div>
                </div>
            </div>`;
    }));

    container.innerHTML = friendItemsHTML.join('');
};

const updateFriendStatusInUI = async (data) => {
    // Reutilizamos la misma lógica de `friendsSidebar.js`
    const { userId, isOnline, currentApp, currentAppPackage, currentAppIcon } = data;
    const friendItem = document.querySelector(`.friend-item[data-user-id="${userId}"]`);
    if (!friendItem) return;

    const statusDot = friendItem.querySelector('.status-dot');
    const statusText = friendItem.querySelector('.friend-status');

    let newStatusText = 'Desconectado';
    let newStatusClass = 'offline';
    let newStatusIconHTML = '';

    if (isOnline) {
        if (currentApp && currentAppPackage) {
            const appName = currentApp;
            const appIcon = currentAppIcon ? getFullImageUrl(currentAppIcon) : (await getAppData(currentAppPackage))?.icon;
            newStatusText = `Jugando a ${appName}`;
            newStatusClass = 'playing';
            if (appIcon) {
                newStatusIconHTML = `<img src="${appIcon}" class="status-app-icon" alt="${appName}">`;
            }
        } else {
            newStatusText = 'En línea';
            newStatusClass = 'online';
        }
    }
    
    statusDot.className = `status-dot ${newStatusClass}`;
    statusDot.innerHTML = newStatusIconHTML;
    statusText.textContent = newStatusText;
};
// ==========================================================
/**
 * Actualiza la sección "Jugando ahora" con la información de la app detectada.
 * Esta es la función principal que decide qué mostrar en la UI.
 * @param {object} gameData - Objeto con { appName (nativo), packageName }.
 */
async function updateGameStatus({ appName, packageName }) {
    const gameInfoSection = document.getElementById('game-info');
    const gameNameEl = document.getElementById('game-name');
    const gameIconEl = document.getElementById('game-icon');
    const registerSection = document.getElementById('registration-section');
    const titleEl = gameInfoSection.querySelector('.section-title');

    if (!gameNameEl || !gameIconEl || !registerSection || !titleEl) return;

    currentPackageName = packageName;
    const appData = await getAppData(packageName);

    if (appData && appData.name) {
        // CASO 1: App conocida
        titleEl.textContent = "Jugando ahora:";
        gameNameEl.textContent = appData.name;
        gameIconEl.src = getFullImageUrl(appData.icon) || '';
        gameIconEl.style.display = 'block';
        registerSection.style.display = 'none';
        gameInfoSection.style.display = 'block';
    } else if (packageName) {
        // CASO 2: App desconocida -> Se muestra el formulario por defecto
        titleEl.textContent = "Juego no registrado:";
        gameNameEl.textContent = packageName;
        gameIconEl.style.display = 'none';
        registerSection.style.display = 'block';
        gameInfoSection.style.display = 'block';
    } else {
        // CASO 3: Sin app detectada
        gameInfoSection.style.display = 'none'; // Ocultamos toda la sección
    }
}


// ==========================================================
// === ¡NUEVA LÓGICA PARA MANEJAR TEMAS! ===
// ==========================================================
/**
 * Esta función es llamada por el código nativo (Java) para actualizar las variables CSS
 * y cambiar la apariencia de la ventana flotante en tiempo real.
 * @param {object} theme - Un objeto con { bgColor, textColor, secondaryTextColor }.
 */
function applyThemeUpdate(theme) {
    // --- LOG AÑADIDO ---
    console.log("🎨 FLOATING-UI: ¡Recibida llamada a applyThemeUpdate! Aplicando colores:", theme);
    const root = document.documentElement;
    if (theme.bgColor) root.style.setProperty('--color-bg', theme.bgColor);
    if (theme.textColor) root.style.setProperty('--color-text', theme.textColor);
    if (theme.secondaryTextColor) root.style.setProperty('--text-secondary-color', theme.secondaryTextColor);
    if (theme.surfaceColor) root.style.setProperty('--color-surface', theme.surfaceColor);
    if (theme.accentColor) root.style.setProperty('--color-accent', theme.accentColor);
}

// ==========================================================



// --- LÓGICA PRINCIPAL ---
document.addEventListener('DOMContentLoaded', async () => {
    // Definir la función global INMEDIATAMENTE
    window.updateGameInfo = (gameData) => {
        console.log("Datos del juego recibidos desde Java:", gameData);
        updateGameStatus(gameData);
    };

    // 2. ¡AÑADE LA NUEVA FUNCIÓN AL SCOPE GLOBAL!
    window.applyThemeUpdate = applyThemeUpdate;

    const closeBtn = document.getElementById('close-button');
    if (closeBtn && window.Android) {
        closeBtn.addEventListener('click', () => Android.closeWindow());
    }

    if (window.Android) {
        Android.jsReady();
    }
    
    // --- NUEVO: Elementos del formulario de registro ---
    const registerBtn = document.getElementById('register-btn');
    const appNameInput = document.createElement('input');
    appNameInput.type = 'text';
    appNameInput.placeholder = 'Dale un nombre (ej. Minecraft)';
    appNameInput.className = 'register-input'; // Necesitarás añadir estilos para esta clase

    // Lógica de autenticación y carga
    try {
        const token = window.Android ? await Android.getAuthToken() : localStorage.getItem('authToken_test');
        if (!token) throw new Error("Error de Autenticación");
        localStorage.setItem('authToken', token); 

        const userResponse = await apiFetch('/api/user/me');
        if (userResponse.success) {
            renderProfile(userResponse.data);
        } else {
            throw new Error("No se pudieron obtener los datos del usuario.");
        }

        // --- CARGAR LA LISTA DE AMIGOS AL INICIAR ---
        const friendsContainer = document.getElementById('friends-container');
        friendsContainer.innerHTML = '<p class="friend-status" style="text-align: center;">Cargando amigos...</p>';
        const friendsResponse = await apiFetch('/api/user/friends');
        if (friendsResponse.success) {
            await renderFriends(friendsResponse.friends, friendsContainer);
        }

        // --- CONECTAR A SOCKET.IO Y ESCUCHAR ACTUALIZACIONES ---
        const { default: io } = await import('https://cdn.socket.io/4.7.5/socket.io.esm.min.js');
        socket = io(API_BASE_URL.replace('/app', ''), { path: "/app/socket.io/" });
        
        socket.on('connect', () => {
            socket.emit('authenticate', token);
        });

        // ¡Este es el listener clave para las actualizaciones en tiempo real!
        socket.on('friend_status_update', (data) => {
            console.log('FLOATING: Evento "friend_status_update" RECIBIDO:', data);
            updateFriendStatusInUI(data);
        });


        // ... (lógica de Socket.IO para amigos) ...

        // --- LÓGICA DE REGISTRO ACTUALIZADA ---
        registerBtn.addEventListener('click', () => {
            const registerSection = document.getElementById('registration-section');
            
            // Reemplazamos el botón "Registrar" con el campo de texto y un botón "Guardar"
            registerSection.innerHTML = ''; // Limpiamos la sección
            registerSection.appendChild(appNameInput);
            
            const saveBtn = document.createElement('button');
            saveBtn.textContent = 'Guardar';
            saveBtn.className = 'register-btn';
            
            saveBtn.onclick = () => {
            const newAppName = appNameInput.value.trim();
            if (newAppName && currentPackageName) {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Guardando...';

                const appData = { packageName: currentPackageName, appName: newAppName };
                apiFetch('/api/apps/add', {
                    method: 'POST',
                    body: JSON.stringify(appData),
                }).then(response => {
                    if (response.success) {
                        // ===================================
                        // === ¡LA LÍNEA CORREGIDA! ===
                        // ===================================
                        // En lugar de recargar, le pedimos al servicio nativo que lo haga por nosotros.
                        if (window.Android) {
                            Android.reopenWindow();
                        }
                        // ===================================
                    }
                }).catch(error => {
                    alert(`Error: ${error.message}`);
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Guardar';
                });
            }
        };
        registerSection.appendChild(saveBtn);
        appNameInput.focus();
    });




    } catch (error) {
        document.body.innerHTML = `<h1 style="color:white; text-align:center; padding: 20px;">${error.message}</h1>`;
    }
});