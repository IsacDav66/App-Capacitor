// /js/modules/pages/chat.js

import { initChatController } from '../controllers/chatController.js';
import { getCurrentUserId } from '../state.js';
import { apiFetch } from '../api.js';
// ==========================================================
// === ¡AÑADE LA IMPORTACIÓN QUE FALTA AQUÍ! ===
// =-=-========================================================
import { getFullImageUrl } from '../utils.js';

const SMILEY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10s10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8s8 3.589 8 8s-3.589 8-8 8z"/><path fill="currentColor" d="M15.5 8C14.672 8 14 8.672 14 9.5s.672 1.5 1.5 1.5s1.5-.672 1.5-1.5S16.328 8 15.5 8zm-7 0C7.672 8 7 8.672 7 9.5S7.672 11 8.5 11S10 10.328 10 9.5S9.328 8 8.5 8z"/><path fill="currentColor" d="M12 14c-2.336 0-4.46.883-6 2.225V17c0 .552.447 1 1 1h10c.553 0 1-.448 1-1v-.775c-1.54-1.342-3.664-2.225-6-2-2.225z"/></svg>`;
const KEYBOARD_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M20 3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zM4 19V5h16l.002 14H4z"/><path fill="currentColor" d="M5 7h2v2H5zm4 0h2v2H9zm4 0h2v2h-2zm4 0h2v2h-2zM5 11h2v2H5zm4 0h2v2H9zm4 0h2v2h-2zm4 0h2v2h-2zM5 15h8v2H5z"/></svg>`;

export async function initChatPage() {
    // 1. Obtener los IDs de los usuarios
    const otherUserId = new URLSearchParams(window.location.search).get('userId');
    const loggedInUserId = getCurrentUserId();



    if (!otherUserId || !loggedInUserId) {
        alert("Error: No se pudo iniciar el chat. Sesión o usuario inválido.");
        window.history.back();
        return;
    }

    // 2. Obtener referencias a los elementos del DOM
    const domElements = {
        messagesContainer: document.getElementById('chat-messages-container'),
        userAvatar: document.getElementById('chat-user-avatar'),
        userUsername: document.getElementById('chat-user-username'),
        chatForm: document.getElementById('chat-form'),
        chatInput: document.getElementById('chat-message-input'),
        replyContextBar: document.getElementById('reply-context-bar'),
        replyToUser: document.getElementById('reply-to-user'),
        replySnippet: document.getElementById('reply-snippet'),
        cancelReplyBtn: document.getElementById('cancel-reply-btn'),
        contextMenuOverlay: document.getElementById('context-menu-overlay'),
        contextMenu: document.getElementById('context-menu'),
        replyFromMenuBtn: document.getElementById('reply-from-menu-btn'),
        copyBtn: document.getElementById('copy-btn'),
        deleteBtn: document.getElementById('delete-from-menu-btn'),
        stickyHeader: document.getElementById('sticky-date-header'),
        stickyHeaderText: document.getElementById('sticky-date-header')?.querySelector('span'),
        deleteConfirmModal: document.getElementById('delete-confirm-modal'),
        cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
        confirmDeleteBtn: document.getElementById('confirm-delete-btn')
    };
    
    const body = document.querySelector('.chat-layout');
    const emojiBtn = document.getElementById('emoji-btn');
    const pickerContainer = document.getElementById('emoji-sticker-picker');
    const emojiContent = document.getElementById('emoji-content');
    const pickerTabs = document.querySelectorAll('.picker-tab');
    const stickerSearchInput = document.getElementById('sticker-search-input');
    const stickerResultsGrid = document.getElementById('sticker-results-grid');
    const clearStickerSearchBtn = document.getElementById('clear-sticker-search-btn'); // <-- ¡NUEVA REFERENCIA!

    let isPickerOpen = false;
    let pickerInitialized = false;
    let stickerSearchTimeout;


      // --- NUEVAS REFERENCIAS PARA EL CREADOR DE STICKERS ---
    const createStickerBtn = document.getElementById('create-sticker-btn');
    const stickerCreatorModal = document.getElementById('sticker-creator-modal');
    const closeStickerCreatorBtn = document.getElementById('close-sticker-creator-btn');
    const stickerSourceImage = document.getElementById('sticker-source-image');
    const saveStickerBtn = document.getElementById('save-sticker-btn');
    const customStickerGrid = document.getElementById('custom-sticker-grid');

    let cropper = null;
    let customStickers = JSON.parse(localStorage.getItem('customStickers')) || [];

    // --- NUEVAS REFERENCIAS ---
    const customStickerLoader = document.getElementById('custom-sticker-loader');
     // --- NUEVAS FUNCIONES PARA EL CREADOR DE STICKERS (ACTUALIZADAS) ---

    // Función unificada para subir un archivo (Blob o File)
    // --- FUNCIONES AUXILIARES (ACTUALIZADAS) ---

    // Esta función ahora también se encarga de re-renderizar la lista
    async function uploadAndSendSticker(file, fileName = 'sticker.png') {
        try {
            const formData = new FormData();
            formData.append('stickerFile', file, fileName);

            const response = await apiFetch('/api/apps/stickers/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.success && response.url) {
                const fullUrl = getFullImageUrl(response.url);
                sendMessage(fullUrl);

                // Actualizar el modelo de datos
                customStickers.unshift(response.url);
                localStorage.setItem('customStickers', JSON.stringify(customStickers.slice(0, 50)));
                
                // No necesitamos llamar a renderCustomStickers aquí, 
                // ya que lo haremos en el `finally`
            } else {
                throw new Error(response.message || "La respuesta del servidor no fue exitosa.");
            }
        } catch (error) {
            console.error("Error al subir el sticker:", error);
            alert(`Error al subir el sticker: ${error.message}`);
            // Lanzamos el error de nuevo para que el bloque `finally` se ejecute
            // pero el flujo principal sepa que algo falló.
            throw error;
        }
    }

    function openStickerCreator() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,image/gif';
        input.onchange = async (e) => { // <-- La hacemos async de nuevo
            const file = e.target.files[0];
            if (!file) return;

            if (file.type === 'image/gif') {
                // ==========================================================
                // === ¡LÓGICA FINAL Y CORRECTA! ===
                // ==========================================================
                // 1. Ocultamos la cuadrícula y mostramos el cargador
                if (customStickerGrid) customStickerGrid.style.display = 'none';
                if (customStickerLoader) customStickerLoader.style.display = 'block';

                try {
                    // 2. Esperamos a que la subida se complete
                    await uploadAndSendSticker(file, file.name);
                } finally {
                    // 3. (SE EJECUTA SIEMPRE) Ocultamos el cargador y mostramos la cuadrícula
                    if (customStickerLoader) customStickerLoader.style.display = 'none';
                    if (customStickerGrid) customStickerGrid.style.display = 'grid'; // 'grid' para que recupere su estilo
                    
                    // 4. Y ahora que la cuadrícula es visible, la re-renderizamos con los datos actualizados
                    renderCustomStickers();
                }
                // ==========================================================

            } else {
                // La lógica para imágenes estáticas no cambia
                const reader = new FileReader();
                reader.onload = event => {
                    stickerSourceImage.src = event.target.result;
                    stickerCreatorModal.style.display = 'flex';

                    if (cropper) cropper.destroy();
                    cropper = new Cropper(stickerSourceImage, { /* ... */ });
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }


    function closeStickerCreator() {
        stickerCreatorModal.style.display = 'none';
        if (cropper) cropper.destroy();
        cropper = null;
    }

    function renderCustomStickers() {
        if (customStickers.length > 0) {
            customStickerGrid.innerHTML = customStickers.map(url => `
                <img src="${getFullImageUrl(url)}" class="sticker-item" data-sticker-url="${getFullImageUrl(url)}">
            `).join('');
        } else {
            customStickerGrid.innerHTML = '<p class="search-placeholder">Crea tu primer sticker con el botón +</p>';
        }
    }
    
    // 3. Inicializar el controlador de chat PRIMERO
    window.chatController = await initChatController(domElements, otherUserId, loggedInUserId);
    console.log("[initChatPage LOG] El chatController se ha inicializado:", window.chatController);

    if (!window.chatController) {
        console.error("[initChatPage LOG] La inicialización del controlador falló. Abortando.");
        return;
    }

    // 4. Definir las funciones auxiliares que dependen del controlador
    function openPicker() {
        if (isPickerOpen) return;
        isPickerOpen = true;
        emojiBtn.innerHTML = KEYBOARD_ICON;

        // ==========================================================
        // === ¡LÓGICA DE LAYOUT DEFINITIVA! ===
        // ==========================================================
        // Le decimos al grid que ahora tiene 4 filas:
        // 1. Header (auto)
        // 2. Mensajes (1fr - espacio flexible)
        // 3. Selector (altura fija)
        // 4. Input (auto)
        body.style.gridTemplateRows = 'auto 1fr 280px auto';
        pickerContainer.style.display = 'flex'; // Hacemos visible el selector
        // ==========================================================

        if (!pickerInitialized) {
            const picker = document.createElement('emoji-picker');
            emojiContent.appendChild(picker);
            picker.addEventListener('emoji-click', event => {
                domElements.chatInput.value += event.detail.unicode;
            });
            pickerInitialized = true;
        }

        setTimeout(() => {
            domElements.messagesContainer.scrollTop = domElements.messagesContainer.scrollHeight;
        }, 50);
    }

    function closePicker(focusInput = false) {
        if (!isPickerOpen) return;
        isPickerOpen = false;
        emojiBtn.innerHTML = SMILEY_ICON;
        
        // ==========================================================
        // === ¡LÓGICA DE LAYOUT DEFINITIVA! ===
        // ==========================================================
        // Restauramos el grid a su estado original de 3 filas.
        body.style.gridTemplateRows = 'auto 1fr auto';
        pickerContainer.style.display = 'none'; // Ocultamos el selector
        // ==========================================================
        
        if (focusInput) {
            domElements.chatInput.focus();
        }
    }
    function togglePicker(e) {
        e.preventDefault();
        isPickerOpen ? closePicker(true) : openPicker();
    }

    // --- NUEVAS FUNCIONES PARA STICKERS ---
    async function fetchAndRenderStickers(endpoint) {
        stickerResultsGrid.innerHTML = '<div class="search-placeholder">Buscando...</div>';
        try {
            const data = await apiFetch(endpoint);
            if (data && data.data && data.data.length > 0) {
                stickerResultsGrid.innerHTML = data.data.map(sticker => `
                    <img src="${sticker.images.fixed_width.url}" 
                         alt="${sticker.title}" 
                         class="sticker-item"
                         data-sticker-url="${sticker.images.original.url}">
                `).join('');
            } else {
                stickerResultsGrid.innerHTML = '<div class="search-placeholder">No se encontraron stickers.</div>';
            }
        } catch (error) {
            stickerResultsGrid.innerHTML = '<div class="search-placeholder">Error al cargar stickers.</div>';
        }
    }
function sendMessage(contentToSend) {
        if (!contentToSend || !window.chatController) return;
        
        const tempId = `temp-${Date.now()}`;
        const messageData = {
            message_id: tempId,
            sender_id: loggedInUserId,
            content: contentToSend,
        };
        
        window.chatController.sendMessage(messageData);
        domElements.chatInput.value = '';

        // ¡YA NO NECESITAMOS EL setTimeout AQUÍ!
        // La lógica de scroll ahora está en el 'onload' de la imagen en el controlador.
    }

    // 5. Asignar todos los listeners de eventos

    if (emojiBtn) emojiBtn.addEventListener('click', togglePicker);
    if (domElements.chatInput) domElements.chatInput.addEventListener('focus', () => { if (isPickerOpen) closePicker(false); });

    pickerTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetPanelId = tab.dataset.tab;
            pickerTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.picker-content-panel').forEach(panel => {
                panel.classList.toggle('active', panel.id === targetPanelId);
            });
            if (tab.dataset.tab === 'sticker-content' && stickerResultsGrid.children.length <= 1) {
                // Hay una llamada duplicada aquí, la eliminamos para limpiar.
                // fetchAndRenderStickers('/api/giphy/stickers/trending'); 
                fetchAndRenderStickers('/api/apps/stickers/trending');
            }
        });
    });

    // Listener para la búsqueda de stickers con debounce (ACTUALIZADO)
    stickerSearchInput.addEventListener('input', () => {
        const searchTerm = stickerSearchInput.value.trim();
        
        // Muestra u oculta el botón de limpiar
        clearStickerSearchBtn.style.display = searchTerm ? 'flex' : 'none';

        clearTimeout(stickerSearchTimeout);
        stickerSearchTimeout = setTimeout(() => {
            if (searchTerm.length > 1) {
                fetchAndRenderStickers(`/api/apps/stickers/search?q=${searchTerm}`);
            } else {
                // Si el campo está vacío, vuelve a mostrar los stickers en tendencia
                fetchAndRenderStickers('/api/apps/stickers/trending');
            }
        }, 500);
    });
    // ==========================================================
    // === ¡NUEVO LISTENER PARA EL BOTÓN DE LIMPIAR! ===
    // ==========================================================
    if (clearStickerSearchBtn) {
        clearStickerSearchBtn.addEventListener('click', () => {
            stickerSearchInput.value = ''; // Limpia el input
            clearStickerSearchBtn.style.display = 'none'; // Oculta el botón
            fetchAndRenderStickers('/api/apps/stickers/trending'); // Vuelve a los stickers populares
            stickerSearchInput.focus(); // Pone el foco de nuevo en el input
        });
    }

    stickerResultsGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('sticker-item')) {
            const stickerUrl = e.target.dataset.stickerUrl;
            
            // Llamamos a nuestra función de envío unificada
            sendMessage(stickerUrl);
            
            // No cerramos el picker, como acordamos.
            // closePicker();
        }
    });
    // ¡LA LLAMADA DUPLICADA A initChatController HA SIDO ELIMINADA DE AQUÍ!
    // Listeners para el creador de stickers
    if (createStickerBtn) createStickerBtn.addEventListener('click', openStickerCreator);
    if (closeStickerCreatorBtn) closeStickerCreatorBtn.addEventListener('click', closeStickerCreator);

    // ==========================================================
    // === ¡LISTENER DE GUARDADO DE STICKER CORREGIDO! ===
    // ==========================================================
    if (saveStickerBtn) {
        saveStickerBtn.addEventListener('click', async () => {
            if (!cropper) return;

            saveStickerBtn.disabled = true;
            saveStickerBtn.textContent = 'Procesando...';
            
            // Referencias a los elementos de la UI del selector
            const customStickerGrid = document.getElementById('custom-sticker-grid');
            const customStickerLoader = document.getElementById('custom-sticker-loader');

            try {
                const getCroppedBlob = () => new Promise(resolve => {
                    cropper.getCroppedCanvas({ width: 256, height: 256 }).toBlob(blob => resolve(blob), 'image/png');
                });

                const stickerBlob = await getCroppedBlob();
                if (!stickerBlob) throw new Error("No se pudo crear el archivo del sticker.");

                // Cerramos el modal inmediatamente y mostramos el cargador en el panel principal
                closeStickerCreator();
                if (customStickerGrid) customStickerGrid.style.display = 'none';
                if (customStickerLoader) {
                    customStickerLoader.querySelector('p').textContent = 'Subiendo Sticker...'; // Cambiamos el texto
                    customStickerLoader.style.display = 'block';
                }
                
                // Esperamos a que la subida se complete
                await uploadAndSendSticker(stickerBlob, 'sticker.png');
                
            } catch (error) {
                // El alert de error ya se muestra dentro de uploadAndSendSticker
                console.error("Error en el proceso de guardado de sticker recortado:", error);
            } finally {
                // Este bloque se ejecuta SIEMPRE, restaurando la UI.
                if (customStickerLoader) customStickerLoader.style.display = 'none';
                if (customStickerGrid) customStickerGrid.style.display = 'grid';
                
                // Volvemos a renderizar para asegurar que la lista esté actualizada.
                renderCustomStickers();
                
                // Restauramos el estado del botón del modal para la próxima vez
                saveStickerBtn.disabled = false;
                saveStickerBtn.textContent = 'Crear y Enviar';
            }
        });
    }
    
    // Listener para enviar un sticker personalizado
    if (customStickerGrid) {
        customStickerGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('sticker-item')) {
                const stickerUrl = e.target.dataset.stickerUrl;
                sendMessage(stickerUrl);
            }
        });
    }
    
    // Cargar stickers personalizados al inicio
    renderCustomStickers();


}
