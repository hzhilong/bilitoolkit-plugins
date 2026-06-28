<script setup lang="ts">
import { RouterView, useRoute, useRouter } from 'vue-router'
import { PluginPageHeader, type PluginMenuData } from 'bilitoolkit-ui'
import { ref } from 'vue'
import { appMenus } from '@/router'

const route = useRoute()
const router = useRouter()
const menus = ref<Array<PluginMenuData>>(appMenus as Array<PluginMenuData>)
const handleMenuSelect = (menu: PluginMenuData) => {
  router.push(menu.path)
}
</script>

<template>
  <div class="plugin-page">
    <plugin-page-header :menus="menus" :active-index="route.path" @handle-menu-select="handleMenuSelect" />
    <router-view class="plugin-page-content" v-slot="{ Component, route }">
      <keep-alive>
        <component :is="Component" :key="route.fullPath" />
      </keep-alive>
    </router-view>
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
    min-height: 0;
    margin-top: 0 !important;
  }
}
</style>
