<!-- Permet de switcher entre la carte 2D et 3D -->
<template>
  <div class="container-2d-3d">
    <Map2D v-if="!store.is3dMode" />
    <Map3D v-else />

    <ControlsMapButton />
  </div>
</template>

<script setup>
import { usestore } from '@/stores/store'
import Map2D from './Map2D.vue'
import Map3D from './Map3D.vue'
import ControlsMapButton from '@/components/ui/ControlsMapButton.vue'

const store = usestore()
</script>

<style scoped>
.container-2d-3d {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>