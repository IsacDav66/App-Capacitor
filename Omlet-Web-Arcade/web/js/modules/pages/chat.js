// /js/modules/pages/chat.js

// Importamos el controlador que tiene toda la lógica
import { initChatController } from '../controllers/chatController.js';
// Importamos la función para obtener el ID del usuario actual
import { getCurrentUserId } from '../state.js';

/**
 * Función de inicialización para la página de chat principal.
 * Su única tarea es recolectar los elementos del DOM y pasarlos al controlador.
 */
export async function initChatPage() {
    // 1. Obtener los IDs de los usuarios de la URL y del estado global.
    const params = new URLSearchParams(window.location.search);
    const otherUserId = params.get('userId');
    const loggedInUserId = getCurrentUserId();

    // Verificación de seguridad
    if (!otherUserId || !loggedInUserId) {
        alert("Error: No se pudo iniciar el chat. Sesión o usuario inválido.");
        window.history.back();
        return;
    }

    // 2. Crear un objeto que contenga todas las referencias a los elementos del DOM
    //    que el controlador necesitará para funcionar. Los IDs deben coincidir
    //    con los que tienes en tu archivo `chat.html`.
    const domElements = {
        // Contenedores principales
        messagesContainer: document.getElementById('chat-messages-container'),
        
        // Elementos del header
        userAvatar: document.getElementById('chat-user-avatar'),
        userUsername: document.getElementById('chat-user-username'),
        
        // Formulario de envío
        chatForm: document.getElementById('chat-form'),
        chatInput: document.getElementById('chat-message-input'),
        
        // Elementos de la barra de respuesta
        replyContextBar: document.getElementById('reply-context-bar'),
        replyToUser: document.getElementById('reply-to-user'),
        replySnippet: document.getElementById('reply-snippet'),
        cancelReplyBtn: document.getElementById('cancel-reply-btn'),
        
        // Elementos del menú contextual
        contextMenuOverlay: document.getElementById('context-menu-overlay'),
        contextMenu: document.getElementById('context-menu'),
        replyFromMenuBtn: document.getElementById('reply-from-menu-btn'),
        copyBtn: document.getElementById('copy-btn'),
        deleteBtn: document.getElementById('delete-from-menu-btn'),
        
        // Elementos del header de fecha pegajoso
        stickyHeader: document.getElementById('sticky-date-header'),
        stickyHeaderText: document.getElementById('sticky-date-header')?.querySelector('span'),
    
     // --- ¡AÑADE ESTAS LÍNEAS! ---
        deleteConfirmModal: document.getElementById('delete-confirm-modal'),
        cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
        confirmDeleteBtn: document.getElementById('confirm-delete-btn')
    };
    
    // 3. Llamar al controlador, pasándole el objeto de elementos y los IDs.
    // El `await` asegura que la función espera a que el controlador termine su inicialización
    // (como cargar el historial) antes de continuar, si fuera necesario.
    await initChatController(domElements, otherUserId, loggedInUserId);

    console.log("✅ Controlador de chat inicializado para la página principal.");
}