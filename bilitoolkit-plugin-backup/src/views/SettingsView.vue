<script setup lang="ts">
import { PluginPageContent, SettingGroup, SettingItem } from 'bilitoolkit-ui'
</script>

<template>
  <plugin-page-content>
    <setting-group name="插件设置">
      <setting-item title="忽略新账号现有的数据，直接还原">
        <el-switch />
      </setting-item>
      <setting-item title="还原失败时，继续还原下一个数据">
        <el-switch />
      </setting-item>
      <setting-item title="创建[收藏夹]达到上限后，将该收藏夹的视频移入默认收藏夹">
        <el-switch />
      </setting-item>
      <setting-item title="手动选择需要操作的[关注分组]">
        <el-switch />
      </setting-item>
      <setting-item title="手动选择需要操作的[收藏夹]">
        <el-switch />
      </setting-item>
    </setting-group>
  </plugin-page-content>
</template>

<style scoped lang="scss">
.log-print-box {
  flex: 1;
  min-height: 0;
  line-height: 1.4;
}
</style>
