package com.omletwebfinal.plugins.gamedetector;

import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;
import android.app.usage.UsageStats;
import java.util.SortedMap;
import java.util.TreeMap;
import android.os.Build;

@CapacitorPlugin(name = "GameDetector")
public class GameDetector extends Plugin {

    // --- Implementación de getForegroundApp (El método llamado desde JS) ---
    @PluginMethod()
    public void getForegroundApp(final com.getcapacitor.PluginCall call) {
        Context context = getContext();

        // =====================================================================
        // !!! BYPASS DE PERMISOS PARA PRUEBAS (Descomentar al publicar) !!!
        // =====================================================================
        // if (!hasUsageStatsPermission(context)) {
        //     Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        //     intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        //     context.startActivity(intent);
        //     call.reject("Permiso USAGE_STATS faltante...");
        //     return;
        // }
        // =====================================================================

        // 2. Obtener la aplicación en primer plano (¡Ahora se ejecuta siempre!)
        String foregroundAppPackage = getForegroundAppPackage(context);

        JSObject result = new JSObject();
        if (foregroundAppPackage != null) {
            // Obtener el nombre amigable
            result.put("packageName", foregroundAppPackage);
            result.put("appName", getApplicationName(context, foregroundAppPackage));
            call.resolve(result); // Éxito
        } else {
            // No se encontró una aplicación de usuario en primer plano (probablemente el Launcher)
            result.put("packageName", "android.system");
            result.put("appName", "Launcher/Sistema");
            call.resolve(result);
        }
    }

    // --- getForegroundAppPackage (Obtiene la aplicación con la última hora de uso) ---
    private String getForegroundAppPackage(Context context) {
        UsageStatsManager usm = (UsageStatsManager) context.getSystemService(Context.USAGE_STATS_SERVICE);
        if (usm == null) {
            return null;
        }

        long time = System.currentTimeMillis();

        // Consulta las estadísticas de uso en los últimos 5 segundos
        List<UsageStats> appList = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, time - 1000 * 5, time);

        if (appList != null && appList.size() > 0) {
            SortedMap<Long, UsageStats> mySortedMap = new TreeMap<>();
            for (UsageStats usageStats : appList) {
                if (usageStats.getTotalTimeInForeground() > 0) {
                    mySortedMap.put(usageStats.getLastTimeUsed(), usageStats);
                }
            }
            if (!mySortedMap.isEmpty()) {
                // Devuelve el nombre del paquete con el uso más reciente
                return mySortedMap.get(mySortedMap.lastKey()).getPackageName();
            }
        }
        return null;
    }

    // --- hasUsageStatsPermission (Verifica si el permiso está dado) ---
    private boolean hasUsageStatsPermission(Context context) {
        UsageStatsManager usm = (UsageStatsManager) context.getSystemService(Context.USAGE_STATS_SERVICE);
        if (usm == null) {
            return false;
        }
        long time = System.currentTimeMillis();
        // El simple hecho de hacer una consulta exitosa verifica el permiso.
        List<UsageStats> stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, time - 1000, time);
        return stats != null && !stats.isEmpty();
    }

    // --- getApplicationName (Obtiene el nombre visible de la app) ---
    private String getApplicationName(Context context, String packageName) {
        try {
            android.content.pm.ApplicationInfo ai = context.getPackageManager().getApplicationInfo(packageName, 0);
            return (String) context.getPackageManager().getApplicationLabel(ai);
        } catch (PackageManager.NameNotFoundException e) {
            return packageName; // Devuelve el paquete si no encuentra el nombre
        }
    }

    // --- Implementación de startFloatingOverlay ---
    @PluginMethod()
    public void startFloatingOverlay(final com.getcapacitor.PluginCall call) {
        // ESTO INICIA EL SERVICIO CORREGIDO
        Intent serviceIntent = new Intent(getContext(), OverlayService.class);

        // Usamos startForegroundService
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }

        JSObject result = new JSObject();
        result.put("success", true);
        result.put("message", "Foreground Service Iniciado (revisar notificación).");
        call.resolve(result);
    }

    @PluginMethod()
    public void stopFloatingOverlay(com.getcapacitor.PluginCall call) {
        // Este método detendrá el servicio
        Intent serviceIntent = new Intent(getContext(), OverlayService.class);
        getContext().stopService(serviceIntent);

        JSObject result = new JSObject();
        result.put("success", true);
        result.put("message", "Foreground Service Detenido.");
        call.resolve(result);
    }
}