// /js/modules/pages/auth.js

import { apiFetch } from '../api.js';
// Importamos el GameDetectorPlugin junto a los demás
import { GoogleAuth, GameDetectorPlugin } from '../ui/nativeBridge.js';

export function initAuthPage() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) loginForm.addEventListener('submit', (e) => { e.preventDefault(); handleAuth(false); });
    if (registerForm) registerForm.addEventListener('submit', (e) => { e.preventDefault(); handleAuth(true); });

    /**
     * Función unificada para manejar el login y el registro.
     */
    async function handleAuth(isRegister = false) {
        const email = document.getElementById(isRegister ? 'register-email' : 'login-email').value;
        const password = document.getElementById(isRegister ? 'register-password' : 'login-password').value;
        const output = document.getElementById('output');
        const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

        if (isRegister) {
            const repeatPassword = document.getElementById('repeat-password').value;
            if (password !== repeatPassword) {
                output.textContent = '❌ Las contraseñas no coinciden.';
                return;
            }
        }

        try {
            output.textContent = 'Procesando...';
            const data = await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            if (data.success && data.token) {
                output.textContent = `✅ ¡Éxito! Redirigiendo...`;
                localStorage.setItem('authToken', data.token);

                // ==========================================================
                // === ¡AQUÍ ESTÁ LA NUEVA LÍNEA! ===
                // ==========================================================
                // Después de guardar el token, se lo pasamos al lado nativo.
                if (GameDetectorPlugin) {
                    GameDetectorPlugin.setAuthToken({ token: data.token });
                }
                // ==========================================================

                const destination = isRegister ? 'profile.html' : 'home.html';
                setTimeout(() => { window.location.href = destination; }, 500);
            }
        } catch (error) {
            output.textContent = `❌ Error: ${error.message}`;
        }
    }

    /**
     * Función para manejar el inicio de sesión con Google.
     */
    window.signInWithGoogle = async () => {
        const output = document.getElementById('output');
        if (!GoogleAuth) {
            output.textContent = 'Función no disponible en este dispositivo.';
            return;
        }

        output.textContent = 'Iniciando sesión con Google...';
        try {
            const googleUser = await GoogleAuth.signIn();
            if (googleUser && googleUser.authentication && googleUser.authentication.idToken) {
                output.textContent = 'Verificando con el servidor...';
                const data = await apiFetch('/api/auth/google', {
                    method: 'POST',
                    body: JSON.stringify({ token: googleUser.authentication.idToken })
                });

                if (data.success && data.token) {
                    output.textContent = `✅ ${data.message} ¡Redirigiendo!`;
                    localStorage.setItem('authToken', data.token);

                    // ==========================================================
                    // === ¡TAMBIÉN LA AÑADIMOS AQUÍ! ===
                    // ==========================================================
                    if (GameDetectorPlugin) {
                        GameDetectorPlugin.setAuthToken({ token: data.token });
                    }
                    // ==========================================================

                    setTimeout(() => { window.location.href = 'home.html'; }, 500);
                }
            } else {
                 output.textContent = '❌ No se pudo obtener la información de Google.';
            }
        } catch (error) {
            console.error("Error en el inicio de sesión con Google:", error);
            output.textContent = '❌ Inicio de sesión con Google cancelado o fallido.';
        }
    };
}