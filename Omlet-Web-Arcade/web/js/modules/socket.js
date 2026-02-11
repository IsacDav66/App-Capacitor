// /js/modules/socket.js

import { API_BASE_URL } from './api.js';

let socket = null;

/**
 * Inicializa y devuelve una instancia única del socket.
 * @returns {Promise<Socket>} Una promesa que se resuelve con la instancia del socket.
 */
export async function getSocket() {
    // Si el socket ya fue creado, lo devolvemos inmediatamente.
    if (socket) return socket;

    try {
        const { default: io } = await import('../../libs/socket.io.esm.min.js');
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            throw new Error("No hay token de autenticación para la conexión del socket.");
        }
        
        socket = io(API_BASE_URL.replace('/app', ''), { path: "/app/socket.io/" });

        socket.on('connect', () => {
            console.log("🚀 SOCKET: Conectado y autenticando...");
            socket.emit('authenticate', token);
        });

        return socket;

    } catch (error) {
        console.error("❌ SOCKET: Fallo al inicializar el socket.", error);
        return null;
    }
}