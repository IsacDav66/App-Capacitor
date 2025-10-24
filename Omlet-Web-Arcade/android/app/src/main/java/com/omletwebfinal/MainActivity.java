package com.omletwebfinal;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
// ¡YA NO NECESITAMOS JSObject!

// Importaciones para tus plugins Java personalizados
import com.omletwebfinal.plugins.gamedetector.GameDetector;
import com.omletwebfinal.plugins.navigationbar.NavigationBarPlugin;

public class MainActivity extends BridgeActivity {

    public static final String TAG = "MainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "🟢 Actividad Principal (onCreate) iniciada.");
        // Ya no necesitamos llamar a handleIntent aquí, el plugin lo hace por nosotros.
    }

    // El constructor se mantiene igual
    public MainActivity() {
        registerPlugin(GameDetector.class);
        registerPlugin(NavigationBarPlugin.class);
    }

    // ¡ELIMINAMOS POR COMPLETO EL MÉTODO `handleIntent` Y `onNewIntent`!
    // El plugin @capacitor/app se encarga de esto automáticamente
    // cuando está configurado correctamente.
}