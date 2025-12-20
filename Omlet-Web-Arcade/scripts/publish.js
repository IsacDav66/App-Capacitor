// /scripts/publish.js

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

// --- CONFIGURACIÓN DE RUTAS ---
const buildGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
const versionJsonPath = path.join(__dirname, '..', 'server', 'public', 'updates', 'version.json');
const apkSourcePath = path.join(__dirname, '..', 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const apkDestPath = path.join(__dirname, '..', 'server', 'public', 'updates', 'app-release.apk');
const androidDir = path.join(__dirname, '..', 'android');

// --- COLORES PARA LA CONSOLA ---
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    red: "\x1b[31m"
};

// --- FUNCIÓN PARA EJECUTAR COMANDOS ---
function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        console.log(colors.yellow, `\n> Executing: ${command} ${args.join(' ')}`, colors.reset);
        const child = spawn(command, args, { stdio: 'inherit', shell: true, ...options });
        child.on('close', code => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });
        child.on('error', err => reject(err));
    });
}

// --- FUNCIÓN PARA HACER PREGUNTAS AL USUARIO ---
function askQuestion(query, rl) {
    return new Promise(resolve => rl.question(query, resolve));
}

// --- SCRIPT PRINCIPAL ---
async function publish() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    
    try {
        console.log(colors.cyan, '--- Iniciando Proceso de Publicación de Nueva Versión ---', colors.reset);

        // 1. LEER VERSIONES ACTUALES
        const buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');
        const versionCodeMatch = buildGradleContent.match(/versionCode\s+(\d+)/);
        const versionNameMatch = buildGradleContent.match(/versionName\s+"([^"]+)"/);
        
        if (!versionCodeMatch || !versionNameMatch) {
            throw new Error('No se pudo encontrar versionCode o versionName en build.gradle');
        }

        const currentVersionCode = parseInt(versionCodeMatch[1]);
        const currentVersionName = versionNameMatch[1];
        
        console.log(`Versión Actual Detectada: ${currentVersionName} (Código: ${currentVersionCode})`);
        
        // 2. CALCULAR NUEVAS VERSIONES Y PEDIR DATOS
        const newVersionCode = currentVersionCode + 1;
        const newVersionName = await askQuestion(`Introduce el nuevo nombre de la versión (ej. ${currentVersionName.split('.').slice(0,-1).join('.')}.${parseInt(currentVersionName.split('.').pop())+1}): `, rl);
        const releaseNotes = await askQuestion('Introduce las notas de la versión (usa "\\n" para saltos de línea):\n', rl);
        
        console.log('\n--- Resumen de la Actualización ---');
        console.log(`Nuevo Código de Versión: ${colors.green}${newVersionCode}${colors.reset}`);
        console.log(`Nuevo Nombre de Versión: ${colors.green}${newVersionName}${colors.reset}`);
        console.log(`Notas:\n${colors.cyan}${releaseNotes.replace(/\\n/g, '\n')}${colors.reset}`);
        
        const confirmation = await askQuestion('\n¿Es todo correcto? (y/n): ', rl);
        if (confirmation.toLowerCase() !== 'y') {
            console.log(colors.red, 'Publicación cancelada.', colors.reset);
            return;
        }

        // 3. ACTUALIZAR ARCHIVOS DE CONFIGURACIÓN
        console.log('\nActualizando archivos de configuración...');
        let updatedGradle = buildGradleContent.replace(/versionCode\s+\d+/, `versionCode ${newVersionCode}`);
        updatedGradle = updatedGradle.replace(/versionName\s+"[^"]+"/, `versionName "${newVersionName}"`);
        fs.writeFileSync(buildGradlePath, updatedGradle, 'utf8');
        
        const versionJson = {
            versionCode: newVersionCode,
            versionName: newVersionName,
            notes: releaseNotes.replace(/\\n/g, '\n')
        };
        fs.writeFileSync(versionJsonPath, JSON.stringify(versionJson, null, 2), 'utf8');
        console.log(colors.green, '✓ Archivos actualizados.', colors.reset);

        // 4. EJECUTAR PROCESO DE COMPILACIÓN
        const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

        await runCommand('npm', ['run', 'build:css']);
        await runCommand('npm', ['run', 'build:overlay']);
        await runCommand('npx', ['cap', 'sync', 'android']);
        await runCommand(gradlew, ['clean', 'assembleRelease'], { cwd: androidDir });
        
        // 5. MOVER EL APK
        console.log(colors.yellow, '\nMoviendo APK a la carpeta de actualizaciones...', colors.reset);
        fs.renameSync(apkSourcePath, apkDestPath);
        console.log(colors.green, `✓ APK movido exitosamente a: ${apkDestPath}`, colors.reset);

        // 6. FINALIZAR
        console.log(colors.green, '\n--- ¡PROCESO DE PUBLICACIÓN COMPLETADO! ---', colors.reset);
        console.log('No olvides reiniciar tu servidor para que sirva la nueva versión.');

    } catch (error) {
        console.error(colors.red, '\n--- ❌ ERROR DURANTE LA PUBLICACIÓN ---', colors.reset);
        console.error(error);
    } finally {
        rl.close();
    }
}

publish();