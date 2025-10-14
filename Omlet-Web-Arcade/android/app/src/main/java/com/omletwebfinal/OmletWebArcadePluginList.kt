package com.omletwebfinal

import com.getcapacitor.NativePlugin
import com.getcapacitor.Plugin
import com.omletwebfinal.plugins.gamedetector.GameDetector

// Esta clase es la lista de plugins que Capacitor busca automáticamente
// Solo contiene tu plugin GameDetector
class OmletWebArcadePluginList {
    val plugins: List<Class<out Plugin>> = listOf(
        GameDetector::class.java
    )
}