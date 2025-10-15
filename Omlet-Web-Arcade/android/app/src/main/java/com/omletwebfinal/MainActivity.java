package com.omletwebfinal;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import java.util.ArrayList;
import android.os.Bundle;

// =========================================================
// === INICIO DE LAS MODIFICACIONES ===
// =========================================================
import android.graphics.Color;
import android.view.View;
import android.view.Window;
// =========================================================
// === FIN DE LAS MODIFICACIONES ===
// =========================================================

// Importar el plugin
import com.omletwebfinal.plugins.gamedetector.GameDetector;

public class MainActivity extends BridgeActivity {

    // REGISTRO USANDO EL CONSTRUCTOR (El enfoque más estable para el registro manual)
    public MainActivity() {
        // Ejecuta el registro explícito del plugin moderno
        registerPlugin(GameDetector.class);
    }

   @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window window = getWindow();

        // === COLOR DE BARRAS ===
        window.setNavigationBarColor(Color.parseColor("#1a1a1a"));
        window.setStatusBarColor(Color.parseColor("#1a1a1a")); // <-- Añade esta línea

        // === NUEVO: Desactiva el modo inmersivo para que no tape el contenido ===
        // Esto evita que tu app quede detrás de la barra de estado
        window.getDecorView().setSystemUiVisibility(0);
    }

}
