<script setup lang="ts">
import { RouterView, useRoute, useRouter } from 'vue-router'
import { PluginPageHeader, type PluginMenuData } from 'bilitoolkit-ui'
import { appMenus } from '@/router/menus.js'
import { ref } from 'vue'

const route = useRoute()
const router = useRouter()
const menus = ref(appMenus)
const handleMenuSelect = (menu: PluginMenuData) => {
  router.push(menu.path)
}
</script>

<template>
  <div class="plugin-page">
    <plugin-page-header :menus="menus" :active-index="route.path" @handle-menu-select="handleMenuSelect" />
    <RouterView class="plugin-page-content" />
  </div>
</template>

<style scoped lang="scss">
.plugin-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .plugin-page-content {
    flex: 1;
  }
}
</style>
