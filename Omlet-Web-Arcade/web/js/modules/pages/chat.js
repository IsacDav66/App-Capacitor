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
    // 1. OBTENER IDS Y REFERENCIAS AL DOM
    const otherUserId = new URLSearchParams(window.location.search).get('userId');
    const loggedInUserId = getCurrentUserId();

    if (!otherUserId || !loggedInUserId) {
        alert("Error: No se pudo iniciar el chat. Sesión o usuario inválido.");
        window.history.back();
        return;
    }

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
    
    // --- ¡CORRECCIÓN DE ID! ---
    const giphyStickerGrid = document.getElementById('giphy-sticker-grid'); 

    const stickerResultsGrid = document.getElementById('sticker-results-grid');
    const createStickerBtn = document.getElementById('create-sticker-btn');
    const stickerCreatorModal = document.getElementById('sticker-creator-modal');
    const closeStickerCreatorBtn = document.getElementById('close-sticker-creator-btn');
    const stickerSourceImage = document.getElementById('sticker-source-image');
    const saveStickerBtn = document.getElementById('save-sticker-btn');
    const customStickerGrid = document.getElementById('custom-sticker-grid');
    const customStickerLoader = document.getElementById('custom-sticker-loader');
    
    const stickerSourceVideo = document.getElementById('sticker-source-video');
    const trimmerContainer = document.getElementById('trimmer-container');
    const trimmerSelection = document.getElementById('trimmer-selection');
    const startHandle = document.getElementById('trimmer-start-handle');
    const endHandle = document.getElementById('trimmer-end-handle');
    const playhead = document.getElementById('trimmer-playhead');
    const audioToggle = document.getElementById('sticker-audio-toggle');

     
    // ==========================================================
    // === ¡AQUÍ ESTÁN LAS DECLARACIONES QUE FALTABAN! ===
    // ==========================================================
    const stickerEditorImageView = document.getElementById('sticker-editor-view-image');
    const stickerEditorVideoView = document.getElementById('sticker-editor-view-video');

    const ffmpegLoaderView = document.getElementById('ffmpeg-loader-view');
    const ffmpegLog = document.getElementById('ffmpeg-log');

    // ==========================================================

    let isPickerOpen = false;
    let pickerInitialized = false;
    let stickerSearchTimeout;
    let currentFileType = null;
    let cropper = null;
    let customStickers = JSON.parse(localStorage.getItem('customStickers')) || [];


    let videoDuration = 0;
    let startTime = 0;
    // ==========================================================
    // === ¡DECLARACIÓN AÑADIDA! ===
    // ==========================================================
    let sourceFile = null;

    // 2. INICIALIZAR EL CONTROLADOR DE CHAT
    window.chatController = await initChatController(domElements, otherUserId, loggedInUserId);
    if (!window.chatController) {
        console.error("[initChatPage LOG] La inicialización del controlador falló. Abortando.");
        return;
    }

    // 3. DEFINIR FUNCIONES AUXILIARES
    
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
    function togglePicker(e) { e.preventDefault(); isPickerOpen ? closePicker(true) : openPicker(); }
    
    async function fetchAndRenderStickers(endpoint) {
        // --- ¡CORRECCIÓN DE REFERENCIA! ---
        giphyStickerGrid.innerHTML = '<p class="search-placeholder">Buscando...</p>';
        try {
            const data = await apiFetch(endpoint);
            if (data && data.data && data.data.length > 0) {
                giphyStickerGrid.innerHTML = data.data.map(sticker => `
                    <img src="${sticker.images.fixed_width.url}" 
                         alt="${sticker.title}" 
                         class="sticker-item"
                         data-sticker-url="${sticker.images.original.url}">
                `).join('');
            } else {
                giphyStickerGrid.innerHTML = '<p class="search-placeholder">No se encontraron stickers.</p>';
            }
        } catch (error) {
            giphyStickerGrid.innerHTML = '<p class="search-placeholder">Error al cargar stickers.</p>';
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
        setTimeout(() => {
            domElements.messagesContainer.scrollTop = domElements.messagesContainer.scrollHeight;
        }, 50);
    }
    
     // --- FUNCIÓN renderCustomStickers (CORREGIDA) ---
    // --- FUNCIÓN renderCustomStickers (ACTUALIZADA) ---
    function renderCustomStickers() {
    if (customStickers.length > 0) {
        customStickerGrid.innerHTML = customStickers.map(url => {
            const fullUrl = getFullImageUrl(url);

            if (fullUrl.endsWith('.mp4')) {
                // --- ¡LÓGICA DE EVENTOS DE VÍDEO CORREGIDA Y ROBUSTA! ---
                return `
                    <video 
                           src="${fullUrl}" 
                           class="sticker-item" 
                           data-sticker-url="${fullUrl}"
                           muted 
                           loop 
                           playsinline
                           
                           onmouseover="this.play()" 
                           onmouseout="this.pause(); this.currentTime=0;"
                           
                           ontouchstart="this.muted=false; this.play();"
                           ontouchend="this.muted=true; this.pause(); this.currentTime=0;"
                           ontouchcancel="this.muted=true; this.pause(); this.currentTime=0;"
                           
                           onmousedown="this.muted=false; this.play();"
                           onmouseup="this.muted=true;"
                           onmouseleave="this.muted=true;"
                    ></video>
                `;
            } else {
                // Para imágenes y GIFs, la etiqueta <img> se mantiene igual
                return `
                    <img src="${fullUrl}" 
                         class="sticker-item" 
                         data-sticker-url="${fullUrl}">
                `;
            }
        }).join('');
    } else {
        customStickerGrid.innerHTML = '<p class="search-placeholder">Crea tu primer sticker con el botón +</p>';
    }
}


    async function uploadAndSendSticker(file, fileName) {
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
                customStickers.unshift(response.url);
                localStorage.setItem('customStickers', JSON.stringify(customStickers.slice(0, 50)));
            } else {
                throw new Error(response.message || "La respuesta del servidor no fue exitosa.");
            }
        } catch (error) {
            console.error("Error al subir el sticker:", error);
            alert(`Error al subir el sticker: ${error.message}`);
            throw error; // Re-lanzar para que el `finally` se active
        }
    }

    // --- openStickerCreator (VERSIÓN FINAL Y CORRECTA) ---
     function openStickerCreator() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/gif,video/mp4,video/quicktime,video/webm';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Guardamos el archivo y el tipo para usarlo después
            sourceFile = file;
            currentFileType = file.type;
            
            const fileUrl = URL.createObjectURL(file);

            // ==========================================================
            // === ¡LÓGICA DE CONDICIONES CORREGIDA! ===
            // ==========================================================

            // --- CASO 1: Es un GIF animado (subida directa) ---
            if (currentFileType === 'image/gif') {
                const customStickerPanel = document.getElementById('custom-sticker-content');
                if (!customStickerPanel) return;
                
                const loader = document.getElementById('custom-sticker-loader');
                const grid = document.getElementById('custom-sticker-grid');

                if(grid) grid.style.display = 'none';
                if(loader) {
                    loader.querySelector('p').textContent = 'Subiendo GIF...';
                    loader.style.display = 'block';
                }

                try {
                    await uploadAndSendSticker(file, file.name);
                } finally {
                    if(loader) loader.style.display = 'none';
                    if(grid) grid.style.display = 'grid';
                    renderCustomStickers();
                }
            
            // --- CASO 2: Es un VÍDEO (abrir editor de trimmer) ---
            } else if (currentFileType.startsWith('video/')) {
                stickerEditorImageView.style.display = 'none';
                stickerEditorVideoView.style.display = 'block';
                stickerSourceVideo.src = fileUrl;
                stickerCreatorModal.style.display = 'flex';
                
                stickerSourceVideo.onloadedmetadata = () => {
                    videoDuration = stickerSourceVideo.duration;
                    initTrimmer();
                };

            // --- CASO 3: Es una IMAGEN ESTÁTICA (abrir editor de recorte) ---
            } else if (currentFileType.startsWith('image/')) {
                stickerEditorVideoView.style.display = 'none';
                stickerEditorImageView.style.display = 'block';
                stickerSourceImage.src = fileUrl;
                stickerCreatorModal.style.display = 'flex';

                if (cropper) cropper.destroy();
                cropper = new Cropper(stickerSourceImage, {
                    aspectRatio: 1, viewMode: 1, background: false, autoCropArea: 1,
                });
            }
            // ==========================================================
        };
        input.click();
    }


    // ==========================================================
    // === ¡FUNCIÓN initTrimmer FINAL Y CORRECTA! ===
    // ==========================================================
    // ==========================================================
    // === ¡FUNCIÓN initTrimmer FINAL Y CORRECTA! ===
    // ==========================================================
    function initTrimmer() {
        if (!trimmerContainer || !startHandle || !endHandle || !trimmerSelection || !stickerSourceVideo) return;
        
        const timelineWidth = trimmerContainer.offsetWidth - 20; // Ancho total menos el ancho de una agarradera
        const maxDuration = 10;
        const selectionWidth = Math.min(1, maxDuration / videoDuration) * timelineWidth;
        
        let startX = 0;
        startTime = 0;

        // --- Configuración Inicial de la UI ---
        trimmerSelection.style.left = '0px';
        trimmerSelection.style.width = `${selectionWidth}px`;
        startHandle.style.left = '0px';
        endHandle.style.left = `${selectionWidth}px`;

        // --- Funciones de Evento (para poder añadirlas y quitarlas) ---

        const onDragMove = (e) => {
            const rect = trimmerContainer.getBoundingClientRect();
            // Usamos e.touches[0] para eventos táctiles, o e para eventos de ratón
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            
            let newX = clientX - rect.left - (startHandle.offsetWidth / 2);
            
            // Limitar el movimiento dentro de la línea de tiempo
            newX = Math.max(0, Math.min(newX, timelineWidth - selectionWidth));
            
            // Actualizar la UI del trimmer
            startHandle.style.left = `${newX}px`;
            trimmerSelection.style.left = `${newX}px`;
            endHandle.style.left = `${newX + selectionWidth}px`;

            // Actualizar el tiempo de inicio y la preview del vídeo
            startTime = (newX / timelineWidth) * videoDuration;
            stickerSourceVideo.currentTime = startTime;
        };

        const onDragEnd = () => {
            // Eliminar los listeners de movimiento y finalización
            document.removeEventListener('mousemove', onDragMove);
            document.removeEventListener('mouseup', onDragEnd);
            document.removeEventListener('touchmove', onDragMove);
            document.removeEventListener('touchend', onDragEnd);
        };

        const onDragStart = (e) => {
            e.preventDefault(); // Prevenir selección de texto u otros comportamientos
            
            // Añadir los listeners para el arrastre al documento completo
            document.addEventListener('mousemove', onDragMove);
            document.addEventListener('mouseup', onDragEnd);
            document.addEventListener('touchmove', onDragMove);
            document.addEventListener('touchend', onDragEnd);
        };

        // Asignar solo el listener de inicio a la agarradera
        startHandle.onmousedown = onDragStart;
        startHandle.ontouchstart = onDragStart;

        // Listener para la cabeza lectora (playhead)
        stickerSourceVideo.addEventListener('timeupdate', () => {
            // El 'playhead' se mueve solo dentro de la selección
            const selectionStartPercent = (startTime / videoDuration) * 100;
            const currentPercentInSelection = ((stickerSourceVideo.currentTime - startTime) / maxDuration) * 100;

            if (stickerSourceVideo.currentTime >= startTime && stickerSourceVideo.currentTime < startTime + maxDuration) {
                playhead.style.left = `calc(${selectionStartPercent}% + ${(selectionWidth * currentPercentInSelection) / 100}px)`;
            }

            // Reiniciar el bucle
            if (stickerSourceVideo.currentTime >= startTime + maxDuration) {
                stickerSourceVideo.currentTime = startTime;
            }
        });

        // Al hacer clic en la línea de tiempo, mover la selección allí
        const timeline = trimmerContainer.querySelector('.trimmer-timeline');
        timeline.addEventListener('click', (e) => {
            const rect = timeline.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            let newX = clickX - (selectionWidth / 2);
            newX = Math.max(0, Math.min(newX, timelineWidth - selectionWidth));
            
            startHandle.style.left = `${newX}px`;
            trimmerSelection.style.left = `${newX}px`;
            endHandle.style.left = `${newX + selectionWidth}px`;
            
            startTime = (newX / timelineWidth) * videoDuration;
            stickerSourceVideo.currentTime = startTime;
        });
    }

    // --- FUNCIÓN closeStickerCreator (ACTUALIZADA) ---
    function closeStickerCreator() {
        if(stickerCreatorModal) stickerCreatorModal.style.display = 'none';
        if (cropper) { cropper.destroy(); cropper = null; }
        // --- ¡LIMPIAMOS LAS VARIABLES DE ESTADO! ---
        sourceFile = null;
        currentFileType = null;
    }

    // 4. ASIGNAR LISTENERS DE EVENTOS

    // --- ASIGNACIÓN DE LISTENERS ---
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
            // --- ¡CORRECCIÓN DE ID! ---
            if (tab.dataset.tab === 'giphy-sticker-content' && giphyStickerGrid.children.length <= 1) {
                fetchAndRenderStickers('/api/apps/stickers/trending');
            }
        });
    });

    if (stickerSearchInput) {
        stickerSearchInput.addEventListener('input', () => {
            clearTimeout(stickerSearchTimeout);
            stickerSearchTimeout = setTimeout(() => {
                const searchTerm = stickerSearchInput.value.trim();
                if (searchTerm.length > 1) {
                    fetchAndRenderStickers(`/api/apps/stickers/search?q=${searchTerm}`);
                } else {
                    fetchAndRenderStickers('/api/apps/stickers/trending');
                }
            }, 500);
        });
    }

    // --- ¡CORRECCIÓN DE ID! ---
    if (giphyStickerGrid) {
        giphyStickerGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('sticker-item')) {
                const stickerUrl = e.target.dataset.stickerUrl;
                sendMessage(stickerUrl);
            }
        });
    }

    if (createStickerBtn) createStickerBtn.addEventListener('click', openStickerCreator);
    if (closeStickerCreatorBtn) closeStickerCreatorBtn.addEventListener('click', closeStickerCreator);
    
    if (saveStickerBtn) {
        saveStickerBtn.addEventListener('click', async () => {
            saveStickerBtn.disabled = true;

            // --- FLujo 1: IMAGEN ESTÁTICA ---
            if (currentFileType && currentFileType.startsWith('image/') && !currentFileType.includes('gif')) {
                if (!cropper) {
                    saveStickerBtn.disabled = false;
                    return;
                }
                saveStickerBtn.textContent = 'Procesando...';

                try {
                    const getCroppedBlob = () => new Promise(resolve => {
                        cropper.getCroppedCanvas({ width: 256, height: 256 }).toBlob(blob => resolve(blob), 'image/png');
                    });

                    const stickerBlob = await getCroppedBlob();
                    if (!stickerBlob) throw new Error("No se pudo crear el archivo del sticker.");
                    
                    saveStickerBtn.textContent = 'Subiendo...';
                    
                    // La función de subida actualiza el array de datos `customStickers`
                    await uploadAndSendSticker(stickerBlob, 'sticker.png');
                    
                    closeStickerCreator();

                } catch (error) {
                    alert(`Error al crear el sticker: ${error.message}`);
                } finally {
                    // ==========================================================
                    // === ¡AÑADIMOS LA LLAMADA QUE FALTABA AQUÍ! ===
                    // ==========================================================
                    // Después de todo, volvemos a renderizar la cuadrícula para reflejar los cambios.
                    renderCustomStickers();
                    // ==========================================================
                    
                    saveStickerBtn.disabled = false;
                    saveStickerBtn.textContent = 'Crear y Enviar';
                }

            } else if (currentFileType && currentFileType.startsWith('video/')) {
                // ==========================================================
                // === ¡AQUÍ ESTÁ LA CORRECCIÓN! ===
                // ==========================================================
                // Pausamos el vídeo inmediatamente para detener el audio.
                if (stickerSourceVideo) {
                    stickerSourceVideo.pause();
                }
                // ==========================================================
                
                saveStickerBtn.textContent = 'Procesando Video...';
                const loader = document.getElementById('custom-sticker-loader');
                const grid = document.getElementById('custom-sticker-grid');
                
                try {
                    closeStickerCreator();
                    if (grid) grid.style.display = 'none';
                    if (loader) {
                        loader.querySelector('p').textContent = 'Procesando Video...';
                        loader.style.display = 'block';
                    }

                    // ==========================================================
                    // === ¡AQUÍ ESTÁ LA CORRECCIÓN CLAVE! ===
                    // ==========================================================
                    // En lugar de depender de la variable 'sourceFile', que puede
                    // perderse, volvemos a obtener el Blob directamente desde la URL
                    // del <video> que se está mostrando en el modal.
                    if (!stickerSourceVideo.src) {
                        throw new Error("No se encontró la fuente de vídeo para procesar.");
                    }
                    const videoBlob = await fetch(stickerSourceVideo.src).then(res => res.blob());
                    // ==========================================================
                    
                    const formData = new FormData();
                    formData.append('stickerFile', videoBlob, 'video.mp4'); // Usamos el nuevo Blob
                    formData.append('startTime', startTime);
                    formData.append('muteAudio', !audioToggle.checked);

                    const response = await apiFetch('/api/apps/stickers/upload', {
                        method: 'POST',
                        body: formData
                    });

                    if (response.success && response.url) {
                        const fullUrl = getFullImageUrl(response.url);
                        sendMessage(fullUrl);
                        customStickers.unshift(response.url);
                        localStorage.setItem('customStickers', JSON.stringify(customStickers.slice(0, 50)));
                    } else {
                        throw new Error(response.message || "La respuesta del servidor no fue exitosa.");
                    }
                } catch (error) {
                    alert(`Error al procesar el video: ${error.message}`);
                } finally {
                    if (loader) loader.style.display = 'none';
                    if (grid) grid.style.display = 'grid';
                    renderCustomStickers();
                    saveStickerBtn.disabled = false;
                    saveStickerBtn.textContent = 'Crear y Enviar';
                }
            }
        });
    }
    

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