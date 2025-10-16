package com.omletwebfinal.plugins.navigationbar;

import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.Window;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NavigationBar")
public class NavigationBarPlugin extends Plugin {

    @PluginMethod
    public void setColor(PluginCall call) {
        String colorStr = call.getString("color");
        if (colorStr == null) {
            call.reject("Debes proporcionar un color.");
            return;
        }

        // Esta lógica debe ejecutarse en el hilo principal de la UI
        getActivity().runOnUiThread(() -> {
            try {
                Window window = getActivity().getWindow();
                // La misma línea que ya tenías, pero ahora con el color de JS
                window.setNavigationBarColor(Color.parseColor(colorStr));

                // Lógica para los botones claros/oscuros
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    Boolean darkButtons = call.getBoolean("darkButtons", false);
                    View decorView = window.getDecorView();
                    int flags = decorView.getSystemUiVisibility();
                    if (darkButtons) {
                        flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    } else {
                        flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    }
                    decorView.setSystemUiVisibility(flags);
                }

                call.resolve();
            } catch (IllegalArgumentException e) {
                call.reject("Color string inválido.");
            }
        });
    }
}