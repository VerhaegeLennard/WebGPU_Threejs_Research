import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
    // For issues with the Three.js WebGPU build, refer to this link:
    // https://github.com/mrdoob/three.js/pull/28650#issuecomment-2198568721
    resolve: {
        alias: {
            'three/addons': 'three/examples/jsm',
            'three/tsl': 'three/webgpu',
            'three': 'three/webgpu'
        }
    },
    // Apply the top-level await plugin to our vite.config.js
    plugins: [
        topLevelAwait({
            promiseExportName: "__tla",
            promiseImportName: i => `__tla_${i}`
        })
    ],
});