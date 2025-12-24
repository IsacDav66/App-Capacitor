import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMExpressionPresetName } from '@pixiv/three-vrm';

// --- CONFIGURACIÓN DE ESTADO ---
let currentVrm = null;
let reactionState = "idle"; // "idle", "hit", "cover"
let stateTimer = 0;
let isSpeaking = false;
const REACTION_DURATION = 2.5;

const container = document.getElementById('pet-container');
const reactionText = document.getElementById('reaction-text');
const subtitleBox = document.getElementById('subtitle-container');
const clock = new THREE.Clock();

// --- SISTEMA DE AUDIO LOCAL (MP3 GENERADOS) ---
const petAudio = new Audio();
const audioMap = {
    hit: ['h1.mp3', 'h2.mp3', 'h3.mp3'],
    cover: ['c1.mp3', 'c2.mp3', 'c3.mp3']
};

function playPetSound(type) {
    const files = audioMap[type];
    const selected = files[Math.floor(Math.random() * files.length)];
    petAudio.src = `./assets/sounds/pet/${selected}`;
    
    petAudio.play().then(() => {
        isSpeaking = true;
    }).catch(e => console.warn("Audio bloqueado por el navegador hasta interacción."));

    petAudio.onended = () => { isSpeaking = false; };
}

// --- INICIALIZACIÓN DE ESCENA (ADAPTADA A TEMAS) ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.8, 3.5); // Vista de cuerpo completo

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0); // Fondo transparente para ver el CSS
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Luces dinámicas
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(1, 2, 1).normalize();
scene.add(dirLight);

// --- CARGA DEL MODELO ---
const loader = new GLTFLoader();
loader.register((parser) => new VRMLoaderPlugin(parser));

loader.load(
    './assets/models/mascot.vrm',
    (gltf) => {
        const vrm = gltf.userData.vrm;
        scene.add(vrm.scene);
        currentVrm = vrm;
        vrm.scene.rotation.y = 0; // Mirar de frente
        
        resetPose(); // Aplicar pose inicial natural
        console.log("Mascota Virtual Cargada con Sistema de Temas y Audio Local");
    },
    (progress) => console.log('Cargando:', (progress.loaded / progress.total * 100).toFixed(0) + '%'),
    (error) => console.error('Error al cargar VRM:', error)
);

// --- POSES Y NATURALIDAD (DEDOS Y BRAZOS) ---
function resetPose() {
    if (!currentVrm) return;
    const h = currentVrm.humanoid;
    
    // Resetear todos los huesos que se tocan en las animaciones
    const bones = ['leftUpperArm', 'rightUpperArm', 'leftLowerArm', 'rightLowerArm', 'leftShoulder', 'rightShoulder', 'spine', 'neck'];
    bones.forEach(name => {
        const bone = h.getNormalizedBoneNode(name);
        if (bone) bone.rotation.set(0, 0, 0);
    });

    // Pose A (Brazos abajo)
    h.getNormalizedBoneNode('leftUpperArm').rotation.z = -1.2;
    h.getNormalizedBoneNode('rightUpperArm').rotation.z = 1.2;
    
    // Manos relajadas (caída natural)
    ['left', 'right'].forEach(side => {
        const sideMult = side === 'left' ? 1 : -1;
        ['Index', 'Middle', 'Ring', 'Little'].forEach((f, i) => {
            const b = h.getNormalizedBoneNode(`${side}${f}Proximal`);
            if (b) b.rotation.x = 0.2 + (i * 0.1); 
        });
        const thumb = h.getNormalizedBoneNode(`${side}ThumbProximal`);
        if (thumb) {
            thumb.rotation.x = 0.3;
            thumb.rotation.y = sideMult * 0.4;
        }
    });
}

// --- INTERACCIÓN ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

container.addEventListener('touchstart', (e) => {
    if (!currentVrm || reactionState !== "idle") return;

    const rect = container.getBoundingClientRect();
    mouse.x = ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(currentVrm.scene.children, true);

    if (intersects.length > 0) {
        const hitPoint = intersects[0].point;
        
        // Obtener posiciones del modelo en tiempo real
        const headPos = new THREE.Vector3();
        const chestPos = new THREE.Vector3();
        currentVrm.humanoid.getNormalizedBoneNode('head').getWorldPosition(headPos);
        currentVrm.humanoid.getNormalizedBoneNode('chest').getWorldPosition(chestPos);

        // Umbral de distancia para toque
        if (hitPoint.distanceTo(headPos) < 0.22) {
            triggerReaction("hit");
        } else if (hitPoint.distanceTo(chestPos) < 0.25) {
            triggerReaction("cover");
        }
    }
});

function triggerReaction(type) {
    reactionState = type;
    stateTimer = 0;
    
    // Configuración de UI según zona
    if (type === "hit") {
        reactionText.innerText = "痛死了！你在干什么？"; // Duele! ¿Qué haces?
    } else {
        reactionText.innerText = "变态！离我远点！"; // Pervertido! Aléjate!
    }
    
    subtitleBox.classList.add('active'); // Mostrar cristal
    playPetSound(type); // Audio local

    // Expresión de enojo
    currentVrm.expressionManager.setValue(VRMExpressionPresetName.Angry, 1.0);
}

// --- BUCLE DE ANIMACIÓN PRINCIPAL ---
function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    if (currentVrm) {
        const h = currentVrm.humanoid;
        
        if (reactionState === "hit") {
            // Reacción física de cabeza (Oscilación amortiguada)
            stateTimer += deltaTime;
            const progress = stateTimer / 1.5;
            if (progress < 1.0) {
                const intensity = 0.3 * Math.exp(-progress * 3);
                const shake = Math.sin(stateTimer * 25) * intensity;
                h.getNormalizedBoneNode('neck').rotation.y = shake;
                h.getNormalizedBoneNode('neck').rotation.x = -intensity * 0.5;
            } else { endReaction(); }

        } else if (reactionState === "cover") {
            // Reacción de taparse el pecho (Pose forzada)
            stateTimer += deltaTime;
            const p = Math.min(stateTimer / 0.4, 1.0); // Transición a la pose
            
            // Cruzar brazos al pecho
            h.getNormalizedBoneNode('leftUpperArm').rotation.set(0.6 * p, 0.8 * p, -0.4 * p);
            h.getNormalizedBoneNode('leftLowerArm').rotation.set(1.4 * p, 0, 0);
            
            h.getNormalizedBoneNode('rightUpperArm').rotation.set(0.6 * p, -0.8 * p, 0.4 * p);
            h.getNormalizedBoneNode('rightLowerArm').rotation.set(1.4 * p, 0, 0);

            // Inclinación de espalda
            h.getNormalizedBoneNode('spine').rotation.x = 0.3 * p;

            if (stateTimer > REACTION_DURATION) { endReaction(); }

        } else {
            // --- IDLE: Respiración y Parpadeo ---
            const s = Math.sin(elapsed * 1.5);
            h.getNormalizedBoneNode('leftUpperArm').rotation.z = -1.2 + (s * 0.02);
            h.getNormalizedBoneNode('rightUpperArm').rotation.z = 1.2 - (s * 0.02);
            h.getNormalizedBoneNode('neck').rotation.y = Math.sin(elapsed * 0.6) * 0.05;
            
            // Parpadeo automático
            const blinkValue = Math.sin(elapsed * 5) > 0.98 ? 1 : 0;
            currentVrm.expressionManager.setValue(VRMExpressionPresetName.Blink, blinkValue);
        }

        // --- LIP-SYNC (Movimiento de boca al ritmo del Audio) ---
        if (isSpeaking) {
            // Vibración aleatoria rápida para simular habla
            const mouthOpen = Math.abs(Math.sin(Date.now() * 0.012)) * 0.7 + (Math.random() * 0.2);
            currentVrm.expressionManager.setValue(VRMExpressionPresetName.Aa, Math.min(mouthOpen, 1.0));
        } else {
            currentVrm.expressionManager.setValue(VRMExpressionPresetName.Aa, 0);
        }

        currentVrm.update(deltaTime);
    }
    
    renderer.render(scene, camera);
}

function endReaction() {
    reactionState = "idle";
    subtitleBox.classList.remove('active');
    if (currentVrm) currentVrm.expressionManager.setValue(VRMExpressionPresetName.Angry, 0);
    resetPose();
}

animate();

// --- GESTIÓN DE VENTANA (RESIZE) ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});