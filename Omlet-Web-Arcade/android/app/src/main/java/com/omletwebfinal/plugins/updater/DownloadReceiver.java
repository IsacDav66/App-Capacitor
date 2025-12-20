package com.omletwebfinal.plugins.updater;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
import android.util.Log;

import androidx.core.content.FileProvider;

import java.io.File;

public class DownloadReceiver extends BroadcastReceiver {

    private static final String TAG = "AppUpdateReceiver"; // TAG ÚNICO PARA FILTRAR

    @Override
    public void onReceive(Context context, Intent intent) {
        // ==========================================================
        // === ¡ESTE ES EL LOG MÁS IMPORTANTE! ===
        // ==========================================================
        Log.e(TAG, "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        Log.e(TAG, "!!! DOWNLOAD RECEIVER HA SIDO ACTIVADO !!!");
        Log.e(TAG, "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        
        String action = intent.getAction();

        if (DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(action)) {
            long downloadId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
            Log.d(TAG, "Descarga completada. ID: " + downloadId);

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
                Log.e(TAG, "Error: El archivo APK no fue encontrado después de la descarga.");
            }
        }
    }
}