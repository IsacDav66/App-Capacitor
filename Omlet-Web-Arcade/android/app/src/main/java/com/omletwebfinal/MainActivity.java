package com.omletwebfinal;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import java.util.ArrayList;
import android.os.Bundle;

// Importar el plugin GameDetector
import com.omletwebfinal.plugins.gamedetector.GameDetector;
// ¡AÑADE LA IMPORTACIÓN DE TU NUEVO PLUGIN!
import com.omletwebfinal.plugins.navigationbar.NavigationBarPlugin;

public class MainActivity extends BridgeActivity {

    public MainActivity() {
        // Ejecuta el registro explícito de los plugins
        registerPlugin(GameDetector.class);
        // ¡AÑADE EL REGISTRO DE TU NUEVO PLUGIN!
        registerPlugin(NavigationBarPlugin.class);
    }

   @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Recuerda mantener este método vacío de cambios de color.
    }
}