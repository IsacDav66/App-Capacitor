// /js/modules/pages/settings.js

import { GameDetectorPlugin } from '../ui/nativeBridge.js';

export function initSettingsPage() {
    // --- 1. REFERENCIAS AL DOM ---
    const bubbleToggle = document.getElementById('bubble-toggle');
    const output = document.getElementById('settings-output');
    
    // Referencias al nuevo modal
    const permissionModal = document.getElementById('permission-modal');
    const modalTitle = document.getElementById('permission-modal-title');
    const modalText = document.getElementById('permission-modal-text');
    const cancelBtn = document.getElementById('permission-cancel-btn');
    const grantBtn = document.getElementById('permission-grant-btn');

    if (!bubbleToggle || !output || !permissionModal) return;

    // --- 2. FUNCIÓN AUXILIAR PARA EL MODAL ---
    /**
     * Muestra un modal de confirmación y devuelve una promesa que se resuelve
     * con `true` si el usuario acepta o `false` si cancela.
     * @param {string} title - El título del modal.
     * @param {string} text - El texto descriptivo del modal.
     * @returns {Promise<boolean>}
     */
    function requestPermissionFromUser(title, text) {
        return new Promise((resolve) => {
            modalTitle.textContent = title;
            modalText.textContent = text;
            permissionModal.style.display = 'flex';

            grantBtn.onclick = () => {
                permissionModal.style.display = 'none';
                resolve(true); // El usuario aceptó
            };

            cancelBtn.onclick = () => {
                permissionModal.style.display = 'none';
                resolve(false); // El usuario canceló
            };
        });
    }

    // --- 3. LÓGICA PRINCIPAL DEL TOGGLE (ACTUALIZADA) ---
    bubbleToggle.addEventListener('change', async () => {
        if (!GameDetectorPlugin) {
            output.textContent = 'Función no disponible en navegador.';
            bubbleToggle.checked = false;
            return;
        }

        if (bubbleToggle.checked) {
            output.textContent = 'Activando...';
            try {
                const result = await GameDetectorPlugin.startFloatingOverlay();
                output.textContent = `✅ Servicio Activo: ${result.message}`;
            } catch (error) {
                console.error("Error al iniciar el overlay:", error);
                
                let userAccepted = false;

                if (error.message.includes("Permission denied")) {
                    // Usamos nuestra nueva función de modal
                    userAccepted = await requestPermissionFromUser(
                        'Permiso de Superposición',
                        'Para mostrar la burbuja flotante, la app necesita permiso para mostrarse sobre otras aplicaciones.'
                    );
                    if (userAccepted) {
                        GameDetectorPlugin.requestOverlayPermission();
                    }
                } else if (error.message.includes("Usage Stats permission")) {
                    // La reutilizamos para el otro permiso
                    userAccepted = await requestPermissionFromUser(
                        'Permiso de Acceso a Uso',
                        'Para detectar qué juego se está ejecutando, la app necesita permiso para acceder a las estadísticas de uso.'
                    );
                    if (userAccepted) {
                        GameDetectorPlugin.requestUsageStatsPermission();
                    }
                } else {
                    output.textContent = `❌ Error inesperado: ${error.message}`;
                }

                // Si el usuario canceló el modal, lo indicamos.
                if (!userAccepted) {
                    output.textContent = 'Permiso denegado por el usuario.';
                }

                bubbleToggle.checked = false; // Siempre revertimos el toggle si hubo un error
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