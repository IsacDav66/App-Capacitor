// /scripts/publish.js

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');
const { Pool } = require('pg'); // <-- NUEVA IMPORTACIÓN
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') }); // <-- CARGAR .ENV DEL SERVER

// --- CONFIGURACIÓN DE RUTAS ---
const buildGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
const versionJsonPath = path.join(__dirname, '..', 'server', 'public', 'updates', 'version.json');
const apkSourcePath = path.join(__dirname, '..', 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const apkDestPath = path.join(__dirname, '..', 'server', 'public', 'updates', 'app-release.apk');
const androidDir = path.join(__dirname, '..', 'android');

// --- COLORES PARA LA CONSOLA ---
const colors = {
    reset: "\x1b[0m", green: "\x1b[32m", yellow: "\x1b[33m", cyan: "\x1b[36m", red: "\x1b[31m"
};

// --- FUNCIÓN PARA EJECUTAR COMANDOS ---
function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        console.log(colors.yellow, `\n> Executing: ${command} ${args.join(' ')}`, colors.reset);
        const child = spawn(command, args, { stdio: 'inherit', shell: true, ...options });
        child.on('close', code => code === 0 ? resolve() : reject(new Error(`Exit code ${code}`)));
        child.on('error', err => reject(err));
    });
}

function askQuestion(query, rl) {
    return new Promise(resolve => rl.question(query, resolve));
}

// --- SCRIPT PRINCIPAL ---
async function publish() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    
    try {
        console.log(colors.cyan, '--- Iniciando Proceso de Publicación Automática ---', colors.reset);

        // 1. LEER VERSIONES ACTUALES
        const buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');
        const versionCodeMatch = buildGradleContent.match(/versionCode\s+(\d+)/);
        const versionNameMatch = buildGradleContent.match(/versionName\s+"([^"]+)"/);
        
        if (!versionCodeMatch || !versionNameMatch) throw new Error('No se encontró versión en build.gradle');

        const currentVersionCode = parseInt(versionCodeMatch[1]);
        const currentVersionName = versionNameMatch[1];
        
        console.log(`Versión Actual: ${currentVersionName} (${currentVersionCode})`);
        
        // 2. CALCULAR NUEVAS VERSIONES Y PEDIR DATOS
        const newVersionCode = currentVersionCode + 1;
        const newVersionName = await askQuestion(`Nuevo nombre de versión (Sugerido: ${currentVersionName.split('.').slice(0,-1).join('.')}.${parseInt(currentVersionName.split('.').pop())+1}): `, rl);
        const releaseNotes = await askQuestion('Notas de la versión (usa \\n para saltos): ', rl);
        
        const confirmation = await askQuestion(`\n¿Publicar v${newVersionName} (${newVersionCode})? (y/n): `, rl);
        if (confirmation.toLowerCase() !== 'y') return console.log(colors.red, 'Cancelado.', colors.reset);

        // 3. ACTUALIZAR ARCHIVOS LOCALES
        console.log('\nActualizando configuraciones locales...');
        let updatedGradle = buildGradleContent.replace(/versionCode\s+\d+/, `versionCode ${newVersionCode}`);
        updatedGradle = updatedGradle.replace(/versionName\s+"[^"]+"/, `versionName "${newVersionName}"`);
        fs.writeFileSync(buildGradlePath, updatedGradle, 'utf8');
        
        const versionJson = { versionCode: newVersionCode, versionName: newVersionName, notes: releaseNotes.replace(/\\n/g, '\n') };
        fs.writeFileSync(versionJsonPath, JSON.stringify(versionJson, null, 2), 'utf8');

        // 4. COMPILAR APK
        const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
        await runCommand('npm', ['run', 'build:css']);
        await runCommand('npm', ['run', 'build:overlay']);
        await runCommand('npx', ['cap', 'sync', 'android']);
        await runCommand(gradlew, ['clean', 'assembleRelease'], { cwd: androidDir });
        
        // 5. MOVER APK
        console.log(colors.yellow, '\nMoviendo APK al servidor...', colors.reset);
        if (!fs.existsSync(path.dirname(apkDestPath))) fs.mkdirSync(path.dirname(apkDestPath), { recursive: true });
        fs.renameSync(apkSourcePath, apkDestPath);

        // 6. REGISTRAR EN BASE DE DATOS (PARA DISPARAR NOTIFICACIONES)
        console.log(colors.yellow, 'Registrando en Base de Datos para notificar a los usuarios...', colors.reset);
        
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const dbQuery = `
            INSERT INTO app_versions (version_name, version_code, release_notes, notified)
            VALUES ($1, $2, $3, FALSE);
        `;
        await pool.query(dbQuery, [newVersionName, newVersionCode, releaseNotes.replace(/\\n/g, '\n')]);
        await pool.end();

        console.log(colors.green, '\n--- ¡PUBLICACIÓN EXITOSA! ---', colors.reset);
        console.log('El servidor detectará la nueva versión y enviará los Pushes en breve.');

    } catch (error) {
        console.error(colors.red, '\n--- ❌ ERROR ---', colors.reset);
        console.error(error);
    } finally {
        rl.close();
    }
}

publish();