// Archivo: /web/js/globe.js
// Script de Three.js para renderizar la Tierra de Puntos 3D

document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener el contenedor específico para el renderizado
    const container = document.getElementById('globe-visual');
    if (!container) return; // Asegurar que el contenedor existe

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha: true para fondo transparente
    
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Mueve la cámara hacia adelante
    camera.position.z = 4;
    
    const radius = 1.5;
    const pointSize = 0.05;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // NOTA: Debes asegurarte de que este archivo 'mapa_tierra.png' exista 
    // en la raíz de tu carpeta 'web' o ajustar la ruta.
    img.src = 'mapa_tierra.png'; 

    img.onload = () => {
        const imgWidth = img.width;
        const imgHeight = img.height;
        canvas.width = imgWidth;
        canvas.height = imgHeight;
        ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

        const imageData = ctx.getImageData(0, 0, imgWidth, imgHeight).data;
        const positions = [];

        for (let y = 0; y < imgHeight; y += 10) {
            for (let x = 0; x < imgWidth; x += 10) {
                const i = (y * imgWidth + x) * 4;
                const r = imageData[i];
                const g = imageData[i + 1];
                const b = imageData[i + 2];
                const brightness = (r + g + b) / 3;

                if (brightness > 200) {
                    const lon = (x / imgWidth) * Math.PI * 2 - Math.PI;
                    const lat = (y / imgHeight) * Math.PI - Math.PI / 2;

                    const px = radius * Math.cos(lat) * Math.cos(lon);
                    const py = radius * Math.sin(lat);
                    const pz = radius * Math.cos(lat) * Math.sin(lon);

                    positions.push(px, py, pz);
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({ color: 0xffffff, size: pointSize });
        const globePoints = new THREE.Points(geometry, material);

        // Orientación inicial
        globePoints.rotation.x = Math.PI;            
        globePoints.rotation.y = -Math.PI / 2.1;     
        globePoints.scale.z = -1;

        scene.add(globePoints);

        function animate() {
            requestAnimationFrame(animate);
            globePoints.rotation.y += 0.005; 
            renderer.render(scene, camera);
        }
        animate();
    };

    // Manejar el redimensionamiento
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });
});