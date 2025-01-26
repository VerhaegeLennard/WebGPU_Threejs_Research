import { initializeLevel } from './level.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const playButton = document.getElementById('play-button');
const uiContainer = document.querySelector('.ui-container');  // Select the UI container
let sceneInitialized = false;

playButton.addEventListener('click', () => {
    if (!sceneInitialized) {
        initializeLevel();
        sceneInitialized = true;
        playButton.style.display = 'none'; // Hide the play button
        uiContainer.style.display = 'none'; // Hide the UI container
    }
});

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGPURenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add an ambient light to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

let spaceships = [];
let spaceshipStartTimes = [];
const loader = new GLTFLoader().setPath('/space_ship/');
const spaceshipCount = 5;

// Load multiple ships with staggered start times and random positions
for (let i = 0; i < spaceshipCount; i++) {
    loader.load('scene.gltf', (gltf) => {
        console.log('loading model');
        const spaceship = gltf.scene;

        spaceship.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // Randomize the initial position of each spaceship
        spaceship.position.set(
            THREE.MathUtils.randFloatSpread(20),
            THREE.MathUtils.randFloatSpread(10),
            THREE.MathUtils.randFloatSpread(200) - 120
        );

        spaceship.rotation.y = Math.PI / 2;
        spaceship.scale.set(0, 0, 0);
        scene.add(spaceship);
        spaceships.push(spaceship);

        spaceshipStartTimes.push(i * 3 + Math.random() * 2);  // Minimum 3 seconds apart with some randomness
    });
}

// Create the star field
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });
const starVertices = [];
for (let i = 0; i < 5000; i++) {
    const x = THREE.MathUtils.randFloatSpread(3000);
    const y = THREE.MathUtils.randFloatSpread(3000);
    const z = THREE.MathUtils.randFloatSpread(3000);
    starVertices.push(x, y, z);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

let clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);

    // Move the stars towards the camera
    const positions = starGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        positions[i + 2] += 1; // Move stars closer to the camera
        if (positions[i + 2] > camera.position.z) {
            positions[i + 2] = -1000; // Reset star position when it passes the camera
        }
    }
    starGeometry.attributes.position.needsUpdate = true;

    // Animate the spaceships
    const time = clock.getElapsedTime();
    spaceships.forEach((spaceship, index) => {
        const startTime = spaceshipStartTimes[index];

        if (time >= startTime) {
            const speed = Math.pow((time - startTime) % 10, 2); // Speed up after it starts

            // Animate the scaling process for the spaceship
            if (spaceship.scale.x < 1) {
                const scale = Math.min(1, (time - startTime) / 5); // Scale up over 5 seconds
                spaceship.scale.set(scale, scale, scale);
            }

            spaceship.position.z = speed - 80; // Start further in the distance
        }
    });
    renderer.render(scene, camera);
}

animate();
