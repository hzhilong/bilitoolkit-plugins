<script setup lang="ts">
import { RouterView, useRoute, useRouter } from 'vue-router'
import { PluginPageHeader, type PluginMenuData } from 'bilitoolkit-ui'
import { ref } from 'vue'
import { pluginMenus } from '@/router'

const route = useRoute()
const router = useRouter()
const menus = ref<Array<PluginMenuData>>(pluginMenus as Array<PluginMenuData>)
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

<style>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
}
</style>

<style scoped lang="scss">
.plugin-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .plugin-page-content {
    flex: 1;
    min-height: 0;
  }
}
</style>
