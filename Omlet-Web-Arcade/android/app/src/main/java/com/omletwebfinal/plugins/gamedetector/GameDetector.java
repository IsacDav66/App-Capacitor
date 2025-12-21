// /android/app/src/main/java/com/omletwebfinal/plugins/gamedetector/GameDetector.java
package com.omletwebfinal.plugins.gamedetector;

import android.app.AppOpsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "GameDetector")
public class GameDetector extends Plugin {

    private boolean hasUsageStatsPermission() {
        AppOpsManager appOps = (AppOpsManager) getContext().getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), getContext().getPackageName());
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    @PluginMethod
    public void setAuthToken(final PluginCall call) {
        String token = call.getString("token");
        if (token == null) {
            call.reject("No se proporcionó ningún token.");
            return;
        }
        SharedPreferences sharedPref = getContext().getSharedPreferences("OMLET_APP_PREFS", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPref.edit();
        editor.putString("authToken", token);
        editor.apply();
        Log.d("GameDetector", "Token de autenticación guardado en SharedPreferences.");
        call.resolve();
    }

    @PluginMethod()
    public void startFloatingOverlay(final PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(getContext())) {
            call.reject("Permission denied to draw over other apps.");
            return;
        }
        if (!hasUsageStatsPermission()) {
            call.reject("Usage Stats permission is required.");
            return;
        }

        Log.d("GameDetector", "Permisos concedidos. Iniciando servicio.");
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            Intent serviceIntent = new Intent(getContext(), OverlayService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }
        }, 250);

        call.resolve(new JSObject().put("success", true).put("message", "Servicio de superposición iniciado."));
    }
     
    @PluginMethod()
    public void requestUsageStatsPermission(final PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        getActivity().startActivity(intent);
        call.resolve();
    }
    
    @PluginMethod()
    public void requestOverlayPermission(final PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getContext().getPackageName()));
            getActivity().startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod()
    public void stopFloatingOverlay(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), OverlayService.class);
        getContext().stopService(serviceIntent);
        call.resolve(new JSObject().put("success", true).put("message", "Servicio de superposición detenido."));
    }

    @PluginMethod
    public void syncThemeToNative(final PluginCall call) {
        JSObject theme = call.getObject("theme");
        if (theme == null) {
            call.reject("El objeto 'theme' es nulo.");
            return;
        }

        SharedPreferences sharedPref = getContext().getSharedPreferences("OMLET_APP_PREFS", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPref.edit();
        editor.putString("lastKnownTheme", theme.toString());
        editor.apply();

        Intent intent = new Intent("com.omletwebfinal.THEME_UPDATED");
        intent.putExtra("themeJson", theme.toString());
        LocalBroadcastManager.getInstance(getContext()).sendBroadcast(intent);
        
        Log.d("GameDetector", "Tema guardado y broadcast LOCAL enviado.");
        call.resolve();
    }
}