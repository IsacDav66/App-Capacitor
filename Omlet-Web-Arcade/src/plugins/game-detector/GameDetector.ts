import { registerPlugin } from '@capacitor/core';

// 1. Define la interfaz de lo que el plugin nativo puede hacer
export interface GameDetectorPlugin {
  getForegroundApp(): Promise<{ packageName: string, appName: string }>;
  startFloatingOverlay(): Promise<{ success: boolean }>;
  stopFloatingOverlay(): Promise<{ success: boolean }>;
}

// 2. Registra el plugin para que Capacitor lo reconozca
const GameDetector = registerPlugin<GameDetectorPlugin>('GameDetector');

// 3. Exporta para que el resto de tu JS pueda usarlo
export default GameDetector; 