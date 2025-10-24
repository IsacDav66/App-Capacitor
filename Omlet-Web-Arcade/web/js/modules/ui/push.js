// /js/modules/ui/push.js (Versión de Depuración)

import { apiFetch } from '../api.js';

/**
 * Envía el token de registro de FCM al servidor backend para almacenarlo.
 */
const sendTokenToServer = async (token) => {
    try {
        await apiFetch('/api/user/fcm-token', {
            method: 'POST',
            body: JSON.stringify({ token: token.value }),
        });
        console.log('✅ PUSH: Token FCM enviado al servidor con éxito.');
    } catch (error) {
        console.error('❌ PUSH: Error al enviar el token FCM al servidor:', error);
    }
};

/**
 * Función principal para registrar el dispositivo y gestionar las notificaciones push.
 * Pide permisos, crea canales, obtiene el token y configura los listeners,
 * incluyendo el manejo de imágenes en las notificaciones.
 */
export const registerForPushNotifications = async () => {
    if (!window.Capacitor || window.Capacitor.getPlatform() === 'web') return;
    
    const { PushNotifications, LocalNotifications } = Capacitor.Plugins;

    // --- 1. SOLICITUD DE PERMISOS ---
    try {
        const pushPerms = await PushNotifications.requestPermissions();
        if (pushPerms.receive !== 'granted') throw new Error('Permiso para notificaciones push denegado.');
        
        const localPerms = await LocalNotifications.requestPermissions();
        if (localPerms.display !== 'granted') throw new Error('Permiso para notificaciones locales denegado.');
        
        console.log('Permisos para notificaciones concedidos.');
    } catch (e) {
        console.error('Error al solicitar permisos de notificación:', e);
        return;
    }

    // --- 2. CREACIÓN DEL CANAL DE NOTIFICACIÓN ---
    try {
        await LocalNotifications.createChannel({
            id: 'followers_channel',
            name: 'Nuevos Seguidores',
            description: 'Recibe notificaciones cuando alguien comience a seguirte.',
            importance: 5,
            vibration: true,
            sound: 'default',
            visibility: 1,
        });

        // ==========================================================
        // === ¡AÑADE ESTE NUEVO CANAL PARA MENSAJES! ===
        // ==========================================================
        await LocalNotifications.createChannel({
            id: 'chat_messages_channel', // ID único para mensajes
            name: 'Mensajes de Chat',
            description: 'Notificaciones para nuevos mensajes directos.',
            importance: 5, // MAX para que aparezca la notificación flotante
            vibration: true,
            sound: 'default',
            visibility: 1, // Muestra el contenido en la pantalla de bloqueo
        });
        // ==========================================================
        console.log('Canales de notificación creados o ya existentes.');
    } catch(e) {
        console.error("Error creando el canal de notificación:", e);
    }

    // --- 3. REGISTRO Y LISTENERS ---
    await PushNotifications.register();

    PushNotifications.addListener('registration', (token) => sendTokenToServer(token));
    PushNotifications.addListener('registrationError', (err) => console.error('Error en el registro de Push:', err.error));
    
    // Listener para cuando llega una notificación y la APP ESTÁ EN PRIMER PLANO
    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
        // El payload principal ahora es `notification.data`, ya que el backend no envía el campo `notification`.
        const data = notification.data;

        console.log('🔔 PUSH (Foreground): Notificación de DATOS recibida:', data);

        // Verificación de seguridad: si no hay datos, no hacemos nada.
        if (!data) {
            console.error('PUSH (Foreground): Notificación recibida sin payload de datos.');
            return;
        }

        // Construimos el objeto para la notificación local usando los datos recibidos.
        const localNotif = {
            title: data.title || "Nueva Notificación",
            body: data.body || "",
            id: new Date().getTime(), // ID único para cada notificación individual para que no se sobreescriban.
            schedule: { at: new Date(Date.now() + 100) }, // Mostrar casi instantáneamente.
            sound: 'default',
            
            // El backend nos dice qué canal usar. Si no, usamos uno por defecto.
            channelId: data.channelId || 'fcm_default_channel',

            // El icono pequeño que creaste en los recursos de Android.
            smallIcon: 'ic_stat_notification',
            
            // Propiedades de persistencia.
            autoCancel: false, // La notificación no se borrará al tocarla.
            ongoing: false,    // El usuario sí podrá deslizarla para borrarla.

            // ¡Lógica clave para el APILAMIENTO!
            // Usamos el `groupId` que nos envía el backend (que es el ID del remitente).
            group: data.groupId, 
            
            // Esto crea una notificación "resumen" cuando hay 2 o más
            // notificaciones en el mismo grupo (ej. "2 mensajes de Ana").
            groupSummary: true,

            // Pasamos todos los datos recibidos al campo `extra` para poder usarlos
            // cuando el usuario toque la notificación (ej. para la redirección).
            extra: data || {}
        };

        // Si el backend envió una URL de imagen, la usamos como el avatar de la notificación.
        if (data.imageUrl) {
            localNotif.largeIcon = data.imageUrl;
            localNotif.largeIconColor = '#8A2BE2'; // Color de fondo si la imagen no carga.
        }

        // Finalmente, programamos la notificación local para que se muestre.
        try {
            await LocalNotifications.schedule({
                notifications: [ localNotif ]
            });
            console.log('✅ PUSH (Foreground): Notificación local agrupada programada con éxito.');
        } catch (error) {
            console.error('❌ PUSH (Foreground): ¡FALLO al programar la notificación local!', error);
        }
    });


    // ==========================================================
    // === ¡AQUÍ ESTÁ LA LÓGICA UNIFICADA PARA EL CLIC! ===
    // ==========================================================
    
    /**
     * Función que se ejecuta cuando el usuario toca cualquier tipo de notificación.
     * @param {object} action - El objeto de acción de la notificación.
     */
    const handleNotificationAction = (action) => {
        console.log('El usuario ha tocado una notificación:', action);
        
        // El payload de datos puede estar en `notification.data` (para Push)
        // o en `notification.extra` (para Local). Lo comprobamos en ambos.
        const data = action.notification.data || action.notification.extra;
        
        // Verificamos si en los datos existe la clave `openUrl` que enviamos desde el backend.
        if (data && data.openUrl) {
            console.log(`Navegando a la URL: ${data.openUrl}`);
            // Usamos `location.href` para navegar a la nueva página.
            window.location.href = data.openUrl;
        } else {
            console.log('La notificación no contenía una URL de acción.');
        }
    };

    // Asignamos el mismo manejador a AMBOS listeners.
    PushNotifications.addListener('pushNotificationActionPerformed', handleNotificationAction);
    LocalNotifications.addListener('localNotificationActionPerformed', handleNotificationAction);
};