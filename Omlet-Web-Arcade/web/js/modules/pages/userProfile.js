// /js/modules/pages/userProfile.js

import { apiFetch } from '../api.js';
import { getCurrentUserId } from '../state.js';
import { getFullImageUrl,formatTimeAgo  } from '../utils.js';
import { renderPosts } from '../components/postCard.js';
import { setupSideMenu, loadSideMenuData } from '../ui/sideMenu.js';
// <-- 1. CAMBIAMOS LA IMPORTACIÓN
import { initFriendsSidebarUI } from '../ui/friendsSidebar.js';
// <-- 2. YA NO NECESITAMOS IMPORTAR EL SOCKET AQUÍ
/**
 * Módulo completo para la página de Perfil de Usuario.
 */


// --- NUEVAS FUNCIONES PARA TARJETAS DE JUGADOR ---

function renderPlayedGames(games, container, isOwnProfile) {
    if (!games || games.length === 0) {
        container.innerHTML = ''; return;
    }
    const title = isOwnProfile ? "Juegos que juegas" : "Juegos que juega";
    container.innerHTML = `<h3 class="games-title">${title}</h3>` + games.map(game => `
        <a href="#" class="game-item" data-package="${game.package_name}" data-name="${game.app_name}" data-icon="${getFullImageUrl(game.icon_url)}">
            <img src="${getFullImageUrl(game.icon_url)}" class="game-icon" alt="${game.app_name}" onerror="this.onerror=null; this.src='./assets/img/default-avatar.png';"/>
        </a>
    `).join('');
}

function renderPlayerCards(cards, container, placeholder, isOwnProfile) {
    console.log("[FINAL CHECK] Datos que llegan a renderPlayerCards:", JSON.stringify(cards, null, 2));

    if (!cards || cards.length === 0) {
        container.innerHTML = '';
        if (isOwnProfile && placeholder) {
            placeholder.style.display = 'block';
        }
        return;
    }

    if (placeholder) {
        placeholder.style.display = 'none';
    }

    container.innerHTML = cards.map(card => {
        const editableClass = isOwnProfile ? 'editable' : '';

        // ==========================================================
        // === ¡AQUÍ ESTÁ LA CORRECCIÓN DE SINTAXIS! ===
        // ==========================================================
        return `
        <div 
            class="player-card ${editableClass}" 
            style="background-image: url('${getFullImageUrl(card.cover_image_url)}')"
            data-package="${card.package_name}"
            data-card-id="${card.card_id}"
        >
            <div class="player-card-content">
                <div class="player-card-info">
                    <img src="${getFullImageUrl(card.icon_url)}" class="player-card-game-icon">
                    <div class="player-card-details">
                        <span class="game-name">${card.app_name}</span>
                        <span>Usuario: ${card.in_game_username || 'N/A'}</span>
                        <span>ID: ${card.in_game_id || 'N/A'}</span>
                    </div>
                </div>
                ${card.invite_link ? `<div class="player-card-action"><a href="${card.invite_link}" target="_blank" class="invite-btn">Agregar por invitación</a></div>` : ''}
            </div>
        </div>
    `;
        // ==========================================================
    }).join('');
}

export async function initUserProfilePage() {
    // --- 3. LLAMAMOS A LA FUNCIÓN DE UI CORRECTA ---
    // Estas funciones preparan los componentes de la página que no dependen de datos.
    setupSideMenu();
    initFriendsSidebarUI(); 

    // El resto de la función se encarga de cargar los datos del perfil y las pestañas
    // y no necesita cambiar.
    
    // Cargamos los datos del menú lateral (avatar, nombre, etc.)
    loadSideMenuData();

    const params = new URLSearchParams(window.location.search);
    let targetUserId = params.get('id') || getCurrentUserId();
    const loggedInUserId = getCurrentUserId();
    
    if (!targetUserId) {
        window.location.href = 'index.html';
        return;
    }
    const isOwnProfile = String(targetUserId) === String(loggedInUserId);

    // --- Referencias a Elementos del DOM ---
    const mainContent = document.querySelector('main');
    const profileBg = document.getElementById('profile-bg-element');
    const editCoverBtn = document.getElementById('edit-cover-btn');
    const coverFileInput = document.getElementById('cover-file-input');
    const avatar = document.getElementById('profile-avatar');
    const profileFileInput = document.getElementById('profile-file-input');
    const usernameEl = document.getElementById('profile-username');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const postCountEl = document.getElementById('post-count');
    const followersCountEl = document.getElementById('followers-count');
    const followingCountEl = document.getElementById('following-count');
    const followersLink = document.getElementById('followers-link');
    const followingLink = document.getElementById('following-link');
    const followBtn = document.getElementById('follow-btn');
    const chatLinkBtn = document.getElementById('chat-link-btn');
    const savedTab = document.getElementById('saved-tab');
    
    // Elementos de la biografía
    const bioEditorEl = document.getElementById('bio-editor');
    const bioControls = document.getElementById('bio-edit-controls');
    const editBioBtn = document.getElementById('edit-bio-btn');
    const saveBioBtn = document.getElementById('save-bio-btn');
    const editBioBgBtn = document.getElementById('edit-bio-bg-btn');
    const bioBgInput = document.getElementById('bio-bg-input');

    const lastPlayedEl = document.getElementById('last-played'); // <-- Nueva referencia

    // ----------------------------------------------------------------
    // 2. LÓGICA DE PESTAÑAS Y SWIPE
    // ----------------------------------------------------------------
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = Array.from(document.querySelectorAll('.tab-content'));
    const tabContentContainer = document.getElementById('tab-content-container');
    let currentTabIndex = 0;

    // --- FUNCIÓN PRINCIPAL PARA CAMBIAR DE PESTAÑA (CORREGIDA) ---
    async function goToTab(index) {
        if (index < 0 || index >= tabs.length || index === currentTabIndex) return;

        const prevIndex = currentTabIndex;
        const newTab = tabs[index];
        const newContent = tabContents[index];
        const prevContent = tabContents[prevIndex];
        const direction = index > prevIndex ? 'right' : 'left';
        
        tabs[prevIndex].classList.remove('active');
        newTab.classList.add('active');

        // ==========================================================
        // === ¡AQUÍ ESTÁ LA LÓGICA CORREGIDA! ===
        // ==========================================================
        const tabId = newTab.dataset.tab;
        
        // Comprobamos si el panel de contenido ya tiene la marca de "cargado".
        if (!newContent.dataset.loaded) {
            // Si no está cargado, llamamos a la función para que busque los datos.
            await loadTabData(tabId);
            // Marcamos el panel como "cargado" para no volver a pedir los datos.
            newContent.dataset.loaded = 'true';
        }
        // ==========================================================
        
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

     // --- NUEVAS REFERENCIAS AL MODAL ---
    const modal = document.getElementById('player-card-modal');
    const modalTitle = document.getElementById('player-card-modal-title');
    const form = document.getElementById('player-card-form');
    const packageNameInput = document.getElementById('player-card-package-name');
    const coverImageTrigger = document.getElementById('cover-image-trigger');
    const coverImageInput = document.getElementById('cover-image-input');
    const coverImagePreview = document.getElementById('cover-image-preview-img');
    const coverImagePlaceholder = document.getElementById('cover-image-placeholder');
    const existingCoverUrlInput = document.getElementById('existing-cover-url');
    const cancelCardBtn = document.getElementById('cancel-card-btn');
    const saveCardBtn = document.getElementById('save-card-btn');

    let allPlayedGames = [];
    let allPlayerCards = [];

    function openPlayerCardModal(game, card = null) {
        if (!isOwnProfile) return;
        form.reset();
        modalTitle.textContent = `Edita tu tarjeta de jugador de ${game.name}`; // Título más genérico
        packageNameInput.value = game.package;
        
        // Resetear la preview de imagen y el input oculto
        coverImagePreview.src = '';
        coverImagePreview.style.display = 'none';
        coverImagePlaceholder.style.display = 'block';
        existingCoverUrlInput.value = '';

        if (card) {
            form.elements.inGameUsername.value = card.in_game_username || '';
            form.elements.inGameId.value = card.in_game_id || '';
            form.elements.inviteLink.value = card.invite_link || '';
            if (card.cover_image_url) {
                // Guardamos la URL existente en el input oculto
                existingCoverUrlInput.value = card.cover_image_url;
                coverImagePreview.src = getFullImageUrl(card.cover_image_url);
                coverImagePreview.style.display = 'block';
                coverImagePlaceholder.style.display = 'none';
            }
        }
        modal.style.display = 'flex';
    }


    function closePlayerCardModal() { modal.style.display = 'none'; }
    
    // --- LÓGICA DE LA PÁGINA ---

    async function refreshPlayerCards() {
        const container = document.getElementById('player-cards-container');
        const placeholder = document.querySelector('#games-content .games-placeholder');
        if (!container) return;

        try {
            const data = await apiFetch(`/api/user/${targetUserId}/player-cards`);
            allPlayerCards = data.cards || [];
            renderPlayerCards(allPlayerCards, container, placeholder, isOwnProfile);
            
            // Re-inicializamos SortableJS solo si es el perfil del propio usuario
            // y las tarjetas ya han sido renderizadas
            if (isOwnProfile) {
                initSortable();
            }
        } catch (error) { console.error("Error al refrescar las tarjetas de jugador:", error); }
    }
    // ==========================================================
    // === ¡NUEVA FUNCIÓN PARA INICIALIZAR EL ARRASTRE! ===
    // ==========================================================
    function initSortable() {
        const cardsContainer = document.getElementById('player-cards-container');
        // Usamos una variable para evitar reinicializar si ya existe.
        if (cardsContainer.sortableInstance) {
            cardsContainer.sortableInstance.destroy(); // Destruir instancia anterior si existe
        }

        cardsContainer.sortableInstance = new Sortable(cardsContainer, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: async (evt) => {
                // ==========================================================
                // === ¡AQUÍ ESTÁ LA CORRECCIÓN! ===
                // ==========================================================
                // 1. Obtenemos TODOS los hijos del contenedor.
                const allChildren = Array.from(cardsContainer.children);
                
                // 2. FILTRAMOS para quedarnos solo con los elementos que son tarjetas.
                const cardElements = allChildren.filter(child => child.classList.contains('player-card'));

                // 3. Mapeamos los IDs solo de los elementos filtrados.
                const orderedCardIds = cardElements.map(card => card.dataset.cardId);
                // ==========================================================
                
                console.log("[SORTABLE LOG] Nuevo orden de IDs a enviar:", orderedCardIds);
                
                try {
                    await apiFetch('/api/user/player-cards/reorder', {
                        method: 'POST',
                        body: JSON.stringify({ orderedCardIds })
                    });
                    console.log("[SORTABLE LOG] Nuevo orden de tarjetas guardado en el backend.");
                } catch (error) {
                    console.error("Error al guardar el nuevo orden:", error);
                    alert("No se pudo guardar el nuevo orden.");
                }
            }
        });
    }

    // --- LÓGICA DE CARGA DE DATOS PARA CADA PESTAÑA ---
    async function loadTabData(tabId) {
        const dataContainerId = `${tabId}-container`;
        const dataContainer = document.getElementById(dataContainerId);

        let endpoint = '';
        if (tabId === 'posts') endpoint = `/api/posts/user/${targetUserId}`;
        else if (tabId === 'saved' && isOwnProfile) endpoint = `/api/posts/saved`;
        else if (tabId === 'games') endpoint = `/api/user/${targetUserId}/played-games`;
        
        if (!endpoint) return;

        if (dataContainer) dataContainer.innerHTML = `<p class='text-center text-gray-400 p-8'>Cargando...</p>`;
        
        try {
            const data = await apiFetch(endpoint);
            
            if (tabId === 'posts' || tabId === 'saved') {
                if(dataContainer) renderPosts(data.posts, dataContainer);
            } else if (tabId === 'games') {
                allPlayedGames = data.games || [];
                renderPlayedGames(allPlayedGames, dataContainer, isOwnProfile);
                // Después de cargar los juegos, cargamos las tarjetas
                await refreshPlayerCards();
            }
        } catch (error) {
            console.error(`Error al cargar datos para la pestaña ${tabId}:`, error);
            if (dataContainer) dataContainer.innerHTML = `<p class='text-center text-red-500 p-8'>${error.message}</p>`;
        }
    }
    
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => goToTab(index));
    });

    let touchStartX = 0;
    if (tabContentContainer) {
        tabContentContainer.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
        tabContentContainer.addEventListener('touchend', e => {
            const deltaX = e.changedTouches[0].screenX - touchStartX;
            if (Math.abs(deltaX) < 75) return;
            goToTab(deltaX < 0 ? currentTabIndex + 1 : currentTabIndex - 1);
        });
    }

    // ----------------------------------------------------------------
    // 3. LÓGICA DE EDICIÓN (SOLO PARA EL DUEÑO DEL PERFIL)
    // ----------------------------------------------------------------
    
    let quill; // Instancia de Quill.js
    let originalBioContent = '';

    const setupEditing = () => {
        // Inicializar Quill
        quill = new Quill(bioEditorEl, {
            modules: { toolbar: [ [{ 'size': ['small', false, 'large', 'huge'] }], ['bold', 'italic', 'underline'], [{ 'color': [] }, { 'background': [] }], [{ 'align': [] }], ['image', 'link'] ] },
            theme: 'snow'
        });
        quill.enable(false); // Deshabilitado por defecto
        
        // Botón Editar/Cancelar Biografía
        editBioBtn.addEventListener('click', () => {
            const isEditing = bioEditorEl.classList.contains('editing');
            quill.enable(!isEditing);
            bioEditorEl.classList.toggle('editing');
            saveBioBtn.style.display = isEditing ? 'none' : 'inline-block';
            quill.getModule('toolbar').container.style.display = isEditing ? 'none' : 'block';
            editBioBtn.textContent = isEditing ? '✏️ Editar' : '❌ Cancelar';
            if (isEditing) quill.root.innerHTML = originalBioContent; // Restaura si cancela
            else originalBioContent = quill.root.innerHTML; // Guarda el estado original
        });

        // Botón Guardar Biografía
        saveBioBtn.addEventListener('click', async () => {
            const bioContent = quill.root.innerHTML;
            try {
                await apiFetch('/api/user/complete-profile', {
                    method: 'POST',
                    body: JSON.stringify({ bio: bioContent })
                });
                quill.enable(false);
                bioEditorEl.classList.remove('editing');
                saveBioBtn.style.display = 'none';
                quill.getModule('toolbar').container.style.display = 'none';
                editBioBtn.textContent = '✏️ Editar';
                alert('Biografía guardada.');
            } catch (error) {
                alert(`Error al guardar: ${error.message}`);
            }
        });

        // Subida de imágenes para la biografía
        editBioBgBtn.addEventListener('click', () => bioBgInput.click());
        bioBgInput.addEventListener('change', async (e) => handleFileUpload(e.target.files[0], '/api/user/upload-bio-bg', (url) => {
            document.getElementById('about-content').style.backgroundImage = `url(${url})`;
        }));

        // Subida de imágenes para la portada y el avatar
        editCoverBtn.addEventListener('click', () => coverFileInput.click());
        coverFileInput.addEventListener('change', async (e) => handleFileUpload(e.target.files[0], '/api/user/upload-cover-pic', (url) => {
            profileBg.style.backgroundImage = `url(${url})`;
        }));
        
        avatar.classList.add('editable');
        avatar.addEventListener('click', () => profileFileInput.click());
        profileFileInput.addEventListener('change', async (e) => handleFileUpload(e.target.files[0], '/api/user/upload-profile-pic', (url) => {
            avatar.src = url;
        }));
    };
    
    const handleFileUpload = async (file, endpoint, onSuccess) => {
        if (!file) return;
        const formData = new FormData();
        // La clave del archivo depende del endpoint
        const key = endpoint.includes('cover') ? 'coverPic' : (endpoint.includes('profile') ? 'profilePic' : 'image');
        formData.append(key, file);
        
        try {
            const result = await apiFetch(endpoint, { method: 'POST', body: formData });
            // El backend devuelve diferentes claves para la URL, las unificamos
            const url = result.url || result.coverPicUrl || result.profilePicUrl;
            if (url) {
                onSuccess(getFullImageUrl(url));
            }
        } catch (error) {
            alert(`Error al subir archivo: ${error.message}`);
        }
    };


    // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
    // ▼▼▼         PEGA TU BLOQUE DE CÓDIGO EXACTAMENTE AQUÍ         ▼▼▼
    // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼

    // Listener para abrir el modal al hacer clic en un icono de juego
    const gamesGrid = document.getElementById('games-container');
    if (gamesGrid) {
        gamesGrid.addEventListener('click', (e) => {
            const gameItem = e.target.closest('.game-item');
            if (gameItem && isOwnProfile) {
                e.preventDefault();
                const game = {
                    package: gameItem.dataset.package,
                    name: gameItem.dataset.name,
                    icon: gameItem.dataset.icon,
                };
                const existingCard = allPlayerCards.find(c => c.package_name === game.package);
                openPlayerCardModal(game, existingCard);
            }
        });
    }

    // ==========================================================
    // === ¡NUEVO LISTENER PARA EDITAR LAS TARJETAS EXISTENTES! ===
    // ==========================================================
    const playerCardsContainer = document.getElementById('player-cards-container');
    if (playerCardsContainer) {
        playerCardsContainer.addEventListener('click', (e) => {
            // Solo permitir la edición si es el perfil del propio usuario
            if (!isOwnProfile) return;

            const cardElement = e.target.closest('.player-card');
            if (cardElement) {
                e.preventDefault();
                const packageName = cardElement.dataset.package;
                const cardToEdit = allPlayerCards.find(c => c.package_name === packageName);

                if (cardToEdit) {
                    // Construimos el objeto 'game' que la función del modal necesita
                    const gameForModal = {
                        package: cardToEdit.package_name,
                        name: cardToEdit.app_name,
                        icon: getFullImageUrl(cardToEdit.icon_url)
                    };
                    // Llamamos a la misma función, pero esta vez pasamos la tarjeta a editar
                    openPlayerCardModal(gameForModal, cardToEdit);
                }
            }
        });
    }

    // Listeners del modal
    if(cancelCardBtn) cancelCardBtn.addEventListener('click', closePlayerCardModal);
    if(coverImageTrigger) coverImageTrigger.addEventListener('click', () => coverImageInput.click());
    if(coverImageInput) coverImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            coverImagePreview.src = URL.createObjectURL(file);
            coverImagePreview.style.display = 'block';
            coverImagePlaceholder.style.display = 'none';
        }
    });

    if(form) form.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveCardBtn.disabled = true;
        saveCardBtn.textContent = 'Guardando...';
        const formData = new FormData(form);
        try {
            // ==========================================================
            // === ¡LÓGICA CORREGIDA! ===
            // ==========================================================
            // 1. Guardamos la tarjeta
            await apiFetch('/api/user/player-cards', { method: 'POST', body: formData });
            
            // 2. Cerramos el modal
            closePlayerCardModal();
            
            // 3. ¡LA CLAVE! Refrescamos la lista COMPLETA desde el servidor.
            //    Esto asegura que `allPlayerCards` tenga los datos más recientes
            //    (incluyendo el nuevo card_id) antes de que se intente reordenar.
            await refreshPlayerCards(); 
            
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            saveCardBtn.disabled = false;
            saveCardBtn.textContent = 'Guardar';
        }
    });
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    // ▲▲▲              HASTA AQUÍ LLEGA TU BLOQUE DE CÓDIGO              ▲▲▲
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲


    // ==========================================================
    // DESPUÉS DE ESTO: Comienza la lógica de carga de datos inicial 
    // que se ejecuta una sola vez.
    // ==========================================================

    // ----------------------------------------------------------------
    // 4. CARGA PRINCIPAL DE DATOS Y RENDERIZADO
    // ----------------------------------------------------------------
    try {
        const { data: user } = await apiFetch(`/api/user/profile/${targetUserId}`);
        
        // Rellenar datos
        if (profileBg) profileBg.style.backgroundImage = `url(${getFullImageUrl(user.cover_pic_url)})`;
        if (avatar) avatar.src = getFullImageUrl(user.profile_pic_url);
        if (usernameEl) usernameEl.textContent = user.username;
        if (postCountEl) postCountEl.textContent = user.post_count;
        if (followersCountEl) followersCountEl.textContent = user.followers_count;
        if (followingCountEl) followingCountEl.textContent = user.following_count;
        if (followersLink) followersLink.href = `followers_list.html?userId=${targetUserId}&type=followers`;
        if (followingLink) followingLink.href = `followers_list.html?userId=${targetUserId}&type=following`;
        if (document.getElementById('about-content') && user.bio_bg_url) {
            document.getElementById('about-content').style.backgroundImage = `url(${getFullImageUrl(user.bio_bg_url)})`;
        }
         // ==========================================================
        // === ¡NUEVA LÓGICA PARA "ÚLTIMO JUEGO JUGADO"! ===
        // ==========================================================
        if (lastPlayedEl) {
            if (user.last_played_game && user.last_played_at) {
                lastPlayedEl.textContent = `🎮 Jugó a ${user.last_played_game} ${formatTimeAgo(user.last_played_at)}`;
                lastPlayedEl.style.display = 'block';
            } else {
                lastPlayedEl.style.display = 'none'; // Ocultar si no ha jugado a nada
            }
        }
        // ==========================================================
        // Lógica condicional (dueño vs. visitante)
        if (isOwnProfile) {
            editProfileBtn.style.display = 'inline';
            savedTab.style.display = 'block';
            bioControls.style.display = 'flex';
            editCoverBtn.style.display = 'block';
            setupEditing();
            quill.root.innerHTML = user.bio || '<p>Escribe algo sobre ti...</p>';
        } else {
            // Lógica para visitantes
            if(followBtn) {
                followBtn.style.display = 'block';
                followBtn.textContent = user.is_followed_by_user ? 'Siguiendo' : 'Seguir';
                followBtn.classList.toggle('following', user.is_followed_by_user);
                followBtn.onclick = async () => {
                    const data = await apiFetch(`/api/user/follow/${targetUserId}`, {method: 'POST'});
                    const isFollowing = data.action === 'followed';
                    followersCountEl.textContent = isFollowing ? parseInt(followersCountEl.textContent) + 1 : parseInt(followersCountEl.textContent) - 1;
                    followBtn.textContent = isFollowing ? 'Siguiendo' : 'Seguir';
                    followBtn.classList.toggle('following', isFollowing);
                };
            }
            if(chatLinkBtn) {
                chatLinkBtn.style.display = 'flex';
                chatLinkBtn.href = `chat.html?userId=${targetUserId}`;
            }
            // Para visitantes, Quill solo es un visor.
            const viewer = new Quill(bioEditorEl, { theme: 'snow', modules: { toolbar: false } });
            viewer.root.innerHTML = user.bio || '<p>Este usuario aún no ha escrito una biografía.</p>';
            viewer.enable(false);
        }
        
        // Cargar contenido de la primera pestaña y ajustar altura
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
    } catch (error) {
        mainContent.innerHTML = `<p class="text-center text-red-500 p-8">${error.message}</p>`;
    }
}