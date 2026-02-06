import { apiFetch } from '../api.js';
import { getFullImageUrl } from '../utils.js';

export async function initBotListPage() {
    const container = document.getElementById('bots-grid-container');

    async function loadBots() {
        container.innerHTML = '<p class="text-center col-span-full">Iniciando sistemas de IA...</p>';
        // Ruta corregida a /api/user/...
        const response = await apiFetch('/api/user/admin/bots');
        
        if (response.success) {
            renderGrid(response.bots);
        }
    }

    function renderGrid(bots) {
        container.innerHTML = bots.map(bot => `
            <div class="bot-item-card" onclick="window.location.href='bot_manager.html?id=${bot.id}'">
                <img src="${getFullImageUrl(bot.profile_pic_url)}" class="bot-item-avatar" onerror="this.src='./assets/img/default-avatar.png'">
                <span class="bot-item-name">${bot.username}</span>
                <span class="text-xs text-indigo-400 font-bold">ONLINE</span>
            </div>
        `).join('');
        
        // Botón para añadir uno nuevo
        const addCard = document.createElement('div');
        addCard.className = "bot-item-card add-bot-btn";
        addCard.innerHTML = `<span>+</span>`;
        addCard.onclick = handleCreateBot;
        
        container.appendChild(addCard);
    }

    // --- FUNCIÓN PARA CREAR EL BOT ---
    async function handleCreateBot() {
        const name = prompt("Introduce el nombre para el nuevo Bot:");
        if (!name || name.trim() === "") return;

        try {
            const res = await apiFetch('/api/user/admin/bots/create', {
                method: 'POST',
                body: JSON.stringify({ username: name })
            });

            if (res.success) {
                // Redirigir inmediatamente al panel del nuevo bot
                window.location.href = `bot_manager.html?id=${res.botId}`;
            } else {
                alert("Error al crear bot: " + res.message);
            }
        } catch (e) {
            alert("Error de conexión");
        }
    }

    loadBots();
}