// /js/modules/pages/chat.js

import { initChatController } from '../controllers/chatController.js';
import { getCurrentUserId } from '../state.js';
import { apiFetch, API_BASE_URL } from '../api.js';
// ==========================================================
// === ¡AÑADE LA IMPORTACIÓN QUE FALTA AQUÍ! ===
// =-=-========================================================
import { getFullImageUrl } from '../utils.js';

const SMILEY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m0-4a5.5 5.5 0 0 0 5.478-5H6.522A5.5 5.5 0 0 0 12 18m-3.5-7.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3m7 0a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3"/></svg>`;
const KEYBOARD_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M20 3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zM4 19V5h16l.002 14H4z"/><path fill="currentColor" d="M5 7h2v2H5zm4 0h2v2H9zm4 0h2v2h-2zm4 0h2v2h-2zM5 11h2v2H5zm4 0h2v2H9zm4 0h2v2h-2zm4 0h2v2h-2zM5 15h8v2H5z"/></svg>`;
export async function initChatPage() {
    console.log("📱 PÁGINA: Cargando chat.html");

    const urlParams = new URLSearchParams(window.location.search);
    const otherUserId = urlParams.get('userId');
    const loggedInUserId = getCurrentUserId();

    if (!otherUserId || !loggedInUserId) {
        window.location.href = 'chat_list.html';
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
    const cancelCreateBtn = document.getElementById('cancel-sticker-btn');

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

    let isManualScrolling = false;


    let lockTimer; // Segundo temporizador para el bloqueo
    let isLocked = false;
    let pendingDeleteUrl = ""; // Para saber qué sticker borrar


    if (cancelCreateBtn) {
        cancelCreateBtn.onclick = (e) => {
            e.preventDefault();
            console.log("🚫 Creación de sticker cancelada.");
            closeStickerCreator(); // Llamamos a la función que limpia todo
        };
    }
    // 1. Cargar Recientes (Máximo 20)
    let recentStickers = JSON.parse(localStorage.getItem('recentStickers')) || [];



    const uploadWithProgress = (formData) => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const modal = document.getElementById('upload-progress-modal');
            const fill = document.getElementById('progress-bar-fill');
            const percentText = document.getElementById('progress-percent');

            // Mostrar modal y resetear barra
            modal.style.display = 'flex';
            fill.style.width = '0%';
            percentText.innerText = '0%';

            xhr.open('POST', `${API_BASE_URL}/api/apps/stickers/upload`);
            
            // Añadir el token de autorización
            xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('authToken')}`);

            // --- EL EVENTO CLAVE: PROGRESO ---
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    fill.style.width = percent + '%';
                    percentText.innerText = percent + '%';
                }
            };

            xhr.onload = () => {
                modal.style.display = 'none';
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error("Error en el servidor"));
                }
            };

            xhr.onerror = () => {
                modal.style.display = 'none';
                reject(new Error("Error de conexión"));
            };

            xhr.send(formData);
        });
    };


    // Función para añadir a recientes
    function addToRecents(url) {
        // Extraer ruta relativa para consistencia
        const relativeUrl = url.includes('/uploads') ? url.substring(url.indexOf('/uploads')) : url;
        
        recentStickers = recentStickers.filter(item => item !== relativeUrl);
        recentStickers.unshift(relativeUrl);
        
        if (recentStickers.length > 20) recentStickers.pop();
        localStorage.setItem('recentStickers', JSON.stringify(recentStickers));
    }

     
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

    // 1. Definir el observador de forma global en el módulo para que todos lo vean
window.pickerMediaObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const media = entry.target;
            const src = media.getAttribute('data-src');
            
            if (src) {
                // Pasamos la URL al atributo real para que empiece la descarga
                media.src = src;
                media.removeAttribute('data-src');
                
                if (media.tagName === 'VIDEO') {
                    media.load();
                    media.play().catch(() => {});
                }
            }
            // Dejamos de vigilar este sticker porque ya cargó
            window.pickerMediaObserver.unobserve(media);
        }
    });
}, { 
    // root: null significa que observa respecto a la pantalla visible
    rootMargin: '100px', // Precarga los stickers que están a 100px de aparecer
    threshold: 0.01 
});

    // --- VIGILANTE DE CARGA PARA EL PANEL DE STICKERS ---
    const pickerMediaObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const media = entry.target;
                if (media.dataset.src) {
                    media.src = media.dataset.src;
                    media.removeAttribute('data-src');
                    if (media.tagName === 'VIDEO') {
                        media.load();
                        media.play().catch(() => {});
                    }
                }
                pickerMediaObserver.unobserve(media);
            }
        });
    }, { 
        // IMPORTANTE: El root es el contenedor de los grids de stickers
        root: document.getElementById('custom-sticker-grid-wrapper'),
        rootMargin: '100px', // Carga un poco antes de llegar con el scroll
        threshold: 0.01 
    });

    // 1. Intentar cargar colecciones
    let collections = JSON.parse(localStorage.getItem('stickerCollections'));

    // 2. MIGRACIÓN: Si no hay colecciones pero sí hay stickers viejos, los movemos
    if (!collections) {
        const oldStickers = JSON.parse(localStorage.getItem('customStickers')) || [];
        collections = { "General": oldStickers, "Favoritos": [] };
        localStorage.setItem('stickerCollections', JSON.stringify(collections));
    }

    let currentViewFolder = null; // null = ver carpetas, "Nombre" = ver stickers
        // Asegúrate de que al cargar, siempre haya una carpeta seleccionada
    if (!currentViewFolder) {
        currentViewFolder = Object.keys(collections)[0] || "General";
    }

    let videoDuration = 0;
    let startTime = 0;
    // ==========================================================
    // === ¡DECLARACIÓN AÑADIDA! ===
    // ==========================================================
    let sourceFile = null;



    // 3. DEFINIR FUNCIONES AUXILIARES
    // --- SISTEMA DE PREVISUALIZACIÓN DE STICKERS ---
    let longPressTimer;
    let isLongPress = false;
    
    // Crear el elemento de previsualización una sola vez
    const previewOverlay = document.createElement('div');
    previewOverlay.className = 'sticker-preview-overlay';
    document.body.appendChild(previewOverlay);

    const showStickerPreview = (url, folderName) => {
    if (!url) return;
    pendingDeleteUrl = url;
    
    const isVideo = url.toLowerCase().endsWith('.mp4');
    const contentHTML = isVideo 
        ? `<video src="${url}" class="preview-render" autoplay loop playsinline></video>`
        : `<img src="${url}" class="preview-render">`;
    
    // --- TEXTO DINÁMICO SEGÚN LA CARPETA ---
    const deleteLabel = `Eliminar de ${folderName}`;

    previewOverlay.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center;">
            <div class="preview-content">${contentHTML}</div>
            <div class="preview-options-menu" id="preview-menu">
                <button class="preview-opt-btn danger" id="btn-delete-sticker">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    ${deleteLabel}
                </button>
            </div>
        </div>
    `;
    
    previewOverlay.classList.add('active');
    if (isVideo) {
        const vid = previewOverlay.querySelector('video');
        vid.muted = false;
        vid.play().catch(() => {});
    }
    if (window.navigator.vibrate) window.navigator.vibrate(40);
};

// Función para activar el menú sin recargar el contenido
const lockStickerPreview = () => {
    isLocked = true;
    const menu = document.getElementById('preview-menu');
    if (menu) menu.classList.add('visible');
    
    // Vincular el clic del botón de borrar
    const deleteBtn = document.getElementById('btn-delete-sticker');
    if (deleteBtn) {
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            handleDeleteSticker(pendingDeleteUrl);
        };
    }

    if (window.navigator.vibrate) window.navigator.vibrate([60, 40, 60]); // Vibración doble de confirmación
};


// --- FUNCIÓN DE UTILIDAD: MENSAJE PASAJERO (TOAST) ---
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

const handleDeleteSticker = async (url, folderName) => {
    const modal = document.getElementById('delete-sticker-modal');
    const title = document.getElementById('ds-modal-title');
    const text = document.getElementById('ds-modal-text');
    const confirmBtn = document.getElementById('ds-confirm-btn');
    const cancelBtn = document.getElementById('ds-cancel-btn');

    // 1. Personalizar textos del modal
    title.innerText = `¿Eliminar de ${folderName}?`;
    text.innerText = `Este sticker se quitará solo de tu sección de ${folderName}.`;
    
    // 2. Mostrar el modal
    modal.style.display = 'flex';

    // 3. Crear una promesa para esperar la decisión del usuario
    const userChoice = await new Promise((resolve) => {
        confirmBtn.onclick = () => resolve(true);
        cancelBtn.onclick = () => resolve(false);
    });

    // 4. Ocultar modal inmediatamente
    modal.style.display = 'none';

    // 5. Si el usuario canceló, no hacemos nada
    if (!userChoice) return;

    // --- LÓGICA DE BORRADO (IGUAL QUE ANTES) ---
    const urlToDelete = url.includes('/uploads') ? url.substring(url.indexOf('/uploads')) : url;

    if (folderName === "Recientes") {
        recentStickers = recentStickers.filter(item => {
            const itemRel = item.includes('/uploads') ? item.substring(item.indexOf('/uploads')) : item;
            return itemRel !== urlToDelete;
        });
        localStorage.setItem('recentStickers', JSON.stringify(recentStickers));
    } else if (collections[folderName]) {
        collections[folderName] = collections[folderName].filter(item => {
            const itemRel = item.includes('/uploads') ? item.substring(item.indexOf('/uploads')) : item;
            return itemRel !== urlToDelete;
        });
        localStorage.setItem('stickerCollections', JSON.stringify(collections));
    }

    // Limpiar y Redibujar
    const wrapper = document.getElementById('custom-sticker-grid-wrapper');
    if (wrapper) wrapper.innerHTML = ''; 
    const tabs = document.getElementById('collection-tabs-container');
    if (tabs) tabs.innerHTML = '';

    hideStickerPreview();
    isLocked = false;
    renderCustomStickers();
    showToast(`Eliminado de ${folderName}`, "info");
};





    function hideStickerPreview() {
        previewOverlay.classList.remove('active');
        setTimeout(() => previewOverlay.innerHTML = '', 200); // Limpiar después de la animación
    }

    // --- ASIGNAR EVENTOS AL GRID ---
    if (customStickerGrid) {
        customStickerGrid.addEventListener('touchstart', (e) => {
            const item = e.target.closest('.sticker-item');
            if (!item) return;

            isLongPress = false;
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                const stickerUrl = item.getAttribute('data-sticker-url');
                showStickerPreview(stickerUrl);
            }, 500); // 500ms para activar
        }, { passive: true });

        customStickerGrid.addEventListener('touchend', (e) => {
            clearTimeout(longPressTimer);
            if (isLongPress) {
                hideStickerPreview();
                e.preventDefault(); // Evita que se envíe el sticker después de previsualizar
            }
        });

        customStickerGrid.addEventListener('touchmove', () => {
            clearTimeout(longPressTimer); // Si el dedo se mueve, cancelamos el longpress
        });
    }
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
        body.style.gridTemplateRows = 'auto 1fr 350px auto';
        pickerContainer.style.display = 'flex'; // Hacemos visible el selector
        // ==========================================================
         // ==========================================================
        // === ¡LA CLAVE!: AÑADIR CLASE PARA SUBIR LA FLECHA ===
        // ==========================================================
        body.classList.add('picker-open-active');
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
        
        body.style.gridTemplateRows = 'auto 1fr auto';
        pickerContainer.style.display = 'none';

        // ==========================================================
        // === ¡LA CLAVE!: QUITAR CLASE PARA BAJAR LA FLECHA ===
        // ==========================================================
        body.classList.remove('picker-open-active');
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
            content: contentToSend, // Aquí usamos el parámetro correcto
        };

        window.chatController.sendMessage(messageData);
        
        // --- LÓGICA DE RECIENTES CORREGIDA ---
        // Verificamos si el contenido es un link de sticker (contiene /uploads/)
        if (contentToSend.includes('/uploads/')) {
            addToRecents(contentToSend);
            // Opcional: redibujar para que aparezca en el panel inmediatamente
            renderCustomStickers(); 
        }
        // -------------------------------------

        domElements.chatInput.value = '';
        
        setTimeout(() => {
            if (domElements.messagesContainer) {
                domElements.messagesContainer.scrollTop = domElements.messagesContainer.scrollHeight;
            }
        }, 50);
    }





    // ==========================================================
    // === GESTIÓN ÚNICA Y CENTRALIZADA DEL PANEL DE STICKERS ===
    // ==========================================================
    const stickerWrapper = document.getElementById('custom-sticker-grid-wrapper');

    // 1. INICIO DEL TOQUE (touchstart)
    stickerWrapper.addEventListener('touchstart', (e) => {
        if (isLocked) return;

        const item = e.target.closest('.sticker-item');
        if (!item) return;

        // --- DETECTAR EN QUÉ CARPETA ESTÁ EL STICKER ---
        const parentSection = item.closest('.collection-section');
        const folderName = parentSection ? parentSection.dataset.name : "General";

        isLongPress = false;
        const stickerUrl = item.getAttribute('data-sticker-url');

        longPressTimer = setTimeout(() => {
            isLongPress = true;
            // Pasamos el nombre de la carpeta a la previsualización
            showStickerPreview(stickerUrl, folderName);

            lockTimer = setTimeout(() => {
                // Al bloquear, vinculamos el borrado con esa carpeta específica
                isLocked = true;
                const menu = document.getElementById('preview-menu');
                if (menu) menu.classList.add('visible');
                
                const deleteBtn = document.getElementById('btn-delete-sticker');
                if (deleteBtn) {
                    deleteBtn.onclick = (e) => {
                        e.stopPropagation();
                        handleDeleteSticker(stickerUrl, folderName);
                    };
                }
                if (window.navigator.vibrate) window.navigator.vibrate([60, 40, 60]);
            }, 1500); 

        }, 500);
    }, { passive: true });

    // 2. MOVIMIENTO DEL DEDO (touchmove)
    stickerWrapper.addEventListener('touchmove', () => {
        // Si el usuario desliza para hacer scroll, cancelamos los tiempos de previsualización
        // Pero solo si el menú no se ha bloqueado todavía
        if (!isLocked) {
            clearTimeout(longPressTimer);
            clearTimeout(lockTimer);
        }
    }, { passive: true });

    // 3. FINAL DEL TOQUE (touchend)
    stickerWrapper.addEventListener('touchend', (e) => {
        // Limpiamos los cronómetros pase lo que pase
        clearTimeout(longPressTimer);
        clearTimeout(lockTimer);
        
        // A. Si el menú está bloqueado (2 segundos cumplidos), no hacemos nada al soltar
        if (isLocked) return;

        // B. Detectar si tocamos el botón de añadir (+)
        const addBtn = e.target.closest('#create-sticker-btn');
        if (addBtn) {
            e.preventDefault();
            e.stopPropagation();
            openStickerCreator();
            return;
        }

        // C. Detectar si tocamos un sticker
        const item = e.target.closest('.sticker-item');
        if (!item) return;

        if (isLongPress) {
            // Estaba previsualizando (pasaron más de 500ms) pero soltó antes de los 2s
            hideStickerPreview();
            isLongPress = false;
        } else {
            // Fue un toque rápido (menos de 500ms): ENVIAR STICKER
            const stickerUrl = item.getAttribute('data-sticker-url');
            if (stickerUrl) {
                sendMessage(stickerUrl);
                closePicker();
            }
        }
    });

    // 4. CIERRE POR FONDO (Cuando el menú está bloqueado y fijo)
    previewOverlay.onclick = (e) => {
        if (isLocked) {
            isLocked = false;
            hideStickerPreview();
        }
    };
   
    
     // --- FUNCIÓN renderCustomStickers (CORREGIDA) ---
    // --- FUNCIÓN renderCustomStickers (ACTUALIZADA) ---
    // /web/js/modules/pages/chat.js

function renderCustomStickers() {
    const tabsContainer = document.getElementById('collection-tabs-container');
    const wrapper = document.getElementById('custom-sticker-grid-wrapper');

    if (!tabsContainer || !wrapper) return;

    // 1. DEFINIR EL ORDEN DE LAS COLECCIONES
    // Favoritos -> Recientes -> General -> El resto (de más nuevas a más viejas)
    const allKeys = Object.keys(collections);
    const otherKeys = allKeys.filter(k => k !== "Favoritos" && k !== "General").reverse();
    const finalOrder = ["Favoritos", "Recientes", "General", ...otherKeys];

    // 2. GENERAR EL HTML DE LAS PESTAÑAS (Barra superior)
    // 2. GENERAR EL HTML DE LAS PESTAÑAS (Barra superior con iconos vectoriales)
    tabsContainer.innerHTML = finalOrder.map(name => {
        const safeId = `section-${name.replace(/\s+/g, '-').toLowerCase()}`;
        let thumb = "";

        // ASIGNACIÓN DE ICONOS SEGÚN EL NOMBRE
        if (name === "Favoritos") {
            // Icono de Estrella (Mismo del menú contextual)
            thumb = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
        } 
        else if (name === "Recientes") {
            // Icono de Reloj (Proporcionado por ti)
            thumb = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12m10-4a1 1 0 1 0-2 0v5a1 1 0 0 0 1 1h5a1 1 0 1 0 0-2h-4z" clip-rule="evenodd"/></svg>`;
        } 
        else if (name === "General") {
            // Icono de Sticker con signo + (Proporcionado por ti)
            thumb = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 2h-13C3.6 2 2 3.6 2 5.5v13C2 20.4 3.6 22 5.5 22H16l6-6V5.5C22 3.6 20.4 2 18.5 2M13 16h-2v-3H8v-2h3V8h2v3h3v2h-3zm2 4v-1.5c0-1.9 1.6-3.5 3.5-3.5H20z"/></svg>`;
        } 
        else {
            // Para otras colecciones personalizadas: Primer sticker o letra inicial
            const list = collections[name] || [];
            const first = list[0];
            if (first) {
                const url = getFullImageUrl(first);
                thumb = url.endsWith('.mp4') 
                    ? `<video src="${url}" class="tab-thumb-render" muted loop playsinline></video>`
                    : `<img src="${url}" class="tab-thumb-render" loading="lazy">`;
            } else {
                thumb = `<span style="font-size: 10px; font-weight: bold;">${name[0]}</span>`;
            }
        }

        return `<div class="collection-tab-item" data-target="${safeId}">${thumb}</div>`;
    }).join('');

    // 3. GENERAR EL FEED ÚNICO (Lista continua)
    let fullHTML = "";
    finalOrder.forEach(name => {
        const list = (name === "Recientes") ? recentStickers : (collections[name] || []);
        const safeId = `section-${name.replace(/\s+/g, '-').toLowerCase()}`;

        // Solo dibujamos la sección si tiene stickers o si es "General" (por el botón +)
        if (list.length > 0 || name === "General") {
            fullHTML += `
                <div class="collection-section" id="${safeId}" data-name="${name}">
                    <div class="collection-title-display">${name}</div>
                    <div class="collection-grid">
                        ${name === "General" ? `
                            <div class="create-sticker-button" id="create-sticker-btn">
                                <span>+</span>
                            </div>` : ""
                        }
                        ${list.map(url => {
                            const fUrl = getFullImageUrl(url);
                            const isVid = fUrl.endsWith('.mp4');
                            return `
                                <div class="sticker-item-wrapper">
                                    ${isVid ? 
                                        `<video data-src="${fUrl}" class="sticker-item" data-sticker-url="${fUrl}" muted loop playsinline></video>
                                         <div class="video-sound-indicator" style="display:none; opacity:0;">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M11 5L6 9H2V15H6L11 19V5Z"></path>
                                                <path class="sound-wave" d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                            </svg>
                                         </div>` : 
                                        `<img data-src="${fUrl}" class="sticker-item" data-sticker-url="${fUrl}">`
                                    }
                                </div>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }
    });

    // Inyección masiva al DOM
    wrapper.innerHTML = fullHTML;

    // 4. ACTIVAR SISTEMAS DE POST-RENDERIZADO
    requestAnimationFrame(() => {
        // A. Activar Lazy Loading para todos los stickers inyectados
        wrapper.querySelectorAll('.sticker-item').forEach(item => {
            if (window.pickerMediaObserver) {
                window.pickerMediaObserver.observe(item);
            }
        });

        // B. Reproducir mini-videos de las pestañas
        tabsContainer.querySelectorAll('video').forEach(v => v.play().catch(() => {}));

        // C. Inicializar el resaltado de pestañas (Scroll Observer)
        setupScrollObserver();

        // D. Detectar audio en los videos del feed para mostrar el icono de altavoz
        wrapper.querySelectorAll('video.sticker-item').forEach(vid => {
            vid.onloadeddata = () => {
                setTimeout(() => {
                    const hasAudio = (vid.webkitAudioDecodedByteCount > 0 || vid.audioTracks?.length > 0 || vid.mozHasAudio);
                    if (hasAudio) {
                        const icon = vid.parentElement.querySelector('.video-sound-indicator');
                        if (icon) {
                            icon.style.display = "flex";
                            setTimeout(() => icon.style.opacity = "1", 50);
                        }
                    }
                }, 400);
            };
        });
    });


}

// Variable global para no duplicar vigilantes
let scrollObserver = null;

// --- VIGILANTE DE SCROLL REFORZADO ---
function setupScrollObserver() {
    const wrapper = document.getElementById('custom-sticker-grid-wrapper');
    const sections = document.querySelectorAll('.collection-section');
    const tabs = document.querySelectorAll('.collection-tab-item');

    if (!wrapper || sections.length === 0) return;

    // Usamos el evento 'scroll' para una precisión de píxel
    wrapper.onscroll = () => {
        // Si acabamos de hacer clic en una pestaña, ignoramos el cálculo un momento
        if (isManualScrolling) return;

        const containerTop = wrapper.getBoundingClientRect().top;
        const isAtBottom = Math.abs(wrapper.scrollHeight - wrapper.clientHeight - wrapper.scrollTop) < 5;

        let currentActiveId = "";

        if (isAtBottom) {
            // REGLA DE ORO: Si tocamos fondo, la activa es la última
            currentActiveId = sections[sections.length - 1].id;
        } else {
            // Buscamos cuál es la sección que está cruzando la franja superior (offset 100px)
            sections.forEach(section => {
                const rect = section.getBoundingClientRect();
                // Si la parte superior de la sección está cerca del tope del contenedor
                if (rect.top <= containerTop + 80) {
                    currentActiveId = section.id;
                }
            });
        }

        // Actualizar las pestañas visualmente
        if (currentActiveId) {
            tabs.forEach(tab => {
                const isActive = tab.dataset.target === currentActiveId;
                tab.classList.toggle('active', isActive);
                
                // Si la pestaña activa se oculta por el lado, la traemos al centro
                if (isActive) {
                    tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }
            });
        }
    };
}

// --- CLIC EN PESTAÑAS (CORREGIDO) ---
// Pon esto dentro de initChatPage()
const tabsBar = document.getElementById('collection-tabs-container');
if (tabsBar) {
    tabsBar.onclick = (e) => {
        const tab = e.target.closest('.collection-tab-item');
        if (tab) {
            const targetId = tab.dataset.target;
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                isManualScrolling = true; // Bloquear sensor
                
                // Resaltado instantáneo
                document.querySelectorAll('.collection-tab-item').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Salto a la sección
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Desbloquear tras 600ms (tiempo de la animación smooth)
                setTimeout(() => { isManualScrolling = false; }, 600);
            }
        }
    };
}

function attachCustomEvents() {
    // 1. Clic en iconos de arriba -> Scroll hasta la sección
    document.querySelectorAll('.collection-tab-item').forEach(tab => {
        tab.onclick = () => {
            const targetId = tab.dataset.target;
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };
    });

    // 2. Botón +
    const addBtn = document.getElementById('create-sticker-btn');
    if (addBtn) addBtn.onclick = openStickerCreator;
    
    // Nota: El envío de stickers ya lo manejas con la delegación de eventos en el wrapper.
}


    async function promptCollectionSelection(stickerUrl) {
    const modal = document.getElementById('collection-picker-modal');
    const list = document.getElementById('collection-list-container');
    const input = document.getElementById('new-collection-name');
    const addBtn = document.getElementById('add-collection-btn');

    modal.style.display = 'flex';

    const renderList = () => {
        list.innerHTML = Object.keys(collections).map(name => {
            let iconHTML = '';

            // --- ASIGNACIÓN DE ICONOS SEGÚN EL NOMBRE (Igual que en las pestañas) ---
            if (name === "Favoritos") {
                iconHTML = `<div class="modal-collection-placeholder"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>`;
            } 
            else if (name === "Recientes") {
                iconHTML = `<div class="modal-collection-placeholder"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12m10-4a1 1 0 1 0-2 0v5a1 1 0 0 0 1 1h5a1 1 0 1 0 0-2h-4z" clip-rule="evenodd"/></svg></div>`;
            } 
            else if (name === "General") {
                iconHTML = `<div class="modal-collection-placeholder"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 2h-13C3.6 2 2 3.6 2 5.5v13C2 20.4 3.6 22 5.5 22H16l6-6V5.5C22 3.6 20.4 2 18.5 2M13 16h-2v-3H8v-2h3V8h2v3h3v2h-3zm2 4v-1.5c0-1.9 1.6-3.5 3.5-3.5H20z"/></svg></div>`;
            } 
            else {
                // Para colecciones personalizadas, usamos el primer sticker como miniatura
                const firstSticker = collections[name][0];
                if (firstSticker) {
                    const url = getFullImageUrl(firstSticker);
                    const isVid = url.toLowerCase().endsWith('.mp4');
                    iconHTML = isVid 
                        ? `<video src="${url}" class="modal-collection-thumb" muted loop playsinline autoplay></video>`
                        : `<img src="${url}" class="modal-collection-thumb" loading="lazy">`;
                } else {
                    iconHTML = `<div class="modal-collection-placeholder">${name[0]}</div>`;
                }
            }

            return `
                <button class="collection-item-btn" data-name="${name}">
                    ${iconHTML}
                    <span style="flex-grow: 1;">${name}</span>
                    <span style="opacity: 0.4; font-size: 11px;">${collections[name].length}</span>
                </button>
            `;
        }).join('');
    };

    renderList();

    return new Promise((resolve) => {
        list.onclick = (e) => {
            const btn = e.target.closest('.collection-item-btn');
            if (btn) {
                const folderName = btn.dataset.name;
                collections[folderName].unshift(stickerUrl);
                localStorage.setItem('stickerCollections', JSON.stringify(collections));
                
                // LIMPIEZA DE PANTALLA PARA RECONSTRUCCIÓN
                const wrapper = document.getElementById('custom-sticker-grid-wrapper');
                const tabsContainer = document.getElementById('collection-tabs-container');
                if (wrapper) wrapper.innerHTML = ''; 
                if (tabsContainer) tabsContainer.innerHTML = '';

                modal.style.display = 'none';
                renderCustomStickers();
                resolve();
            }
        };

        // ... (Resto de la función addBtn y close igual que antes) ...
        addBtn.onclick = (e) => {
            e.preventDefault();
            const name = input.value.trim();
            if (name && !collections[name]) {
                // Crear la carpeta vacía
                collections[name] = [];
                input.value = "";
                renderList(); // Refrescar la lista de botones de arriba
                showToast(`Carpeta "${name}" creada`);
            } else if (collections[name]) {
                showToast("Esa carpeta ya existe", "error");
            }
        };

        document.getElementById('close-collection-modal').onclick = () => {
            modal.style.display = 'none';
            // Guardado por defecto si cancela
            collections["General"].unshift(stickerUrl);
            localStorage.setItem('stickerCollections', JSON.stringify(collections));
            
            const tabsContainer = document.getElementById('collection-tabs-container');
            if (tabsContainer) tabsContainer.innerHTML = '';
            const gridToReset = document.getElementById('grid-folder-General');
            if (gridToReset) gridToReset.remove();

            renderCustomStickers();
            resolve();
        };
    });
}
    async function uploadAndSendSticker(file, fileName) {
    try {
        const formData = new FormData();
        formData.append('stickerFile', file, fileName);

        // USAMOS LA NUEVA FUNCIÓN CON PROGRESO
        const response = await uploadWithProgress(formData);

        if (response.success && response.url) {
            const fullUrl = getFullImageUrl(response.url);
            sendMessage(fullUrl);
            await promptCollectionSelection(response.url);
        }
    } catch (error) {
        showToast("Error al subir: " + error.message, "error");
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
            // Limpiamos el input al terminar
            input.remove(); 
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
        // 1. Ocultar el modal
        if (stickerCreatorModal) stickerCreatorModal.style.display = 'none';

        // 2. Destruir el editor de fotos (Cropper)
        if (cropper) { 
            cropper.destroy(); 
            cropper = null; 
        }

        // 3. Detener y limpiar el video (Importante para el audio)
        if (stickerSourceVideo) {
            stickerSourceVideo.pause();
            stickerSourceVideo.src = "";
            stickerSourceVideo.load(); // Libera recursos
        }

        // 4. Limpiar variables de estado
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

        // 1. Quitar 'active' de todos los botones de pestaña
        pickerTabs.forEach(t => t.classList.remove('active'));
        // 2. Poner 'active' solo al botón clickeado
        tab.classList.add('active');

        // 3. Quitar 'active' de TODOS los paneles de contenido
        document.querySelectorAll('.picker-content-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // 4. Activar solo el panel que corresponde
        const targetPanel = document.getElementById(targetPanelId);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }

        // Carga de Giphy si es necesario
        if (targetPanelId === 'giphy-sticker-content' && giphyStickerGrid.children.length <= 1) {
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
                if (stickerSourceVideo) stickerSourceVideo.pause();
                
                saveStickerBtn.textContent = 'Procesando...';
                const loader = document.getElementById('custom-sticker-loader');
                const grid = document.getElementById('custom-sticker-grid-wrapper');

                // --- 1. PREPARAMOS LOS DATOS PRIMERO ---
                // Importante: No cerramos el creador todavía para no perder el 'sourceFile'
                const formData = new FormData();
                formData.append('stickerFile', sourceFile, 'video.mp4'); 
                formData.append('startTime', startTime);
                formData.append('muteAudio', !audioToggle.checked);

                try {
                    // Cerramos el editor para ver la barra de carga
                    stickerCreatorModal.style.display = 'none'; 

                    // USAMOS LA NUEVA FUNCIÓN CON PROGRESO
                    const result = await uploadWithProgress(formData);

                    if (result.success && result.url) {
                        const fullUrl = getFullImageUrl(result.url);
                        sendMessage(fullUrl);
                        await promptCollectionSelection(result.url);
                    }
                } catch (error) {
                    alert(`Error al procesar el video: ${error.message}`);
                } finally {
                    // --- 2. LIMPIAMOS TODO AL FINAL ---
                    closeStickerCreator(); // Ahora sí limpiamos el sourceFile
                    if (loader) loader.style.display = 'none';
                    if (grid) grid.style.display = 'block';
                    renderCustomStickers();
                    saveStickerBtn.disabled = false;
                    saveStickerBtn.textContent = 'Crear y Enviar';
                }
            }
        });
    }
    

    if (customStickerGrid) {
        customStickerGrid.addEventListener('click', (e) => {
            // Buscamos el item (img o video)
            const item = e.target.closest('.sticker-item');
            
            // Si tocamos un sticker (y NO el botón de añadir), enviamos
            if (item) {
                const stickerUrl = item.getAttribute('data-sticker-url');
                if (stickerUrl) {
                    sendMessage(stickerUrl);
                    closePicker();
                }
            }
        });
    }
    
    // Cargar stickers personalizados al inicio

    console.log("🔗 PÁGINA: Intentando inicializar controlador...");
    renderCustomStickers();
    // 2. INICIALIZAR EL CONTROLADOR DE CHAT
    // Llamada única
    window.chatController = await initChatController(domElements, otherUserId, loggedInUserId);

    // Escuchamos cuando el controlador añade un favorito
window.addEventListener('customStickersUpdated', () => {
    console.log("🔄 Actualizando panel por nuevo favorito...");
    
    // CAMBIO: Usamos 'collections' en lugar de 'customStickers'
    // Cargamos el objeto completo de colecciones del localStorage
    collections = JSON.parse(localStorage.getItem('stickerCollections')) || { "Favoritos": [], "General": [] };
    
    // Redibujamos el panel con los datos nuevos
    renderCustomStickers();
});
    
}