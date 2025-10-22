// /js/modules/pages/search.js

import { apiFetch } from '../api.js';
import { getFullImageUrl } from '../utils.js';
import { getCurrentUserId } from '../state.js';

const SEARCH_HISTORY_KEY = 'omletSearchHistory';

function getSearchHistory() {
    try {
        return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function addToSearchHistory(term) {
    if (!term) return;
    let history = getSearchHistory().filter(item => item.toLowerCase() !== term.toLowerCase());
    history.unshift(term);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
}

function renderSearchHistory(container, resultsContainer) {
    const history = getSearchHistory();
    if (history.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }
    const itemsHTML = history.map(item => `
        <div class="history-item">
            <span class="history-term" onclick="searchFromHistory('${item}')">${item}</span>
            <button class="remove-history-item" onclick="removeFromHistory('${item}')">&times;</button>
        </div>`).join('');
    container.innerHTML = `<div class="history-header"><span>Búsquedas recientes</span><button id="clear-history-btn" onclick="clearSearchHistory()">Limpiar todo</button></div>${itemsHTML}`;
    container.style.display = 'block';
    resultsContainer.innerHTML = '';
}

function renderSearchResults(users, container) {
    const loggedInUserId = getCurrentUserId();
    if (users.length === 0) {
        container.innerHTML = '<p class="search-placeholder">No se encontraron resultados.</p>';
        return;
    }
    const usersHTML = users.map(user => {
        const profilePic = getFullImageUrl(user.profile_pic_url);
        const youLabelHTML = (loggedInUserId && user.id === loggedInUserId) ? '<span class="you-label">(Tú)</span>' : '';
        return `
            <a href="user_profile.html?id=${user.id}" class="search-result-item">
                <img src="${profilePic}" alt="Avatar" class="search-result-avatar" />
                <div class="search-result-info">
                    <span class="search-result-username">${user.username}</span>
                    ${youLabelHTML}
                </div>
            </a>`;
    }).join('');
    container.innerHTML = usersHTML;
}

export function initSearchPage() {
    const searchInput = document.getElementById('search-input');
    const historyContainer = document.getElementById('search-history-container');
    const resultsContainer = document.getElementById('search-results-container');
    let debounceTimer;

    const performSearch = async (term) => {
        try {
            const data = await apiFetch(`/api/user/search?q=${encodeURIComponent(term)}`);
            if (data.success) {
                if (data.users.length > 0) addToSearchHistory(term);
                renderSearchResults(data.users, resultsContainer);
            }
        } catch (error) {
            resultsContainer.innerHTML = `<p class="search-placeholder">${error.message}</p>`;
        }
    };

    renderSearchHistory(historyContainer, resultsContainer);

    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const searchTerm = searchInput.value.trim();
        if (searchTerm.length === 0) {
            resultsContainer.innerHTML = '';
            renderSearchHistory(historyContainer, resultsContainer);
            return;
        }
        historyContainer.style.display = 'none';
        resultsContainer.innerHTML = '<p class="search-placeholder">Buscando...</p>';
        debounceTimer = setTimeout(() => performSearch(searchTerm), 300);
    });
    
    // Asignar funciones a window para los onclick
    window.searchFromHistory = (term) => {
        searchInput.value = term;
        performSearch(term);
    };
    window.removeFromHistory = (term) => {
        let history = getSearchHistory().filter(item => item !== term);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
        renderSearchHistory(historyContainer, resultsContainer);
    };
    window.clearSearchHistory = () => {
        localStorage.removeItem(SEARCH_HISTORY_KEY);
        renderSearchHistory(historyContainer, resultsContainer);
    };
}