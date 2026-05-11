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
  <plugin-page-header :menus="menus" :active-index="route.path" @handle-menu-select="handleMenuSelect" />
  <RouterView />
</template>

<style scoped></style>
