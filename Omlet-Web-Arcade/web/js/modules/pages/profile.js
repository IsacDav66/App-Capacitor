// /js/modules/pages/profile.js

import { apiFetch } from '../api.js';
import { getCurrentUser } from '../state.js';
import { generateRandomUsername } from '../utils.js';

export function initProfilePage() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const usernameInput = document.getElementById('username-input');
    const ageInput = document.getElementById('age-input');
    const genderSelect = document.getElementById('gender-select');
    const diceBtn = document.getElementById('dice-btn');
    const completeBtn = document.getElementById('complete-profile-btn');
    const output = document.getElementById('profile-output');
    const fileInput = document.getElementById('file-input');
    const profileImg = document.getElementById('profile-img');
    const defaultSvg = document.getElementById('default-avatar-svg');
    
    let selectedFile = null;

    usernameInput.value = user.username || generateRandomUsername(user.userId);
    
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            selectedFile = file;
            const reader = new FileReader();
            reader.onload = e => {
                profileImg.src = e.target.result;
                profileImg.style.display = 'block';
                defaultSvg.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    diceBtn.addEventListener('click', () => {
        usernameInput.value = generateRandomUsername(user.userId);
    });

    completeBtn.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const age = parseInt(ageInput.value);
        const gender = genderSelect.value;
        
        if (!username || username.length < 3) {
            output.textContent = 'El nombre de usuario debe tener al menos 3 caracteres.';
            return;
        }

        output.textContent = 'Actualizando perfil...';
        completeBtn.disabled = true;

        try {
            // Paso 1: Subir la imagen si hay una seleccionada
            if (selectedFile) {
                output.textContent = 'Subiendo imagen...';
                const formData = new FormData();
                formData.append('profilePic', selectedFile);
                await apiFetch('/api/user/upload-profile-pic', {
                    method: 'POST',
                    body: formData,
                });
            }

            // Paso 2: Actualizar el resto de los datos
            output.textContent = 'Guardando datos...';
            await apiFetch('/api/user/complete-profile', {
                method: 'POST',
                body: JSON.stringify({ username, age, gender }),
            });
            
            output.textContent = '✅ Perfil completado. Redirigiendo...';
            setTimeout(() => { window.location.href = 'home.html'; }, 800);

        } catch (error) {
            output.textContent = `❌ Error: ${error.message}`;
        } finally {
            completeBtn.disabled = false;
        }
    });
}