// /js/modules/pages/categorizeApps.js

import { apiFetch } from '../api.js';
import { getFullImageUrl } from '../utils.js';

function renderHistoryList(apps, container) {
    if (!apps || apps.length === 0) {
        container.innerHTML = '<p class="search-placeholder">No tienes apps en tu historial.</p>';
        return;
    }

    container.innerHTML = apps.map(app => {
        let statusText = '';
        let statusClass = '';

        if (app.is_game === true) {
            statusText = 'Es un juego';
            statusClass = 'status-game';
        } else if (app.is_game === false) {
            statusText = 'No es un juego';
            statusClass = 'status-not-game';
        } else {
            statusText = 'Pendiente';
            statusClass = 'status-pending';
        }

        return `
            <div class="app-item" data-package="${app.package_name}">
                <img src="${getFullImageUrl(app.icon_url)}" class="app-icon" onerror="this.onerror=null; this.src='./assets/img/default-avatar.png';">
                <div class="app-info">
                    <span class="font-bold">${app.app_name}</span>
                </div>
                <div class="app-status ${statusClass}">
                    ${statusText}
                </div>
            </div>
        `;
    }).join('');
}

export async function initCategorizeAppsPage() {
    const container = document.getElementById('apps-list-container');
    if (!container) return;

    // Mantenemos el mensaje de "Cargando..."
    container.innerHTML = '<p class="search-placeholder">Sincronizando historial...</p>';

    // ==========================================================
    // === ¡AQUÍ ESTÁ LA CORRECCIÓN! ===
    // ==========================================================
    // Añadimos un retardo de 1 segundo (1000 milisegundos) antes de pedir los datos.
    // Esto le da tiempo al servicio en segundo plano (OverlayService) y al socket
    // para registrar la última app utilizada en la base de datos.
    setTimeout(async () => {
        try {
            const data = await apiFetch('/api/apps/history');
            
            console.log("Datos recibidos de la API /history:", JSON.stringify(data, null, 2));

            if (data.success) {
                renderHistoryList(data.apps, container);
            } else {
                container.innerHTML = `<p class="search-placeholder" style="color: red;">${data.message}</p>`;
            }
        } catch (error) {
            container.innerHTML = `<p class="search-placeholder" style="color: red;">${error.message}</p>`;
        }
    }, 1000); // 1 segundo de retardo
    // ==========================================================
}