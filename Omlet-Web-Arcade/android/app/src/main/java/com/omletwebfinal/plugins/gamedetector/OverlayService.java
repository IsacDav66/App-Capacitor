package com.omletwebfinal.plugins.gamedetector;

import android.annotation.SuppressLint;
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
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Rect;
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
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.Bridge;
import com.getcapacitor.JSObject;
import com.omletwebfinal.MainActivity;
import com.omletwebfinal.R;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.SortedMap;
import java.util.TreeMap;
import android.app.ActivityManager;
import android.util.TypedValue;

public class OverlayService extends Service {
    private static final String CHANNEL_ID = "OverlayServiceChannel";
    private static final String TAG = "GameDetectorService";

    // Variables de UI
    private WindowManager windowManager;
    private View bubbleView;
    private View floatingViewContainer;
    private WebView floatingWebView;
    private View dismissView;

    // Variables de estado
    private WindowManager.LayoutParams bubbleParams;
    private boolean isWindowOpen = false;
    private boolean isBubbleOverDismiss = false;
    private final Handler handler = new Handler();
    private Runnable appCheckRunnable;
    private JSObject lastReceivedTheme = null;

    // --- PUENTE DE COMUNICACIÓN A LA WEBVIEW PRINCIPAL ---
    private Bridge getBridge() {
        if (MainActivity.getInstance() != null) {
            return MainActivity.getInstance().getBridge();
        }
        return null;
    }
    
    // --- DEFINICIÓN DE LOS RECEIVERS ---
    private final BroadcastReceiver themeUpdateReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if ("com.omletwebfinal.THEME_UPDATED".equals(intent.getAction())) {
                JSObject themeData = new JSObject();
                themeData.put("bgColor", intent.getStringExtra("bgColor"));
                themeData.put("textColor", intent.getStringExtra("textColor"));
                themeData.put("secondaryTextColor", intent.getStringExtra("secondaryTextColor"));
                themeData.put("surfaceColor", intent.getStringExtra("surfaceColor"));
                themeData.put("accentColor", intent.getStringExtra("accentColor"));

                // --- ¡AÑADE ESTAS DOS LÍNEAS QUE FALTABAN! ---
                themeData.put("uiColor", intent.getStringExtra("uiColor"));
                themeData.put("borderColor", intent.getStringExtra("borderColor"));

                lastReceivedTheme = themeData;
                Log.d(TAG, "Tema actualizado y guardado en el servicio: " + themeData.toString());

                if (isWindowOpen && floatingWebView != null) {
                    applyThemeToWebView(lastReceivedTheme);
                }
            }
        }
    };

    private final BroadcastReceiver serviceCommandReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if ("com.omletwebfinal.SHOW_DEFINE_FORM".equals(intent.getAction())) {
                String packageName = intent.getStringExtra("packageName");
                if (isWindowOpen && floatingViewContainer != null && packageName != null) {
                    showDefineFormInWindow(packageName);
                }
            }
        }
    };

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        createNotificationChannel();
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Omlet Web Arcade Activo")
                .setContentText("Burbuja flotante activa.")
                .setSmallIcon(R.mipmap.ic_launcher_round).build();
        startForeground(1, notification);

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        showDismissView();
        showBubbleView();

        IntentFilter themeFilter = new IntentFilter("com.omletwebfinal.THEME_UPDATED");
        IntentFilter commandFilter = new IntentFilter("com.omletwebfinal.SHOW_DEFINE_FORM");
        ContextCompat.registerReceiver(this, themeUpdateReceiver, themeFilter, ContextCompat.RECEIVER_NOT_EXPORTED);
        ContextCompat.registerReceiver(this, serviceCommandReceiver, commandFilter, ContextCompat.RECEIVER_NOT_EXPORTED);
        
        startAppDetection();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        unregisterReceiver(themeUpdateReceiver);
        unregisterReceiver(serviceCommandReceiver);
        stopAppDetection();
        if (bubbleView != null && bubbleView.isAttachedToWindow()) windowManager.removeView(bubbleView);
        if (floatingViewContainer != null && floatingViewContainer.isAttachedToWindow()) windowManager.removeView(floatingViewContainer);
        if (dismissView != null && dismissView.isAttachedToWindow()) windowManager.removeView(dismissView);
        stopForeground(true);
    }
    
    private String readAssetFileAsString(Context context, String filePath) throws IOException {
        StringBuilder builder = new StringBuilder();
        try (InputStream is = context.getAssets().open(filePath);
             BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) { builder.append(line).append("\n"); }
        }
        return builder.toString();
    }

    private void showBubbleView() {
        bubbleView = LayoutInflater.from(this).inflate(R.layout.floating_bubble, null);

        // ==========================================================
        // === ¡AQUÍ ESTÁ LA SOLUCIÓN DEFINITIVA PARA EL TAMAÑO! ===
        // ==========================================================
        
        // 1. Define el tamaño deseado en unidades DP (density-independent pixels).
        //    Esto asegura que la burbuja se vea del mismo tamaño en diferentes densidades de pantalla.
        final int BUBBLE_SIZE_DP = 50; // <-- ¡CAMBIA ESTE VALOR AL TAMAÑO QUE QUIERAS!

        // 2. Convierte los DP a píxeles físicos.
        int bubbleSizePx = (int) TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            BUBBLE_SIZE_DP,
            getResources().getDisplayMetrics()
        );

        // 3. Establece el tamaño de la ventana explícitamente en píxeles.
        //    En lugar de WRAP_CONTENT, le damos un tamaño fijo.
        int layoutType = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : WindowManager.LayoutParams.TYPE_PHONE;

        bubbleParams = new WindowManager.LayoutParams(
                bubbleSizePx, // Ancho en píxeles
                bubbleSizePx, // Alto en píxeles
                layoutType,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
        );
        // ==========================================================

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
                        initialX = bubbleParams.x; initialY = bubbleParams.y;
                        initialTouchX = event.getRawX(); initialTouchY = event.getRawY();
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

    // --- ACTUALIZA LOS PARAMS DE LA VENTANA ---
    // Añadimos una variable a nivel de clase para los parámetros
    private WindowManager.LayoutParams floatingWindowParams;
    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    private void showFloatingWindow() {
        isWindowOpen = true;
        LayoutInflater inflater = (LayoutInflater) getSystemService(Context.LAYOUT_INFLATER_SERVICE);
        floatingViewContainer = inflater.inflate(R.layout.floating_webview_container, null);
        floatingWebView = floatingViewContainer.findViewById(R.id.floating_webview);

        WebSettings webSettings = floatingWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        floatingWebView.addJavascriptInterface(new WebAppInterface(this), "Android");
        floatingWebView.setBackgroundColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            floatingWebView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        } else {
            floatingWebView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
        }

        floatingWebView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(TAG, "WebView flotante finalizó la carga (onPageFinished).");
                if (lastReceivedTheme != null) {
                    Log.d(TAG, "-> Se encontró un tema guardado. Aplicando...");
                    applyThemeToWebView(lastReceivedTheme);
                } else {
                    Log.w(TAG, "-> No se encontró tema guardado. La ventana podría tener el tema por defecto.");
                }
            }
        });

        try {
            String htmlContent = readAssetFileAsString(this, "public/floating_content.html");
            String cssContent = readAssetFileAsString(this, "public/css/floating_styles.css");
            String jsContent = readAssetFileAsString(this, "public/js/floating_content.bundle.js");
            htmlContent = htmlContent.replace("<link href=\"./css/floating_styles.css\" rel=\"stylesheet\">", "<style>" + cssContent + "</style>");
            htmlContent = htmlContent.replace("<script src=\"./js/floating_content.js\" type=\"module\"></script>", "<script type=\"module\">" + jsContent + "</script>");
            floatingWebView.loadDataWithBaseURL("file:///android_asset/public/", htmlContent, "text/html", "UTF-8", null);
        } catch (IOException e) {
            Log.e(TAG, "Error crítico al leer archivos de assets", e);
            floatingWebView.loadData("<html><body><h1>Error al cargar la interfaz</h1></body></html>", "text/html", "UTF-8");
        }

        int layoutType = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : WindowManager.LayoutParams.TYPE_PHONE;

        // Usamos la variable de clase
        floatingWindowParams = new WindowManager.LayoutParams(
            (int) (getResources().getDisplayMetrics().widthPixels * 0.85),
            (int) (getResources().getDisplayMetrics().heightPixels * 0.75),
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE, // Inicia SIN foco
            PixelFormat.TRANSLUCENT);
        
        floatingWindowParams.dimAmount = 0.8f;
        floatingWindowParams.flags |= WindowManager.LayoutParams.FLAG_DIM_BEHIND;
        floatingWindowParams.gravity = Gravity.CENTER;

        windowManager.addView(floatingViewContainer, floatingWindowParams);
        bubbleView.setVisibility(View.GONE);

        floatingViewContainer.setFocusableInTouchMode(true);
        floatingViewContainer.requestFocus();
        floatingViewContainer.setOnKeyListener((v, keyCode, event) -> {
            if (keyCode == KeyEvent.KEYCODE_BACK && event.getAction() == KeyEvent.ACTION_UP) {
                closeFloatingWindow();
                return true;
            }
            return false;
        });
    }

    private void closeFloatingWindow() {
        if (isWindowOpen && floatingViewContainer != null) {
            windowManager.removeView(floatingViewContainer);
            floatingViewContainer = null;
            floatingWebView = null;
            isWindowOpen = false;
            bubbleView.setVisibility(View.VISIBLE);
        }
    }
    
    private void showDefineFormInWindow(String packageName) {
        if (floatingViewContainer == null) return;
        // La lógica para mostrar el formulario ahora se hace en JS. Aquí solo llamamos a una función JS.
        String script = "if (window.showRegistrationForm) { window.showRegistrationForm('" + packageName + "'); }";
        floatingWebView.post(() -> floatingWebView.evaluateJavascript(script, null));
        Log.d(TAG, "Script para mostrar formulario inyectado en la WebView flotante.");
    }

    private void applyThemeToWebView(JSObject theme) {
        if (theme == null || floatingWebView == null) return;
        String script = "if (window.applyThemeUpdate) { window.applyThemeUpdate(" + theme.toString() + "); }";
        floatingWebView.post(() -> floatingWebView.evaluateJavascript(script, null));
    }

    private void showDismissView() {
        dismissView = LayoutInflater.from(this).inflate(R.layout.floating_dismiss_view, null);
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT,
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE, PixelFormat.TRANSLUCENT);
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
        Rect bubbleRect = new Rect(bubbleParams.x, bubbleParams.y, bubbleParams.x + bubbleView.getWidth(), bubbleParams.y + bubbleView.getHeight());
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
        if (appCheckRunnable != null) return;
        appCheckRunnable = new Runnable() {
            private String lastAppPackage = null;
            @Override
            public void run() {
                String foregroundAppPackage = getForegroundAppPackage(getApplicationContext());
                String appName = getApplicationName(getApplicationContext(), foregroundAppPackage);

                if (foregroundAppPackage != null && !foregroundAppPackage.equals(lastAppPackage)) {
                    lastAppPackage = foregroundAppPackage;
                    Log.d(TAG, "Nueva app detectada: " + foregroundAppPackage);
                    MainActivity mainActivity = MainActivity.getInstance();
                    if (mainActivity != null) {
                        mainActivity.sendAppStatusToWebview(foregroundAppPackage, appName);
                    }
                }
                
                if (isWindowOpen && floatingWebView != null) {
                    JSObject data = new JSObject();
                    data.put("packageName", lastAppPackage);
                    data.put("appName", appName);
                    String script = "if (window.updateGameInfo) { window.updateGameInfo(" + data.toString() + "); }";
                    floatingWebView.post(() -> floatingWebView.evaluateJavascript(script, null));
                }
                
                handler.postDelayed(this, 3000);
            }
        };
        handler.post(appCheckRunnable);
    }
    
    private void stopAppDetection() {
        if (appCheckRunnable != null) {
            handler.removeCallbacks(appCheckRunnable);
            appCheckRunnable = null;
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
                for (UsageStats usageStats : appList) { sortedMap.put(usageStats.getLastTimeUsed(), usageStats); }
                if (!sortedMap.isEmpty()) { pkg = sortedMap.get(sortedMap.lastKey()).getPackageName(); }
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
                    CHANNEL_ID, "Servicio de Superposición", NotificationManager.IMPORTANCE_LOW);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) { manager.createNotificationChannel(serviceChannel); }
        }
    }

    public class WebAppInterface {
        Context mContext;
        WebAppInterface(Context c) { mContext = c; }

        @JavascriptInterface
        public void closeWindow() {
            new Handler(mContext.getMainLooper()).post(OverlayService.this::closeFloatingWindow);
        }

        @JavascriptInterface
        public void reopenWindow() {
            new Handler(mContext.getMainLooper()).post(() -> {
                closeFloatingWindow();
                new Handler().postDelayed(OverlayService.this::showFloatingWindow, 100); 
            });
        }

        @JavascriptInterface
        public String getAuthToken() {
            SharedPreferences sharedPref = mContext.getSharedPreferences("OMLET_APP_PREFS", Context.MODE_PRIVATE);
            String token = sharedPref.getString("authToken", "");
            return token;
        }
    
        @JavascriptInterface
        public void jsReady() {
            Log.d(TAG, "El JavaScript de la WebView flotante está listo.");
            if (appCheckRunnable != null) {
                handler.post(appCheckRunnable);
            }
        }

         // ==========================================================
        // === ¡NUEVOS MÉTODOS PARA GESTIONAR EL FOCO DEL TECLADO! ===
        // ==========================================================
        @JavascriptInterface
        public void requestWindowFocus() {
            new Handler(mContext.getMainLooper()).post(() -> {
                if (floatingViewContainer != null) {
                    // Quitamos el flag NOT_FOCUSABLE
                    floatingWindowParams.flags &= ~WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
                    windowManager.updateViewLayout(floatingViewContainer, floatingWindowParams);
                    Log.d(TAG, "Foco solicitado para la ventana flotante.");
                }
            });
        }

        @JavascriptInterface
        public void releaseWindowFocus() {
            new Handler(mContext.getMainLooper()).post(() -> {
                if (floatingViewContainer != null) {
                    // Volvemos a añadir el flag NOT_FOCUSABLE
                    floatingWindowParams.flags |= WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
                    windowManager.updateViewLayout(floatingViewContainer, floatingWindowParams);
                    Log.d(TAG, "Foco liberado de la ventana flotante.");
                }
            });
        }
    }
}