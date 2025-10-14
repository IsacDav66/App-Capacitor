package com.omletwebfinal;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin; // Necesario para la lista
import java.util.ArrayList; // Necesario para la lista
import android.os.Bundle; // Necesario para el Bundle

// Importar el plugin
import com.omletwebfinal.plugins.gamedetector.GameDetector;

public class MainActivity extends BridgeActivity {

    // REGISTRO USANDO EL CONSTRUCTOR (El enfoque más estable para el registro manual)
    public MainActivity() {
        // Ejecuta el registro explícito del plugin moderno
        registerPlugin(GameDetector.class);
    }

    // Dejamos el onCreate vacío para evitar que el compilador se queje de la firma.
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // El registro está en el constructor (arriba).
    }
}