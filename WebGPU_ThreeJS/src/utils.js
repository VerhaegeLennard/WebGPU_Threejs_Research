import * as THREE from 'three';

export function addBoxes(positions, scene) {
    const boxMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 1,
        metalness: 0.5,
    });
    const boxGeometry = new THREE.BoxGeometry(1, 0.2, 1);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

    positions.forEach(pos => {
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.set(pos.x, 0, pos.y);
        box.castShadow = true;
        box.receiveShadow = true;
        scene.add(box);

        const edges = new THREE.EdgesGeometry(boxGeometry);
        const line = new THREE.LineSegments(edges, edgesMaterial);
        box.add(line);
    });
}
