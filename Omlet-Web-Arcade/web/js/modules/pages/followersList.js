// /js/modules/pages/followersList.js

import { apiFetch } from '../api.js';
import { getCurrentUserId } from '../state.js';
import { getFullImageUrl } from '../utils.js';

export async function initFollowersListPage() {
    // ----------------------------------------------------------------
    // 1. SETUP INICIAL Y REFERENCIAS AL DOM
    // ----------------------------------------------------------------
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    const initialType = params.get('type') || 'followers';

    const pageTitle = document.getElementById('page-title');
    const followersTabBtn = document.getElementById('followers-tab');
    const followingTabBtn = document.getElementById('following-tab');
    const swipeContainer = document.getElementById('follow-list-swipe-container');
    const followersContent = document.getElementById('followers-content');
    const followingContent = document.getElementById('following-content');

    if (!userId || !swipeContainer) {
        console.error("Faltan elementos esenciales en followers_list.html");
        return;
    }

    const tabs = [followersTabBtn, followingTabBtn];
    const tabContents = [followersContent, followingContent];
    let currentTabIndex = initialType === 'followers' ? 0 : 1;

    // ----------------------------------------------------------------
    // 2. FUNCIONES DE RENDERIZADO Y FETCH
    // ----------------------------------------------------------------

    const renderFollowList = (users, container) => {
        if (!users || users.length === 0) {
            container.innerHTML = '<p class="search-placeholder">No hay usuarios en esta lista.</p>';
            return;
        }

        const loggedInUserId = getCurrentUserId();
        container.innerHTML = users.map(user => {
            const profilePic = getFullImageUrl(user.profile_pic_url);
            if (loggedInUserId && user.id === loggedInUserId) {
                return `
                    <div class="follow-list-item">
                        <a href="user_profile.html?id=${user.id}" class="follow-list-user-info">
                            <img src="${profilePic}" alt="Avatar" class="follow-list-avatar" />
                            <span class="follow-list-username">${user.username} (Tú)</span>
                        </a>
                    </div>`;
            }
            const isFollowing = user.is_followed_by_user;
            const buttonText = isFollowing ? 'Dejar de seguir' : 'Seguir';
            const buttonClass = isFollowing ? 'follow-btn following' : 'follow-btn';
            return `
                <div class="follow-list-item" id="follow-row-${user.id}">
                    <a href="user_profile.html?id=${user.id}" class="follow-list-user-info">
                        <img src="${profilePic}" alt="Avatar" class="follow-list-avatar" />
                        <span class="follow-list-username">${user.username}</span>
                    </a>
                    <button id="follow-btn-${user.id}" class="${buttonClass}" onclick="toggleFollowInList(${user.id}, this)">
                        ${buttonText}
                    </button>
                </div>`;
        }).join('');
    };

    const fetchFollowList = async (userId, type, container) => {
        container.innerHTML = '<p class="search-placeholder">Cargando lista...</p>';
        try {
            const data = await apiFetch(`/api/user/${userId}/${type}`);
            if (data.success) {
                renderFollowList(data.users, container);
            } else {
                container.innerHTML = `<p class="search-placeholder">${data.message || 'No se pudo cargar la lista.'}</p>`;
            }
        } catch (error) {
            console.error("Error de red al cargar la lista:", error);
            container.innerHTML = '<p class="search-placeholder">Error de red.</p>';
        }
    };

    // ----------------------------------------------------------------
    // 3. LÓGICA DE PESTAÑAS Y ANIMACIÓN (RESTAURADA)
    // ----------------------------------------------------------------

    const goToTab = async (index) => {
        if (index < 0 || index >= tabs.length || index === currentTabIndex) return;
        
        const prevIndex = currentTabIndex;
        const newContent = tabContents[index];
        const prevContent = tabContents[prevIndex];
        const direction = index > prevIndex ? 'right' : 'left';
        
        tabs[prevIndex].classList.remove('active');
        tabs[index].classList.add('active');

        if (newContent.innerHTML.trim() === '') {
            const typeToFetch = index === 0 ? 'followers' : 'following';
            await fetchFollowList(userId, typeToFetch, newContent);
        }
        
        prevContent.style.display = 'block';
        newContent.style.display = 'block';
        newContent.classList.add(direction === 'right' ? 'slide-in-right' : 'slide-in-left');
        
        requestAnimationFrame(() => {
            if (swipeContainer) swipeContainer.style.height = `${newContent.scrollHeight}px`;
            prevContent.classList.remove('active');
            prevContent.classList.add(direction === 'right' ? 'slide-out-left' : 'slide-out-right');
            newContent.classList.add('active');
            newContent.classList.remove('slide-in-left', 'slide-in-right');
        });

        setTimeout(() => {
            prevContent.style.display = 'none';
            prevContent.classList.remove('slide-out-left', 'slide-out-right');
            // Usamos una verificación para asegurarnos de que el índice no ha cambiado durante la animación
            if (currentTabIndex === index && swipeContainer) {
                 swipeContainer.style.height = 'auto';
            }
        }, 350);
        
        currentTabIndex = index;
        history.pushState(null, '', `followers_list.html?userId=${userId}&type=${index === 0 ? 'followers' : 'following'}`);
    };

    // ----------------------------------------------------------------
    // 4. INICIALIZACIÓN Y EVENT LISTENERS
    // ----------------------------------------------------------------

    // Asignar función a window para que los `onclick` del HTML la encuentren
    window.toggleFollowInList = async (targetUserId, buttonElement) => {
        buttonElement.disabled = true;
        try {
            const data = await apiFetch(`/api/user/follow/${targetUserId}`, { method: 'POST' });
            const isNowFollowing = (data.action === 'followed');
            
            document.querySelectorAll(`#follow-btn-${targetUserId}`).forEach(btn => {
                btn.textContent = isNowFollowing ? 'Dejar de seguir' : 'Seguir';
                btn.className = isNowFollowing ? 'follow-btn following' : 'follow-btn';
            });
            
            if (!isNowFollowing) {
                const row = buttonElement.closest('.follow-list-item');
                const parentContainer = row.closest('#following-content');
                if (row && parentContainer) {
                    row.style.transition = 'opacity 0.3s ease';
                    row.style.opacity = '0';
                    setTimeout(() => row.remove(), 300);
                }
            }
        } catch (error) {
            console.error("Error de red:", error);
            alert(`Error: ${error.message}`);
        } finally {
            buttonElement.disabled = false;
        }
    };

    // Listeners de los botones de las pestañas
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => goToTab(index));
    });

    // Listeners para el swipe
    let touchStartX = 0;
    swipeContainer.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    swipeContainer.addEventListener('touchend', e => {
        const deltaX = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(deltaX) < 75) return;
        if (deltaX < 0) goToTab(currentTabIndex + 1);
        else goToTab(currentTabIndex - 1);
    });

    // Función de Carga Inicial
    const initialLoad = async () => {
        try {
            const { data: user } = await apiFetch(`/api/user/profile/${userId}`);
            pageTitle.textContent = user.username;
        } catch (e) { 
            pageTitle.textContent = "Lista"; 
        }

        const initialContent = tabContents[currentTabIndex];
        tabs[currentTabIndex].classList.add('active');
        initialContent.style.display = 'block';
        initialContent.classList.add('active');

        await fetchFollowList(userId, initialType, initialContent);
        
        requestAnimationFrame(() => {
           if(swipeContainer) {
                swipeContainer.style.height = `${initialContent.scrollHeight}px`;
                setTimeout(() => swipeContainer.style.height = 'auto', 350);
           }
        });
    };

    // Ejecutar la carga inicial
    await initialLoad();
}