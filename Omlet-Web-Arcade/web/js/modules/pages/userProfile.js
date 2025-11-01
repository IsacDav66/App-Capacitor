// /js/modules/pages/userProfile.js

import { apiFetch } from '../api.js';
import { getCurrentUserId } from '../state.js';
import { getFullImageUrl } from '../utils.js';
import { renderPosts } from '../components/postCard.js';
import { setupSideMenu, loadSideMenuData } from '../ui/sideMenu.js';
// <-- 1. CAMBIAMOS LA IMPORTACIÓN
import { initFriendsSidebarUI } from '../ui/friendsSidebar.js';
// <-- 2. YA NO NECESITAMOS IMPORTAR EL SOCKET AQUÍ
/**
 * Módulo completo para la página de Perfil de Usuario.
 */
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

    // ----------------------------------------------------------------
    // 2. LÓGICA DE PESTAÑAS Y SWIPE
    // ----------------------------------------------------------------
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

        // Carga de contenido bajo demanda
        const tabId = tabs[index].dataset.tab;
        const container = newContent.querySelector(`#${tabId}-container`);
        if (container && container.innerHTML.trim() === '') {
            await loadTabData(tabId, container);
        }
        
        // Animación de deslizamiento
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
    
    async function loadTabData(tabId, container) {
        let endpoint = '';
        if (tabId === 'posts') endpoint = `/api/posts/user/${targetUserId}`;
        else if (tabId === 'saved' && isOwnProfile) endpoint = `/api/posts/saved`;
        
        if (!endpoint) return;
        
        container.innerHTML = `<p class='text-center text-gray-400 p-8'>Cargando...</p>`;
        try {
            const data = await apiFetch(endpoint);
            renderPosts(data.posts, container);
        } catch (error) {
            container.innerHTML = `<p class='text-center text-red-500 p-8'>${error.message}</p>`;
        }
    }
    
    tabs.forEach((tab, index) => tab.addEventListener('click', () => goToTab(index)));

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