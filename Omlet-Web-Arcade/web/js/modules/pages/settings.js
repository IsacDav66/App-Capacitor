// /js/modules/pages/settings.js

import { GameDetectorPlugin } from '../ui/nativeBridge.js';

export function initSettingsPage() {
    const bubbleToggle = document.getElementById('bubble-toggle');
    const output = document.getElementById('settings-output');
    if (!bubbleToggle || !output) return;

    bubbleToggle.addEventListener('change', async () => {
        if (!GameDetectorPlugin) {
            output.textContent = 'Función no disponible en navegador.';
            bubbleToggle.checked = false;
            return;
        }

        if (bubbleToggle.checked) {
            output.textContent = 'Iniciando servicio...';
            try {
                const result = await GameDetectorPlugin.startFloatingOverlay();
                output.textContent = `✅ Servicio Activo: ${result.message}`;
            } catch (e) {
                output.textContent = `⚠️ Error: ${e.message}. Verifica los permisos.`;
                bubbleToggle.checked = false;
            }
        } else {
             try {
                await GameDetectorPlugin.stopFloatingOverlay();
                output.textContent = 'Servicio detenido.';
            } catch (e) {
                output.textContent = `⚠️ Error al detener: ${e.message}.`;
            }
        }
    });
}