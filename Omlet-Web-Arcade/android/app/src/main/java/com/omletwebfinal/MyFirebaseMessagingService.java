package com.omletwebfinal;

import android.Manifest;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri; // Importación necesaria para Uri.parse()
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.Person;
import androidx.core.graphics.drawable.IconCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "MyFirebaseMsgService";

    // Almacenamiento estático en memoria para los mensajes de cada conversación.
    // Esto agrupa los mensajes que llegan mientras la app está cerrada.
    private static final Map<String, List<NotificationCompat.MessagingStyle.Message>> messageHistory = new HashMap<>();

    /**
     * Este método se llama automáticamente cuando el dispositivo recibe una notificación push
     * y la aplicación no está en primer plano.
     * @param remoteMessage El objeto que contiene los datos de la notificación.
     */
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        if (remoteMessage.getData().containsKey("type") && 
            "update_alert".equals(remoteMessage.getData().get("type"))) {
            
            // 1. Intentamos obtener el título y cuerpo de la notificación
            String title = "¡Nueva Actualización!";
            String body = "Hay mejoras disponibles.";

            if (remoteMessage.getNotification() != null) {
                title = remoteMessage.getNotification().getTitle();
                body = remoteMessage.getNotification().getBody();
            } else if (remoteMessage.getData().containsKey("title")) {
                // Fallback: Si no hay objeto notification, buscamos en data
                title = remoteMessage.getData().get("title");
                body = remoteMessage.getData().get("body");
            }
            
            showUpdateNotification(title, body);
        } else {
            if (remoteMessage.getData().size() > 0) {
                sendMessagingStyleNotification(remoteMessage.getData());
            }
        }
    }


    private void showUpdateNotification(String title, String body) {
        // 1. Crear la acción (abrir la app)
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 
                999, // ID único
                intent, 
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        // 2. Construir la notificación
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, "fcm_default_channel")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true) // Se borra al tocarla
                .setContentIntent(pendingIntent); // <--- ESTO ES LO QUE FALTABA

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this);
        
        // 3. Verificar permiso antes de mostrar (Obligatorio en Android moderno)
        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
            notificationManager.notify(999, builder.build());
        }
    }


    /**
     * Construye y muestra una notificación de estilo mensajería agrupada.
     * @param data El payload de datos recibido de Firebase.
     */
    private void sendMessagingStyleNotification(Map<String, String> data) {
        Log.d(TAG, "Payload de datos recibido: " + data.toString());

        // --- 1. OBTENER DATOS DEL PAYLOAD ---
        String title = data.get("title");       // Nombre del remitente
        String body = data.get("body");         // Contenido del mensaje
        String channelId = data.get("channelId");
        String groupId = data.get("groupId");   // ID del remitente, usado para agrupar
        String imageUrl = data.get("imageUrl");   // URL del avatar del remitente
        String openUrl = data.get("openUrl");     // URL de destino al hacer clic (ej: chat.html?userId=13)

        if (groupId == null || channelId == null) {
            Log.e(TAG, "Faltan 'groupId' o 'channelId' en el payload. No se puede crear la notificación.");
            return;
        }

        // --- 2. PREPARAR EL INTENT PARA LA ACCIÓN DE CLIC (DEEP LINKING) ---
        Intent intent;
        if (openUrl != null && !openUrl.isEmpty()) {
            // Construimos una URL con nuestro esquema personalizado definido en AndroidManifest.xml
            String deepLink = "com.omletwebfinal://open/" + openUrl;
            intent = new Intent(Intent.ACTION_VIEW, Uri.parse(deepLink));
            Log.d(TAG, "Intent creado con Deep Link: " + deepLink);
        } else {
            // Si por alguna razón no viene la URL, simplemente abrimos la app en la página principal.
            intent = new Intent(this, MainActivity.class);
        }

        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, groupId.hashCode(), intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        // --- 3. DESCARGAR LA IMAGEN DE PERFIL (AVATAR) ---
        Bitmap largeIcon = null;
        if (imageUrl != null && !imageUrl.isEmpty()) {
            try {
                URL url = new URL(imageUrl);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setDoInput(true);
                connection.connect();
                InputStream input = connection.getInputStream();
                largeIcon = BitmapFactory.decodeStream(input);
            } catch (Exception e) {
                Log.e(TAG, "Error al descargar la imagen de perfil para la notificación", e);
            }
        }

        // --- 4. PREPARAR OBJETOS 'PERSON' PARA EL ESTILO DE MENSAJERÍA ---
        Person sender = new Person.Builder()
                .setName(title)
                .setIcon(largeIcon != null ? IconCompat.createWithBitmap(largeIcon) : null)
                .build();

        Person user = new Person.Builder().setName("Tú").build();

        // --- 5. GESTIONAR HISTORIAL DE MENSAJES PARA LA NOTIFICACIÓN AGRUPADA ---
        List<NotificationCompat.MessagingStyle.Message> messages = messageHistory.get(groupId);
        if (messages == null) {
            messages = new ArrayList<>();
        }
        messages.add(new NotificationCompat.MessagingStyle.Message(body, System.currentTimeMillis(), sender));
        messageHistory.put(groupId, messages);

        // --- 6. CREAR EL ESTILO DE NOTIFICACIÓN TIPO CHAT ---
        NotificationCompat.MessagingStyle messagingStyle = new NotificationCompat.MessagingStyle(user)
                .setConversationTitle(title)
                .setGroupConversation(false);

        for (NotificationCompat.MessagingStyle.Message msg : messages) {
            messagingStyle.addMessage(msg);
        }

        // --- 7. CONSTRUIR LA NOTIFICACIÓN FINAL ---
        NotificationCompat.Builder notificationBuilder =
                new NotificationCompat.Builder(this, channelId)
                        .setSmallIcon(R.mipmap.ic_launcher)
                        .setStyle(messagingStyle)
                        .setContentIntent(pendingIntent)
                        .setGroup(groupId)
                        .setAutoCancel(true)
                        .setPriority(NotificationCompat.PRIORITY_HIGH);

        if (largeIcon != null) {
            notificationBuilder.setLargeIcon(largeIcon);
        }

        // --- 8. ENVIAR LA NOTIFICACIÓN ---
        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this);

        // El ID de la notificación debe ser FIJO por conversación para que se actualice.
        int notificationId = groupId.hashCode();

        // Verificación de permiso para Android 13+
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            Log.e(TAG, "Permiso POST_NOTIFICATIONS denegado. No se puede mostrar la notificación.");
            return;
        }

        notificationManager.notify(notificationId, notificationBuilder.build());
        Log.d(TAG, "Notificación de mensajería (ID: " + notificationId + ") enviada/actualizada para el grupo: " + groupId);
    }
}