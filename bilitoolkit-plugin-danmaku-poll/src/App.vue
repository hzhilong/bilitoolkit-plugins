<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <router-view class="plugin-page-content" v-slot="{ Component, route }">
    <keep-alive>
      <component :is="Component" :key="route.fullPath" />
    </keep-alive>
  </router-view>
</template>
