package com.omletwebfinal.plugins.gamedetector;

import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;
import android.app.usage.UsageStats;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;
import java.util.SortedMap;
import java.util.TreeMap;
import android.content.SharedPreferences;
import android.util.Log; // <-- AÑADE ESTA LÍNEA
import com.getcapacitor.PluginCall; // <-- AÑADE ESTA LÍNEA

@CapacitorPlugin(name = "GameDetector")
public class GameDetector extends Plugin {

    // --- Implementación de getForegroundApp (método de utilidad) ---
    @PluginMethod()
    public void getForegroundApp(final com.getcapacitor.PluginCall call) {
        Context context = getContext();
        String foregroundAppPackage = getForegroundAppPackage(context);

        JSObject result = new JSObject();
        if (foregroundAppPackage != null) {
            result.put("packageName", foregroundAppPackage);
            result.put("appName", getApplicationName(context, foregroundAppPackage));
            call.resolve(result);
        } else {
            result.put("packageName", "android.system");
            result.put("appName", "Launcher/Sistema");
            call.resolve(result);
        }
    }



    @PluginMethod
    public void setAuthToken(final com.getcapacitor.PluginCall call) {
        String token = call.getString("token");
        if (token == null) {
            call.reject("No se proporcionó ningún token.");
            return;
        }

        // Guardamos el token en SharedPreferences para que el servicio pueda leerlo
        SharedPreferences sharedPref = getContext().getSharedPreferences("OMLET_APP_PREFS", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPref.edit();
        editor.putString("authToken", token);
        editor.apply();
        
        Log.d("GameDetector", "Token de autenticación guardado en SharedPreferences.");
        call.resolve();
    }

    // --- Métodos de Ayuda (privados) ---
    private String getForegroundAppPackage(Context context) {
        UsageStatsManager usm = (UsageStatsManager) context.getSystemService(Context.USAGE_STATS_SERVICE);
        if (usm == null) {
            return null;
        }
        long time = System.currentTimeMillis();
        List<UsageStats> appList = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, time - 1000 * 5, time);
        if (appList != null && appList.size() > 0) {
            SortedMap<Long, UsageStats> mySortedMap = new TreeMap<>();
            for (UsageStats usageStats : appList) {
                if (usageStats.getTotalTimeInForeground() > 0) {
                    mySortedMap.put(usageStats.getLastTimeUsed(), usageStats);
                }
            }
            if (!mySortedMap.isEmpty()) {
                return mySortedMap.get(mySortedMap.lastKey()).getPackageName();
            }
        }
        return null;
    }

    private String getApplicationName(Context context, String packageName) {
        try {
            android.content.pm.ApplicationInfo ai = context.getPackageManager().getApplicationInfo(packageName, 0);
            return (String) context.getPackageManager().getApplicationLabel(ai);
        } catch (PackageManager.NameNotFoundException e) {
            return packageName;
        }
    }

    // --- Métodos para controlar el OverlayService ---
    @PluginMethod()
    public void startFloatingOverlay(final com.getcapacitor.PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), OverlayService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("message", "Servicio de superposición iniciado.");
        call.resolve(result);
    }

    @PluginMethod()
    public void stopFloatingOverlay(com.getcapacitor.PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), OverlayService.class);
        getContext().stopService(serviceIntent);
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("message", "Servicio de superposición detenido.");
        call.resolve(result);
    }

    // --- Método para sincronizar el tema ---
    @PluginMethod
    public void setTheme(final com.getcapacitor.PluginCall call) {
        JSObject theme = call.getObject("theme");
        if (theme == null) {
            call.reject("El objeto 'theme' es nulo.");
            return;
        }
        Intent intent = new Intent("com.omletwebfinal.THEME_UPDATED");
        intent.putExtra("surfaceColor", theme.getString("surfaceColor"));
        intent.putExtra("textColor", theme.getString("textColor"));
        intent.putExtra("textSecondaryColor", theme.getString("textSecondaryColor"));
        getContext().sendBroadcast(intent);
        call.resolve();
    }

    // =====================================================================
    // === ¡NUEVO MÉTODO PARA MOSTRAR EL FORMULARIO EN LA VENTA FLOTANTE! ===
    // =====================================================================
    @PluginMethod
    public void showDefineAppForm(final com.getcapacitor.PluginCall call) {
        String packageName = call.getString("packageName");
        if (packageName == null || packageName.isEmpty()) {
            call.reject("Falta el nombre del paquete (packageName).");
            return;
        }

        // Enviamos una transmisión (broadcast) que solo nuestro OverlayService escuchará.
        // Esta es la forma de comunicar una acción desde un Plugin a un Service activo.
        Intent intent = new Intent("com.omletwebfinal.SHOW_DEFINE_FORM");
        intent.putExtra("packageName", packageName);
        getContext().sendBroadcast(intent);

        call.resolve();
    }


 // ==========================================================
    // === ¡NUEVO MÉTODO PARA QUE JAVA OBTENGA EL TEMA DE JS! ===
    // ==========================================================
    @PluginMethod
    public void syncThemeToNative(final PluginCall call) {
        JSObject theme = call.getObject("theme");
        if (theme == null) {
            call.reject("El objeto 'theme' es nulo.");
            return;
        }
        Intent intent = new Intent("com.omletwebfinal.THEME_UPDATED");

        // Pasamos todos los colores que JS nos envía
        intent.putExtra("bgColor", theme.getString("bgColor"));
        intent.putExtra("textColor", theme.getString("textColor"));
        intent.putExtra("secondaryTextColor", theme.getString("secondaryTextColor"));
        intent.putExtra("surfaceColor", theme.getString("surfaceColor"));
        intent.putExtra("accentColor", theme.getString("accentColor"));
        
        // --- ¡AÑADE ESTAS DOS LÍNEAS QUE FALTABAN! ---
        intent.putExtra("uiColor", theme.getString("uiColor"));
        intent.putExtra("borderColor", theme.getString("borderColor")); // Usaremos 'borderColor' para ser claros
        
        getContext().sendBroadcast(intent);
        call.resolve();
    }
}