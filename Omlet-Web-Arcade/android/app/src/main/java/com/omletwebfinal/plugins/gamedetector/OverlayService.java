package com.omletwebfinal.plugins.gamedetector;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.app.NotificationCompat;

import com.omletwebfinal.R;

import java.util.List;
import java.util.SortedMap;
import java.util.TreeMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import android.app.ActivityManager;

public class OverlayService extends Service {
    private static final String CHANNEL_ID = "OverlayServiceChannel";
    private static final String TAG = "GameDetectorService";

    private ScheduledExecutorService scheduler;
    private WindowManager windowManager;
    private View floatingView;

    private final Handler handler = new Handler();

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // 1. Crear canal y notificación
        createNotificationChannel();
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Omlet Web Arcade Activo")
                .setContentText("Detectando aplicación en primer plano...")
                .setSmallIcon(R.mipmap.ic_launcher)
                .build();
        startForeground(1, notification);

        // 2. Mostrar overlay flotante
        showFloatingWindow();

        // 3. Iniciar la detección periódica
        scheduler = Executors.newSingleThreadScheduledExecutor();
        scheduler.scheduleAtFixedRate(() -> checkForegroundApp(), 0, 1, TimeUnit.SECONDS);

        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (scheduler != null) scheduler.shutdownNow();
        removeFloatingWindow();
        stopForeground(true);
        Log.d(TAG, "Foreground Service Detenido.");
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // ====================================================================
    // 💡 MÉTODO PARA MOSTRAR EL OVERLAY FLOTANTE
    // ====================================================================
    private TextView textView; // <- Añadir esto arriba de showFloatingWindow()
    private void showFloatingWindow() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!android.provider.Settings.canDrawOverlays(this)) {
                Toast.makeText(this, "Permiso de superposición requerido.", Toast.LENGTH_LONG).show();
                Intent intent = new Intent(android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
                stopSelf();
                return;
            }
        }

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);

        // 1️⃣ Crear layout flotante
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.HORIZONTAL);
        layout.setPadding(25, 25, 25, 25);
        layout.setBackgroundColor(0xAA000000);

        // 2️⃣ Crear el texto dinámico
        textView = new TextView(this);
        textView.setText("⏳ Detectando app...");
        textView.setTextColor(0xFFFFFFFF);
        textView.setTextSize(14f);

        layout.addView(textView);

        // 3️⃣ Configurar posición de la burbuja
        int layoutType = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                layoutType,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                        | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
                PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.TOP | Gravity.END;
        params.x = 50;
        params.y = 150;

        // 4️⃣ Mover la burbuja
        layout.setOnTouchListener(new View.OnTouchListener() {
            private float initialX, initialY;
            private float initialTouchX, initialTouchY;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = params.x;
                        initialY = params.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        params.x = (int) (initialX - (event.getRawX() - initialTouchX));
                        params.y = (int) (initialY + (event.getRawY() - initialTouchY));
                        windowManager.updateViewLayout(layout, params);
                        return true;
                }
                return false;
            }
        });

        // 5️⃣ Mostrar overlay
        try {
            windowManager.addView(layout, params);
            floatingView = layout;
            Log.d(TAG, "Overlay flotante mostrado correctamente.");
        } catch (Exception e) {
            Log.e(TAG, "Error al mostrar overlay: " + e.getMessage());
        }
    }

    private void removeFloatingWindow() {
        if (windowManager != null && floatingView != null) {
            try {
                windowManager.removeView(floatingView);
                floatingView = null;
            } catch (Exception e) {
                Log.e(TAG, "Error al remover overlay: " + e.getMessage());
            }
        }
    }

    // ====================================================================
    // DETECCIÓN DE APP EN PRIMER PLANO
    // ====================================================================
    private void checkForegroundApp() {
        try {
            String foregroundAppPackage = getForegroundAppPackage(this);
            if (foregroundAppPackage != null && !foregroundAppPackage.equals(getPackageName())) {
                String appName = getApplicationName(this, foregroundAppPackage);
                Log.d(TAG, "App en primer plano: " + appName);

                // ⚡ Actualiza el texto del overlay en el hilo principal
                handler.post(() -> {
                    if (textView != null) {
                        textView.setText("📱 " + appName);
                    }
                });

            } else {
                handler.post(() -> {
                    if (textView != null) {
                        textView.setText("🏠 Launcher/Sistema");
                    }
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error en detección: " + e.getMessage());
        }
    }

    private String getForegroundAppPackage(Context context) {
        String pkg = null;
        UsageStatsManager usm = (UsageStatsManager) context.getSystemService(Context.USAGE_STATS_SERVICE);
        if (usm != null) {
            long time = System.currentTimeMillis();
            List<UsageStats> appList = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, time - 5000, time);
            if (appList != null && !appList.isEmpty()) {
                SortedMap<Long, UsageStats> sortedMap = new TreeMap<>();
                for (UsageStats usageStats : appList) {
                    sortedMap.put(usageStats.getLastTimeUsed(), usageStats);
                }
                if (!sortedMap.isEmpty()) {
                    pkg = sortedMap.get(sortedMap.lastKey()).getPackageName();
                }
            }
        }

        if (pkg == null) {
            ActivityManager am = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
            if (am != null) {
                List<ActivityManager.RunningTaskInfo> taskInfo = am.getRunningTasks(1);
                if (taskInfo != null && !taskInfo.isEmpty() && taskInfo.get(0).topActivity != null) {
                    pkg = taskInfo.get(0).topActivity.getPackageName();
                }
            }
        }

        return pkg;
    }

    private String getApplicationName(Context context, String packageName) {
        try {
            android.content.pm.ApplicationInfo ai = context.getPackageManager().getApplicationInfo(packageName, 0);
            return (String) context.getPackageManager().getApplicationLabel(ai);
        } catch (PackageManager.NameNotFoundException e) {
            return packageName;
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Servicio de Detección en Primer Plano",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(serviceChannel);
        }
    }
}
