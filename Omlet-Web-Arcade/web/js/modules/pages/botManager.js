import { apiFetch, API_BASE_URL } from '../api.js';
import { getFullImageUrl } from '../utils.js';

// --- VARIABLES GLOBALES DEL MÓDULO ---
let currentBot = null; // Aquí guardaremos toda la info del bot actual
let timerInterval = null;
let currentProfilePicUrl = "";
let currentCoverPicUrl = "";

// --- FUNCIÓN DE UTILIDAD: TOAST ---
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '100px'; 
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    toast.style.zIndex = '10000';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '50px';
    toast.style.color = 'white';
    toast.style.fontSize = '14px';
    toast.style.fontWeight = 'bold';
    toast.style.textAlign = 'center';
    toast.style.whiteSpace = 'nowrap';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    toast.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    toast.style.opacity = '0';
    toast.style.pointerEvents = 'none';
    
    if (type === 'error') toast.style.backgroundColor = '#ef4444';
    else if (type === 'info') toast.style.backgroundColor = '#3b82f6';
    else toast.style.backgroundColor = 'var(--color-accent)';

    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 50);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

export async function initBotManagerPage() {
    const listContainer = document.getElementById('bots-list');
    const postsContainer = document.getElementById('bot-posts-list');
    const urlParams = new URLSearchParams(window.location.search);
    const botId = urlParams.get('id');

    if (!botId) {
        window.location.href = 'bot_list.html';
        return;
    }

    async function loadBotData() {
        try {
            const res = await apiFetch(`/api/user/admin/bots`);
            if (res.success) {
                const bot = res.bots.find(b => b.id == botId);
                if (bot) {
                    // Sincronizamos las variables globales
                    currentBot = bot; 
                    currentProfilePicUrl = bot.profile_pic_url || "";
                    currentCoverPicUrl = bot.cover_pic_url || "";
                    
                    renderBotEditor(bot);
                    startCountdown(bot.bot_next_post_at);
                    loadBotPosts(); 
                }
            }
        } catch (error) {
            showToast("Error al cargar datos", "error");
        }
    }

    async function loadBotPosts() {
        if (!postsContainer) return;
        try {
            const res = await apiFetch(`/api/posts/user/${botId}`);
            if (res.success && res.posts.length > 0) {
                renderBotPosts(res.posts);
            } else {
                postsContainer.innerHTML = '<p class="text-center text-gray-500 py-4">Sin publicaciones.</p>';
            }
        } catch (error) {
            postsContainer.innerHTML = '<p class="text-center text-red-400">Error en posts.</p>';
        }
    }

    function renderBotEditor(bot) {
        const avatarUrl = bot.profile_pic_url ? getFullImageUrl(bot.profile_pic_url) : './assets/img/default-avatar.png';
        const coverUrl = bot.cover_pic_url ? getFullImageUrl(bot.cover_pic_url) : '';

        listContainer.innerHTML = `
            <div class="bot-admin-card" data-id="${bot.id}">
                <div id="next-post-timer" class="next-post-badge">
                    <span class="pulse-icon"></span>
                    <span id="timer-text">Calculando tiempo...</span>
                </div>
                <div class="bot-cover-preview" id="cover-preview-box" 
                     style="background-image: url('${coverUrl}'); background-color: #222;">
                    <input type="file" class="hidden" id="bot-cover-input" accept="image/*">
                    <button class="edit-cover-camera-btn edit-cover-trigger" id="btn-edit-cover">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </button>
                </div>

                <div class="bot-card-header">
                    <div class="avatar-edit-container" style="margin-top: -55px;">
                        <img src="${avatarUrl}" id="avatar-img-preview" class="bot-avatar-main shadow-2xl" onerror="this.src='./assets/img/default-avatar.png'">
                        <input type="file" class="hidden" id="bot-avatar-input" accept="image/*">
                        <button class="edit-pic-fab" id="btn-edit-avatar">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        </button>
                    </div>
                    <div class="bot-identity">
                        <span class="bot-badge">AI BOT</span>
                        <input type="text" value="${bot.username}" class="modern-input bot-name" placeholder="Nombre">
                    </div>
                </div>

                <div class="bot-card-body">
                    <div class="input-group">
                        <label>Bio Pública</label>
                        <textarea class="modern-textarea bot-bio" placeholder="IDK">${bot.bio || ''}</textarea>
                    </div>

                    <div class="input-group">
                        <label style="color: var(--color-accent)">Personalidad IA</label>
                        <textarea class="modern-textarea bot-personality-secret" placeholder="Instrucciones secretas...">${bot.bot_personality || ''}</textarea>
                    </div>

                    <div class="input-group">
                        <label style="color: #facc15">🔑 Gemini API Key</label>
                        <input type="password" value="${bot.gemini_api_key || ''}" class="modern-input bot-gemini-key">
                    </div>

                    <!-- Programador -->
                    <div class="scheduler-container">
                        <select class="bot-schedule-type" id="schedule-type">
                            <option value="interval" ${bot.bot_schedule_type === 'interval' ? 'selected' : ''}>Intervalo Fijo</option>
                            <option value="random_range" ${bot.bot_schedule_type === 'random_range' ? 'selected' : ''}>Rango Aleatorio</option>
                            <option value="specific_hours" ${bot.bot_schedule_type === 'specific_hours' ? 'selected' : ''}>Horas Específicas</option>
                        </select>
                        <div id="config-interval" class="mt-2">
                            <div class="flex-gap-2">
                                <input type="number" value="${bot.bot_min_minutes || 30}" class="bot-min-min" placeholder="Min">
                                <input type="number" id="max-input-container" value="${bot.bot_max_minutes || 60}" class="bot-max-min" placeholder="Max">
                            </div>
                        </div>
                        <div id="config-hours" class="mt-3 hidden">
                            <input type="text" value="${bot.bot_specific_hours || ''}" class="bot-hours" placeholder="08:00, 20:00">
                        </div>
                    </div>

                    <button class="save-bot-action-btn save-bot-btn mt-6">Guardar Cambios</button>
                    <button class="trigger-bot-post-btn" style="background: #3b82f6; color: white; width: 100%; padding: 12px; border-radius: 20px; font-weight: bold; margin-top: 10px; border: none;">🚀 Publicar Ahora (IA)</button>
                    
                    <button id="btn-delete-bot-permanent" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; width: 100%; padding: 12px; border-radius: 20px; font-weight: bold; margin-top: 40px; border: 1px solid #ef4444;">
                        ⚠️ Eliminar Bot Permanentemente
                    </button>
                </div>
            </div>
        `;
        attachEvents();
    }

    function renderBotPosts(posts) {
        postsContainer.innerHTML = posts.map(post => `
            <div class="bot-mini-post" id="post-row-${post.post_id}">
                <div class="bot-post-content">${post.content || 'Imagen'}</div>
                <button class="delete-mini-btn" onclick="confirmDeleteBotPost(${post.post_id})">🗑️</button>
            </div>
        `).join('');
    }

    function attachEvents() {
        const token = localStorage.getItem('authToken');
        const card = document.querySelector('.bot-admin-card');

        // Lógica de visibilidad Scheduler
        const st = document.getElementById('schedule-type');
        const updateScheduleUI = (val) => {
            const intervalDiv = document.getElementById('config-interval');
            const hoursDiv = document.getElementById('config-hours');
            const maxContainer = document.getElementById('max-input-container');
            if (val === 'specific_hours') {
                intervalDiv.classList.add('hidden');
                hoursDiv.classList.remove('hidden');
            } else {
                intervalDiv.classList.remove('hidden');
                hoursDiv.classList.add('hidden');
                maxContainer.classList.toggle('hidden', val !== 'random_range');
            }
        };
        if (st) {
            st.onchange = (e) => updateScheduleUI(e.target.value);
            updateScheduleUI(st.value);
        }

        // Avatar
        document.getElementById('btn-edit-avatar').onclick = () => document.getElementById('bot-avatar-input').click();
        document.getElementById('bot-avatar-input').onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('profilePic', file);
            try {
                const response = await fetch(`${API_BASE_URL}/api/user/admin/bots/upload-pic/${botId}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const result = await response.json();
                if (result.success) {
                    currentProfilePicUrl = result.profilePicUrl;
                    document.getElementById('avatar-img-preview').src = getFullImageUrl(result.profilePicUrl);
                    showToast("Avatar actualizado");
                }
            } catch (err) { showToast("Error", "error"); }
        };

        // Portada
        document.getElementById('btn-edit-cover').onclick = () => document.getElementById('bot-cover-input').click();
        document.getElementById('bot-cover-input').onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('coverPic', file);
            try {
                const response = await fetch(`${API_BASE_URL}/api/user/admin/bots/upload-cover/${botId}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const result = await response.json();
                if (result.success) {
                    currentCoverPicUrl = result.coverPicUrl;
                    document.getElementById('cover-preview-box').style.backgroundImage = `url('${getFullImageUrl(result.coverPicUrl)}')`;
                    showToast("Portada actualizada");
                }
            } catch (err) { showToast("Error", "error"); }
        };

        // Guardar
        card.querySelector('.save-bot-btn').onclick = async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            const formData = new FormData();
            formData.append('id', botId);
            formData.append('username', card.querySelector('.bot-name').value.trim());
            formData.append('bio', card.querySelector('.bot-bio').value.trim());
            formData.append('bot_personality', card.querySelector('.bot-personality-secret').value.trim());
            formData.append('gemini_api_key', card.querySelector('.bot-gemini-key').value.trim());
            formData.append('age', parseInt(card.querySelector('.bot-age').value) || 18);
            formData.append('gender', card.querySelector('.bot-gender').value);
            formData.append('bot_allows_images', card.querySelector('.bot-img-toggle').checked);
            formData.append('profile_pic_url', currentProfilePicUrl);
            formData.append('cover_pic_url', currentCoverPicUrl);
            formData.append('bot_schedule_type', card.querySelector('.bot-schedule-type').value);
            formData.append('bot_min_minutes', card.querySelector('.bot-min-min').value);
            formData.append('bot_max_minutes', card.querySelector('.bot-max-min').value);
            formData.append('bot_specific_hours', card.querySelector('.bot-hours').value);

            try {
                const response = await fetch(`${API_BASE_URL}/api/user/admin/update-bot`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const result = await response.json();
                if (result.success) {
                    showToast("¡Configuración guardada!");
                    
                    // REINICIAR EL CRONÓMETRO CON LA NUEVA FECHA
                    if (result.newNextPostAt) {
                        startCountdown(result.newNextPostAt);
                    }
                    
                    setTimeout(() => btn.disabled = false, 2000);
                }
            } catch (err) { showToast("Error", "error"); }
            finally { btn.disabled = false; }
        };

        // Trigger Post
        card.querySelector('.trigger-bot-post-btn').onclick = async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            showToast("Generando...", "info");
            try {
                const res = await apiFetch(`/api/user/admin/bots/trigger-post/${botId}`, { method: 'POST' });
                if (res.success) {
                    showToast("¡Publicado!");
                    setTimeout(() => loadBotData(), 2000); 
                }
            } catch (err) { showToast("Error", "error"); }
            finally { btn.disabled = false; }
        };

        // ELIMINAR (CORREGIDO USANDO VARIABLE GLOBAL)
        const deleteBtn = document.getElementById('btn-delete-bot-permanent');
        if (deleteBtn) {
            deleteBtn.onclick = async () => {
                if (!currentBot) return;
                const confirmName = prompt(`Para eliminar a ${currentBot.username}, escribe su nombre exactamente:`);
                if (confirmName === currentBot.username) {
                    showToast("Eliminando...", "info");
                    try {
                        const res = await apiFetch(`/api/user/admin/bots/delete/${botId}`, { method: 'DELETE' });
                        if (res.success) {
                            showToast("Bot eliminado");
                            setTimeout(() => window.location.href = 'bot_list.html', 1500);
                        }
                    } catch (e) { showToast("Error", "error"); }
                } else if (confirmName !== null) {
                    alert("Nombre incorrecto.");
                }
            };
        }
    }

    loadBotData();
}

function startCountdown(targetDateStr) {
    const timerText = document.getElementById('timer-text');
    if (!timerText) return;

    // Si el valor es nulo o vacío
    if (!targetDateStr) {
        timerText.innerText = "Sin programar";
        return;
    }

    if (timerInterval) clearInterval(timerInterval);

    const updateTimer = () => {
        // Convertimos el string de la DB a objeto Date de JS
        const targetDate = new Date(targetDateStr).getTime();
        const now = new Date().getTime();
        const diff = targetDate - now;

        if (isNaN(targetDate)) {
            timerText.innerText = "Fecha no válida";
            return;
        }

        if (diff <= 0) {
            timerText.innerText = "¡Publicando ahora!";
            clearInterval(timerInterval);
            return;
        }

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        timerText.innerText = `Próximo post: ${h}h ${m}m ${s}s`;
    };

    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

window.confirmDeleteBotPost = async (postId) => {
    if (!confirm("¿Eliminar publicación?")) return;
    try {
        const res = await apiFetch(`/api/user/admin/posts/${postId}`, { method: 'DELETE' });
        if (res.success) {
            showToast("Eliminado");
            document.getElementById(`post-row-${postId}`)?.remove();
        }
    } catch (e) { showToast("Error", "error"); }
};