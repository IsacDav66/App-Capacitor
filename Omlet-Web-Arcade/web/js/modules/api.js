// /js/modules/api.js

export const API_BASE_URL = 'https://davcenter.servequake.com/app';

/**
 * Función genérica para realizar peticiones a la API.
 * Centraliza la lógica de autenticación y manejo de errores.
 */
export async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    const headers = { ...options.headers };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Si el body es un FormData, no establecemos Content-Type
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const responseData = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(responseData.message || `Error del servidor: ${response.status}`);
        }

        return responseData;
    } catch (error) {
        console.error(`Error en API Fetch (${endpoint}):`, error);
        throw error; // Re-lanza el error para que el llamador pueda manejarlo
    }
}