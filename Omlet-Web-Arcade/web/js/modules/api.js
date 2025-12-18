// /js/modules/api.js

// La URL base CORRECTA que tu proxy Nginx entiende.
export const API_BASE_URL = 'https://davcenter.servequake.com/app';

/**
 * Función genérica para realizar peticiones a la API.
 * Centraliza la lógica de autenticación y manejo de errores.
 */
export async function apiFetch(endpoint, options = {}) {
    // LOG A: Ver el token que estamos a punto de usar desde el localStorage.
    const token = localStorage.getItem('authToken');
    console.log(`[API Fetch LOG] Token recuperado de localStorage para la petición a ${endpoint}:`, token);

    const headers = { ...options.headers };
    const finalOptions = { ...options };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Si el body es un FormData, no establecemos Content-Type.
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    // Para peticiones GET, forzamos que no use la caché para obtener siempre datos frescos.
    if (!finalOptions.method || finalOptions.method.toUpperCase() === 'GET') {
        finalOptions.cache = 'no-store';
    }
    
    try {
        const finalUrl = `${API_BASE_URL}${endpoint}`;
        
        // LOG B: Ver la petición final exacta que se va a enviar.
        console.log(`[API Fetch LOG] Enviando petición a: ${finalUrl}`);
        
        const response = await fetch(finalUrl, {
            ...finalOptions,
            headers,
        });

        const responseData = await response.json().catch(() => ({}));

        if (!response.ok) {
            // Este error se mostrará si la respuesta es 404, 401, 500, etc.
            throw new Error(responseData.message || `Error del servidor: ${response.status}`);
        }

        return responseData;
    } catch (error) {
        // Este error se mostrará si hay un problema de red, CORS, etc.
        console.error(`Error en API Fetch (${endpoint}):`, error);
        throw error;
    }
}