package com.omletwebfinal.plugins.updater;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.util.Log;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;

@CapacitorPlugin(name = "AppUpdater")
public class AppUpdater extends Plugin {

    private static final String TAG = "AppUpdaterPlugin";
    private long downloadID;
    private PluginCall savedCall;
    private BroadcastReceiver onDownloadComplete;

    @PluginMethod
    public void getAppVersion(PluginCall call) {
        try {
            PackageInfo pInfo = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            JSObject ret = new JSObject();
            ret.put("versionName", pInfo.versionName);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                ret.put("versionCode", pInfo.getLongVersionCode());
            } else {
                ret.put("versionCode", pInfo.versionCode);
            }
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("No se pudo obtener la versión de la app.", e);
        }
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
            String url = call.getString("url");
            if (url == null || url.isEmpty()) {
                call.reject("Se requiere una URL de descarga.");
                return;
            }
            
            // Se elimina el archivo antiguo si existe para forzar una nueva descarga.
            File apkFile = new File(getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "app-release.apk");
            if (apkFile.exists()) {
                if (apkFile.delete()) {
                    Log.d(TAG, "APK antiguo eliminado con éxito.");
                }
            }

            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setDescription("Descargando actualización de Omlet Web Arcade...");
            request.setTitle("Actualización");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED); // Muestra la notificación del sistema
            request.setDestinationInExternalFilesDir(getContext(), Environment.DIRECTORY_DOWNLOADS, "app-release.apk");
            
            DownloadManager downloadManager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
            long downloadID = downloadManager.enqueue(request);

            Log.d(TAG, "Descarga de APK iniciada con ID: " + downloadID);
            
            // Respondemos al JS inmediatamente para que sepa que la descarga ha comenzado.
            call.resolve(new JSObject().put("value", "Download started with ID: " + downloadID));
    }
    

    private void installApk(Context context) {
        File apkFile = new File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "app-release.apk");
        if (apkFile.exists()) {
            Uri apkUri = FileProvider.getUriForFile(context, context.getPackageName() + ".provider", apkFile);
            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Log.d(TAG, "Iniciando intent de instalación para la URI: " + apkUri.toString());
            context.startActivity(installIntent);
        } else {
            Log.e(TAG, "Error crítico: El archivo APK no fue encontrado después de la descarga.");
            if(savedCall != null) {
                savedCall.reject("El archivo APK no fue encontrado después de la descarga.");
                savedCall = null;
            }
        }
    }
}