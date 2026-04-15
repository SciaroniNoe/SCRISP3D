import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'
const cesiumSource = 'node_modules/cesium/Build/Cesium';

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    viteStaticCopy({
      targets: [
        { src: path.join(cesiumSource, 'Assets'), dest: 'cesium' },
        { src: path.join(cesiumSource, 'ThirdParty'), dest: 'cesium' },
        { src: path.join(cesiumSource, 'Widgets'), dest: 'cesium' },
        { src: path.join(cesiumSource, 'Workers'), dest: 'cesium' },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})