// /js/modules/api.js

export const API_BASE_URL = 'https://davcenter.servequake.com/app';

export async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    const headers = { ...options.headers };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // No establecemos 'Content-Type' para FormData, multer lo necesita así.
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const finalOptions = {
        ...options,
        headers,
        cache: 'no-store' // Siempre pedir datos frescos
    };
    
    const finalUrl = `${API_BASE_URL}${endpoint}`;
    
    try {
        console.log(`[API Fetch LOG] Enviando petición a: ${finalUrl}`);
        const response = await fetch(finalUrl, finalOptions);

        // --- LÓGICA DE RESPUESTA MÁS ROBUSTA ---
        
        // Obtenemos el texto de la respuesta para poder analizarlo si es necesario
        const responseText = await response.text();

        // Si la respuesta no es OK, mostramos el texto y lanzamos el error
        if (!response.ok) {
            console.error(`[API Fetch ERROR] Respuesta no-OK (${response.status}) para ${endpoint}. Texto:`, responseText);
            // Intentamos parsear el error del JSON, si no, usamos el texto.
            try {
                const errorJson = JSON.parse(responseText);
                throw new Error(errorJson.message || `Error del servidor: ${response.status}`);
            } catch (e) {
                throw new Error(`Error del servidor: ${response.status}`);
            }
        }
        
        // Si la respuesta es OK, intentamos parsearla como JSON.
        try {
            // Si la respuesta está vacía (algunas respuestas 200 OK no tienen cuerpo), devolvemos un objeto de éxito.
            if (responseText === '') {
                return { success: true };
            }
            return JSON.parse(responseText);
        } catch (e) {
            console.error(`[API Fetch ERROR] La respuesta para ${endpoint} no era un JSON válido, aunque el estado era OK. Texto:`, responseText);
            throw new Error('La respuesta del servidor no tenía el formato esperado.');
        }
        
    } catch (error) {
        // Captura errores de red (ej. sin conexión, problemas de CORS, etc.)
        console.error(`[API Fetch NETWORK ERROR] Error de red para ${endpoint}:`, error);
        throw error;
    }
}




export const ChatCache = {
    // Guarda los mensajes de un chat específico
    set: (myId, partnerId, messages) => {
        const key = `chat_cache_${myId}_${partnerId}`;
        localStorage.setItem(key, JSON.stringify(messages.slice(-200))); // <--- Guardamos los últimos 200
    },
    // Recupera los mensajes del disco
    get: (myId, partnerId) => {
        const key = `chat_cache_${myId}_${partnerId}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }
};