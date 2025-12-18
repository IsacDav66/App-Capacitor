// /js/modules/ui/appDetector.js (Versión Final y Simplificada)

let socket = null;

function isAppValid(packageName) {
    if (!packageName) return false;
    const lowerCasePackage = packageName.toLowerCase();
    const blockList = ["launcher", "systemui", "android", "inputmethod", "qualcomm", "google", "omletwebfinal"];
    return !blockList.some(keyword => lowerCasePackage.includes(keyword));
}

export function initializeNativeAppDetectionListener(socketInstance) {
    if (!window.Capacitor || !socketInstance) return;
    socket = socketInstance;
    console.log("🟢 APP DETECTOR: Inicializando listener para eventos nativos.");

    window.addEventListener('appStatusChanged', async (event) => {
        const eventData = event.detail;
        
        // --- ¡AÑADE ESTE LOG! ---
        console.log("🟢 APP DETECTOR (app.js): Evento 'appStatusChanged' recibido:", eventData);
        
        if (!eventData || !eventData.packageName) return;
        
        const { packageName, appName } = eventData;

        if (!isAppValid(packageName)) {
            socket.emit('update_current_app', null);
            return;
        }
        
        // Simplemente reenviamos los datos que nos dio el lado nativo.
        // El backend se encargará de buscar en la BD.
        socket.emit('update_current_app', {
            name: appName,
            package: packageName
        });
    });
}