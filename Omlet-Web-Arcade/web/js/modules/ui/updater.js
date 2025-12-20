// /web/js/modules/ui/updater.js

import { apiFetch } from '../api.js';
import { AppUpdater } from './nativeBridge.js';

export async function checkForUpdates() {
    if (!AppUpdater) {
        console.log("Modo navegador, se omite la comprobación de actualizaciones.");
        return;
    }

    try {
        // Obtenemos ambas versiones en paralelo
        const [localVersionResult, serverVersionResponse] = await Promise.all([
            AppUpdater.getAppVersion(),
            apiFetch('/api/app/latest-version')
        ]);

        // ==========================================================
        // === ¡AQUÍ ESTÁ LA LÓGICA CORREGIDA Y CON DEPURACIÓN! ===
        // ==========================================================
        
        // 1. Convertimos ambos códigos a números enteros para una comparación segura.
        const localCode = parseInt(localVersionResult.versionCode, 10);
        const serverCode = parseInt(serverVersionResponse.versionCode, 10);

        // 2. Añadimos logs para ver exactamente qué estamos comparando.
        console.log(`[AppUpdater] Versión Local: ${localCode} (Nombre: ${localVersionResult.versionName})`);
        console.log(`[AppUpdater] Versión Servidor: ${serverCode} (Nombre: ${serverVersionResponse.versionName})`);
        
        // 3. Comparamos los números.
        if (serverCode > localCode) {
            console.log("[AppUpdater] ¡Se encontró una actualización! Mostrando modal.");
            // ¡Hay una actualización! Mostramos el modal.
            const modal = document.getElementById('update-modal');
            const notesEl = document.getElementById('update-notes');
            const updateBtn = document.getElementById('update-now-btn');

            if (!modal || !notesEl || !updateBtn) return;

            notesEl.textContent = serverVersionResponse.notes || "Hay mejoras y correcciones de errores.";
            modal.style.display = 'flex';

            updateBtn.onclick = async () => {
                updateBtn.disabled = true;
                updateBtn.textContent = 'Descargando...';
                try {
                    // El botón ahora cambia a "Instalando..." por sí solo si la descarga tiene éxito.
                    const result = await AppUpdater.downloadAndInstall({ url: serverVersionResponse.downloadUrl });
                    console.log("[AppUpdater] El plugin de descarga respondió:", result);
                    updateBtn.textContent = 'Instalando...';
                } catch (error) {
                    alert(`Error al descargar: ${error.message}`);
                    updateBtn.disabled = false;
                    updateBtn.textContent = 'Actualizar Ahora';
                }
            };
        } else {
            console.log("[AppUpdater] La aplicación ya está actualizada. No se hace nada.");
        }
        // ==========================================================

    } catch (error) {
        console.error("Error al comprobar actualizaciones:", error);
        // Opcional: Mostrar un toast o un mensaje sutil si falla la comprobación
    }
}