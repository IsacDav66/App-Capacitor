package com.omletwebfinal.plugins.gamedetector;

import android.annotation.SuppressLint;
import android.app.ActivityManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.util.Log;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;
import androidx.core.app.NotificationCompat;
import com.omletwebfinal.R;

import java.util.List;
import java.util.SortedMap;
import java.util.TreeMap;

public class OverlayService extends Service {
    private static final String CHANNEL_ID = "OverlayServiceChannel";
    private static final String TAG = "GameDetectorService";

    private WindowManager windowManager;
    private View bubbleView;
    private View windowView;
    private View dismissView;

    private WindowManager.LayoutParams bubbleParams;
    private boolean isWindowOpen = false;
    private boolean isBubbleOverDismiss = false;

    private final Handler handler = new Handler();
    private Runnable appCheckRunnable;
    private TextView gameNameTextView;

    private String currentSurfaceColor = "#1a1a1a";
    private String currentTextColor = "#FFFFFF";
    private String currentTextSecondaryColor = "#AAAAAA";

    private final BroadcastReceiver themeUpdateReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if ("com.omletwebfinal.THEME_UPDATED".equals(intent.getAction())) {
                currentSurfaceColor = intent.getStringExtra("surfaceColor");
                currentTextColor = intent.getStringExtra("textColor");
                currentTextSecondaryColor = intent.getStringExtra("textSecondaryColor");
                if (isWindowOpen && windowView != null) {
                    updateWindowTheme();
                }
            }
        }
    };

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        createNotificationChannel();
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Omlet Web Arcade Activo")
                .setContentText("Burbuja flotante activa.")
                .setSmallIcon(R.mipmap.ic_launcher_round)
                .build();
        startForeground(1, notification);

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        showDismissView();
        showBubbleView();

        // --- CORRECCIÓN DEFINITIVA PARA EL FLAG DE EXPORTACIÓN ---
        IntentFilter filter = new IntentFilter("com.omletwebfinal.THEME_UPDATED");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(themeUpdateReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(themeUpdateReceiver, filter);
        }
        // --- FIN DE LA CORRECCIÓN ---

        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        unregisterReceiver(themeUpdateReceiver);
        if (appCheckRunnable != null) handler.removeCallbacks(appCheckRunnable);
        if (bubbleView != null && bubbleView.isAttachedToWindow()) windowManager.removeView(bubbleView);
        if (windowView != null && windowView.isAttachedToWindow()) windowManager.removeView(windowView);
        if (dismissView != null && dismissView.isAttachedToWindow()) windowManager.removeView(dismissView);
        stopForeground(true);
    }

    private void showBubbleView() {
        bubbleView = LayoutInflater.from(this).inflate(R.layout.floating_bubble, null);
        int layoutType = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : WindowManager.LayoutParams.TYPE_PHONE;
        bubbleParams = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT,
                layoutType, WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE, PixelFormat.TRANSLUCENT
        );
        bubbleParams.gravity = Gravity.TOP | Gravity.START;
        bubbleParams.x = 20;
        bubbleParams.y = 200;

        bubbleView.setOnTouchListener(new View.OnTouchListener() {
            private float initialX, initialY, initialTouchX, initialTouchY;
            private long startClickTime;
            private static final int MAX_CLICK_DURATION = 200;
            private static final int MAX_CLICK_DISTANCE = 15;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = bubbleParams.x;
                        initialY = bubbleParams.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        startClickTime = System.currentTimeMillis();
                        showDismissViewWithAnimation(true);
                        return true;
                    case MotionEvent.ACTION_UP:
                        showDismissViewWithAnimation(false);
                        if (isBubbleOverDismiss) {
                            stopSelf();
                            return true;
                        }
                        long clickDuration = System.currentTimeMillis() - startClickTime;
                        float dX = event.getRawX() - initialTouchX;
                        float dY = event.getRawY() - initialTouchY;
                        if (clickDuration < MAX_CLICK_DURATION && Math.hypot(dX, dY) < MAX_CLICK_DISTANCE) {
                            v.performClick();
                        }
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        bubbleParams.x = (int) (initialX + (event.getRawX() - initialTouchX));
                        bubbleParams.y = (int) (initialY + (event.getRawY() - initialTouchY));
                        windowManager.updateViewLayout(bubbleView, bubbleParams);
                        checkIfBubbleIsOverDismiss();
                        return true;
                }
                return false;
            }
        });

        bubbleView.setOnClickListener(v -> {
            if (!isWindowOpen) {
                showFloatingWindow();
            }
        });

        windowManager.addView(bubbleView, bubbleParams);
    }

    private void showFloatingWindow() {
        isWindowOpen = true;
        windowView = LayoutInflater.from(this).inflate(R.layout.activity_floating_window, null);
        int layoutType = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : WindowManager.LayoutParams.TYPE_PHONE;

        final WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT,
                layoutType, WindowManager.LayoutParams.FLAG_DIM_BEHIND, PixelFormat.TRANSLUCENT
        );
        params.dimAmount = 0.6f;
        windowManager.addView(windowView, params);
        bubbleView.setVisibility(View.GONE);

        updateWindowTheme();

        windowView.setFocusableInTouchMode(true);
        windowView.requestFocus();
        windowView.setOnKeyListener((v, keyCode, event) -> {
            if (keyCode == KeyEvent.KEYCODE_BACK && event.getAction() == KeyEvent.ACTION_UP) {
                closeFloatingWindow();
                return true;
            }
            return false;
        });

        startAppDetection();
    }

    private void closeFloatingWindow() {
        if (isWindowOpen && windowView != null) {
            stopAppDetection();
            windowManager.removeView(windowView);
            windowView = null;
            isWindowOpen = false;
            bubbleView.setVisibility(View.VISIBLE);
        }
    }

    private void updateWindowTheme() {
        if (windowView == null) return;

        View backgroundView = windowView.findViewById(R.id.floating_content_background);
        TextView titleText = windowView.findViewById(R.id.title_textview);
        gameNameTextView = windowView.findViewById(R.id.game_name_textview); // Asegúrate de que gameNameTextView se asigne aquí
        
        try {
            if (backgroundView != null && backgroundView.getBackground() != null) {
                android.graphics.drawable.Drawable bgDrawable = backgroundView.getBackground().mutate();
                if (currentSurfaceColor != null && !currentSurfaceColor.isEmpty()) {
                    bgDrawable.setColorFilter(Color.parseColor(currentSurfaceColor), android.graphics.PorterDuff.Mode.SRC_IN);
                }
            }
            
            // --- INICIO DE LA CORRECCIÓN ---
            // Ahora, AMBOS textos usan el color de texto principal, a menos que uno sea nulo.
            if (titleText != null && currentTextColor != null && !currentTextColor.isEmpty()) {
                titleText.setTextColor(Color.parseColor(currentTextColor));
            }
            if (gameNameTextView != null && currentTextColor != null && !currentTextColor.isEmpty()) {
                gameNameTextView.setTextColor(Color.parseColor(currentTextColor));
            }
            // --- FIN DE LA CORRECCIÓN ---

        } catch (IllegalArgumentException e) {
            Log.e(TAG, "Error al parsear el color del tema: " + e.getMessage());
        }
    }




    private void showDismissView() {
        dismissView = LayoutInflater.from(this).inflate(R.layout.floating_dismiss_view, null);
        int layoutType = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : WindowManager.LayoutParams.TYPE_PHONE;
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT,
                layoutType, WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE, PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        params.y = 50;
        dismissView.setVisibility(View.GONE);
        windowManager.addView(dismissView, params);
    }

    private void showDismissViewWithAnimation(boolean show) {
        if (dismissView != null) {
            dismissView.setVisibility(show ? View.VISIBLE : View.GONE);
            dismissView.animate().scaleX(show ? 1.0f : 0.0f).scaleY(show ? 1.0f : 0.0f).setDuration(200).start();
        }
    }

    private void checkIfBubbleIsOverDismiss() {
        if (bubbleView == null || dismissView == null || dismissView.getVisibility() == View.GONE) return;
        int[] bubbleLocation = new int[2];
        bubbleView.getLocationOnScreen(bubbleLocation);
        Rect bubbleRect = new Rect(bubbleLocation[0], bubbleLocation[1], bubbleLocation[0] + bubbleView.getWidth(), bubbleLocation[1] + bubbleView.getHeight());
        int[] dismissLocation = new int[2];
        dismissView.getLocationOnScreen(dismissLocation);
        Rect dismissRect = new Rect(dismissLocation[0], dismissLocation[1], dismissLocation[0] + dismissView.getWidth(), dismissLocation[1] + dismissView.getHeight());
        if (Rect.intersects(bubbleRect, dismissRect)) {
            if (!isBubbleOverDismiss) {
                isBubbleOverDismiss = true;
                dismissView.animate().scaleX(1.3f).scaleY(1.3f).setDuration(150).start();
            }
        } else {
            if (isBubbleOverDismiss) {
                isBubbleOverDismiss = false;
                dismissView.animate().scaleX(1.0f).scaleY(1.0f).setDuration(150).start();
            }
        }
    }

    private void startAppDetection() {
        appCheckRunnable = new Runnable() {
            @Override
            public void run() {
                String foregroundApp = getForegroundAppPackage(getApplicationContext());
                String appName = getApplicationName(getApplicationContext(), foregroundApp);
                if (gameNameTextView != null) {
                    if (foregroundApp != null && !foregroundApp.equals(getPackageName())) {
                        gameNameTextView.setText(appName);
                    } else {
                        gameNameTextView.setText("Ningún juego detectado");
                    }
                }
                handler.postDelayed(this, 1000);
            }
        };
        handler.post(appCheckRunnable);
    }

    private void stopAppDetection() {
        handler.removeCallbacks(appCheckRunnable);
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
        if (pkg == null && Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
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
        if (packageName == null) return "N/A";
        try {
            PackageManager pm = context.getPackageManager();
            return pm.getApplicationLabel(pm.getApplicationInfo(packageName, 0)).toString();
        } catch (PackageManager.NameNotFoundException e) {
            return packageName;
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Servicio de Superposición",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }
}