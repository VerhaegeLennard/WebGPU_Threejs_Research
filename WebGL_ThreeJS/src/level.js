import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import Stats from 'three/addons/libs/stats.module.js';

export function initializeLevel() {
  //set up the renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  //create the scene
  const scene = new THREE.Scene();

  //create stats
  const stats = new Stats();
  document.body.appendChild(stats.dom);

  //load the environment map (stars background)
  const envLoader = new EXRLoader().setPath('/texture/');
  envLoader.load(
    'NightSky-HDR.exr',
    (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
      scene.background = texture;
      scene.background.encoding = THREE.sRGBEncoding;
      scene.background.opacity = 0.1;
      console.log('EXR Texture loaded successfully.');
    },
    undefined,
    (error) => {
      console.error('An error occurred while loading the EXR texture:', error);
    }
  );

  //create the moving stars in background
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });
  const starVertices = [];
  for (let i = 0; i < 10000; i++) {
    const x = THREE.MathUtils.randFloatSpread(2000);
    const y = THREE.MathUtils.randFloatSpread(2000);
    const z = THREE.MathUtils.randFloatSpread(2000);
    starVertices.push(x, y, z);
  }
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  //create the camera
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(4, 5, 11);

  //create camera controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 120;
  controls.minPolarAngle = 0.5;
  controls.maxPolarAngle = 1.5;
  controls.autoRotate = false;
  controls.target = new THREE.Vector3(0, 0, 0);
  controls.update();

  const spaceshiploader = new GLTFLoader().setPath('/space_ship_diorama/');
  spaceshiploader.load('scene.gltf', (gltf) => {
    const spaceship = gltf.scene;
    spaceship.position.set(0, 0, 0);
    spaceship.scale.set(3, 3, 3);
    spaceship.rotation.y = Math.PI / 2;

    // Center the spaceship
    const box = new THREE.Box3().setFromObject(spaceship);
    const center = box.getCenter(new THREE.Vector3());
    spaceship.position.sub(center);
    spaceship.position.y += 2;
    spaceship.position.x -= 6;
    spaceship.position.z -= 27;

    scene.add(spaceship);
    console.log('Spaceship loaded successfully.');

    // Add additional spaceships far in the background
    for (let i = 1; i <= 5; i++) {
      const clone = spaceship.clone();
      clone.position.set(
        spaceship.position.x + Math.random() * 2000 - 1000,
        spaceship.position.y + Math.random() * 400 - 200,
        spaceship.position.z + Math.random() * 2000 - 1000
      );
      scene.add(clone);
    }
  });

  //add the cube to the scene
  const clock = new THREE.Clock();
  const cubeloader = new GLTFLoader().setPath('/placeholder-cube_workshop_version/');
  cubeloader.load('scene.gltf', (gltf) => {
    const cube = gltf.scene;

    cube.traverse((child) => {
      if (child.isMesh) {
        // Set the material to a highly reflective mirror-like material
        child.material = new THREE.MeshStandardMaterial({
          color: 0xaaaaaa,
          metalness: 1, // Highly reflective
          roughness: 0.1, // Perfectly smooth for mirror-like reflections
          envMap: scene.environment, // Use the environment map
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    cube.position.set(0, 0.6, 0);
    cube.scale.set(0.5, 0.5, 0.5);
    scene.add(cube);

    //the mapgrid is a list of positions where the boxes will be placed
    const mapgrid = [
      { x: -1, y: -1 },
      { x: -1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: -1 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 0 },
      { x: 3, y: 1 },
      { x: 3, y: 2 },
      { x: 4, y: 0 },
      { x: 4, y: 1 },
      { x: 4, y: 2 },
      { x: 4, y: 3 },
      { x: 5, y: 1 },
      { x: 5, y: 2 },
      { x: 5, y: 3 },
      { x: 5, y: 4 },
      { x: 6, y: 1 },
      { x: 6, y: 2 },
      { x: 6, y: 4 },
      { x: 7, y: 1 },
      { x: 7, y: 2 },
      { x: 7, y: 3 },
      { x: 7, y: 4 },
      { x: 8, y: 2 },
      { x: 8, y: 3 },
      { x: 6, y: 3, ending: true },
    ];

    //add the boxes to the scene
    function addBoxes(positions) {
      const boxMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.05,
        metalness: 1,
      });
      // Create a red material for the ending box
      const endingBoxMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        roughness: 0.1,
        metalness: 0.5,
      });
      const boxGeometry = new THREE.BoxGeometry(1, 0.2, 1);
      const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

      positions.forEach(pos => {
        const material = pos.ending ? endingBoxMaterial : boxMaterial;
        const box = new THREE.Mesh(boxGeometry, material);
        box.position.set(pos.x, 0, pos.y);
        box.castShadow = true;
        box.receiveShadow = true;
        scene.add(box);

        // Add edges to the box
        const edges = new THREE.EdgesGeometry(boxGeometry);
        const line = new THREE.LineSegments(edges, edgesMaterial);
        box.add(line);

        // Add a red spotlight to the ending box
        if (pos.ending) {
          const redSpotLight = new THREE.SpotLight(0xff0000, 2000, 10, 300, 2);
          redSpotLight.position.set(pos.x, -8, pos.y);
          redSpotLight.target = box;
          redSpotLight.castShadow = true;
          scene.add(redSpotLight);
        }
      });
    }

    addBoxes(mapgrid);

    //adjust the camera to fit the mapgrid
    function adjustCameraToFitMapgrid(camera, mapgrid, controls) {
      const minX = Math.min(...mapgrid.map(pos => pos.x));
      const maxX = Math.max(...mapgrid.map(pos => pos.x));
      const minY = Math.min(...mapgrid.map(pos => pos.y));
      const maxY = Math.max(...mapgrid.map(pos => pos.y));
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const width = maxX - minX + 1;
      const height = maxY - minY + 1;
      const maxDimension = Math.max(width, height);
      const fov = camera.fov * (Math.PI / 180);
      const distance = (maxDimension / 2) / Math.tan(fov / 2);

      camera.position.set(centerX - 5, distance * 0.6, centerY + 10);
      controls.target.set(centerX, 0, centerY);
      controls.update();
      camera.updateProjectionMatrix();
    }

    adjustCameraToFitMapgrid(camera, mapgrid, controls);

    //check if the cube is out of bounds
    function isCubeOutOfBounds(cube, mapgrid) {
      const cubeX = Math.round(cube.position.x);
      const cubeY = Math.round(cube.position.z);
      return !mapgrid.some(pos => pos.x === cubeX && pos.y === cubeY);
    }

    //reset the level if the cube is out of bounds
    function resetLevel() {
      cube.position.set(0, 0.6, 0);
      adjustCameraToFitMapgrid(camera, mapgrid, controls);
    }

    //create the animation mixer for the cube
    let mixer;
    mixer = new THREE.AnimationMixer(cube);

    //add cube controls
    window.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowUp':
          cube.position.z -= 1;
          break;
        case 'ArrowDown':
          cube.position.z += 1;
          break;
        case 'ArrowLeft':
          cube.position.x -= 1;
          break;
        case 'ArrowRight':
          cube.position.x += 1;
          break;
      }
      if (isCubeOutOfBounds(cube, mapgrid)) {
        resetLevel();
      } else {
        // Check if the cube is on the ending block
        const cubeX = Math.round(cube.position.x);
        const cubeY = Math.round(cube.position.z);
        const endingBlock = mapgrid.find(pos => pos.x === cubeX && pos.y === cubeY && pos.ending);
        if (endingBlock) {
          //animate the cube if it's on the ending block
          console.log('Level complete!');
          gltf.animations.forEach((clip) => {
            mixer.clipAction(clip).play();
          });
        }
      }
    });

    //resize the renderer when the window is resized
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // const rotatingCubes = [];
    // const cubeGeometry = new THREE.BoxGeometry(3, 3, 3);
    // const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

    // for (let i = 0; i < 1000; i++) {
    //   const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    //   cube.position.set(
    //     Math.random() * 100 - 50,
    //     Math.random() * 100 - 50,
    //     Math.random() * 100 - 50
    //   );
    //   scene.add(cube);
    //   rotatingCubes.push(cube);
    // }

    function animate() {
      requestAnimationFrame(animate);
      const deltaTime = clock.getDelta();
      if (mixer) mixer.update(deltaTime);
      stars.rotation.x += 0.0004;
      stars.rotation.y += 0.0004;
      controls.update();

      // // Rotate the cubes
      // rotatingCubes.forEach(cube => {
      //   cube.rotation.x += 0.01;
      //   cube.rotation.y += 0.01;
      // });

      renderer.render(scene, camera);
      stats.update();
    }

    animate();
  });
}
