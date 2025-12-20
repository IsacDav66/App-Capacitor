package com.omletwebfinal;

import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject; // <-- ¡AÑADE ESTA LÍNEA!

import com.omletwebfinal.plugins.updater.AppUpdater;
// Importaciones para tus plugins Java personalizados
import com.omletwebfinal.plugins.gamedetector.GameDetector;
import com.omletwebfinal.plugins.navigationbar.NavigationBarPlugin;

public class MainActivity extends BridgeActivity {

    public static final String TAG = "MainActivity";

    // --- 1. DECLARAR UNA INSTANCIA ESTÁTICA ---
    // Esta variable mantendrá una referencia a la instancia activa de MainActivity.
    private static MainActivity instance;

    /**
     * El método onCreate se llama cuando la actividad de la aplicación se crea.
     */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "🟢 Actividad Principal (onCreate) iniciada.");

        // --- 2. ASIGNAR LA INSTANCIA ACTUAL ---
        // 'this' se refiere a la instancia actual de MainActivity.
        // La guardamos en nuestra variable estática para que otros puedan acceder a ella.
        instance = this;
    }

    /**
     * El constructor registra tus plugins Java personalizados.
     * (Esta parte se mantiene igual).
     */
    public MainActivity() {
        registerPlugin(GameDetector.class);
        registerPlugin(NavigationBarPlugin.class);
        registerPlugin(AppUpdater.class); // <-- ¡AÑADE ESTA LÍNEA!
    }
    
    /**
     * --- 3. CREAR EL MÉTODO DE ACCESO ESTÁTICO ---
     * Este método público y estático permite que otras clases (como OverlayService)
     * obtengan la instancia activa de MainActivity sin necesidad de tener una referencia directa.
     * @return La instancia actual de MainActivity, o null si no está activa.
     */
    public static MainActivity getInstance() {
        return instance;
    }

    // Nota: Ya no necesitamos los métodos onNewIntent() o handleIntent()
    // porque el plugin @capacitor/app se encarga de la lógica de Deep Linking
    // a través de la configuración en AndroidManifest.xml.
// ==========================================================
    // === ¡NUEVO MÉTODO DE PUENTE MANUAL! ===
    // ==========================================================
    /**
     * Este método es llamado por el OverlayService para enviar datos al WebView.
     * Ejecuta JavaScript directamente para evitar los problemas de los listeners de eventos.
     * @param packageName El nombre del paquete detectado.
     * @param appName El nombre de la app detectada.
     */
    public void sendAppStatusToWebview(String packageName, String appName) {
        Log.d(TAG, "➡️ Recibiendo estado de la app desde el servicio nativo: " + packageName);

        // Nos aseguramos de que esta operación se ejecute en el hilo principal de la UI.
        runOnUiThread(() -> {
            JSObject data = new JSObject();
            data.put("packageName", packageName);
            data.put("appName", appName);

            // Construimos una llamada a una función JavaScript global que crearemos.
            // Usamos `evaluateJavascript` que es la forma más segura.
            // Creamos un evento personalizado manualmente.
            String script = "window.dispatchEvent(new CustomEvent('appStatusChanged', { detail: " + data.toString() + " }));";

            // Ejecutamos el script en el WebView.
            getBridge().getWebView().evaluateJavascript(script, null);
            Log.d(TAG, "✅ Script de evento 'appStatusChanged' inyectado en el WebView.");
        });
    }
    // ==========================================================
}