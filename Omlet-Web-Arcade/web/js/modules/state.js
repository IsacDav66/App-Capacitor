// /js/modules/state.js

import { apiFetch } from './api.js';

let currentUser = null;

/**
 * Obtiene los datos del usuario logueado desde la API y los almacena en una variable local.
 * Se ejecuta una sola vez al cargar la aplicación.
 */
export async function fetchCurrentUser() {
    if (!localStorage.getItem('authToken')) {
        currentUser = null;
        return null;
    }
    
    // Si ya tenemos el usuario, no lo volvemos a pedir.
    if (currentUser) return currentUser;

    try {
        const response = await apiFetch('/api/user/me');
        if (response.success) {
            currentUser = response.data;
            return currentUser;
        }
        return null;
    } catch (error) {
        console.error("Fallo al obtener el usuario actual. Puede que el token haya expirado.", error);
        localStorage.removeItem('authToken'); // Limpia el token inválido
        currentUser = null;
        return null;
    }
}

export function getCurrentUser() {
    return currentUser;
}

export function getCurrentUserId() {
    return currentUser ? currentUser.userId : null;
}