<script setup lang="ts">
import { PluginPageContent, SettingGroup, SettingItem } from 'bilitoolkit-ui'
import { videoQualityEntries, audioQualityEntries, videoCodecEntries } from '@ybgnb/bili-api'
import { storeToRefs } from 'pinia'
import { useAppSettingsStore } from '@/stores/app-settings'
import FileNamerSettings from '@/components/settings/FileNamerSettings.vue'
import { downloadResourceNameMap } from 'bilitoolkit-types'
const { appSettings } = storeToRefs(useAppSettingsStore())

const handleVideoQualityChange = () => {
  if (appSettings.value.preferredVideoQuality === 127 && appSettings.value.preferredVideoCodec === 7) {
    appSettings.value.preferredVideoCodec = 12
  }
}
const handleVideoCodecChange = () => {
  if (appSettings.value.preferredVideoQuality === 127 && appSettings.value.preferredVideoCodec === 7) {
    appSettings.value.preferredVideoQuality = 120
  }
}
</script>

<template>
  <plugin-page-content class="page-content">
    <setting-group name="插件设置">
      <setting-item title="优先下载的音频音质">
        <el-select v-model.number="appSettings.preferredAudioQuality" style="width: 120px">
          <el-option v-for="[id, name] in audioQualityEntries" :key="id" :label="name" :value="id" />
        </el-select>
      </setting-item>
      <setting-item title="优先下载的视频画质">
        <el-select
          v-model.number="appSettings.preferredVideoQuality"
          style="width: 120px"
          @change="handleVideoQualityChange"
        >
          <el-option v-for="[id, name] in videoQualityEntries" :key="id" :label="name" :value="id" />
        </el-select>
      </setting-item>
      <setting-item title="优先下载的视频编码" desc="AVC 不支持 8K 分辨率">
        <el-select
          v-model.number="appSettings.preferredVideoCodec"
          style="width: 120px"
          @change="handleVideoCodecChange"
        >
          <el-option v-for="[id, name] in videoCodecEntries" :key="id" :label="name" :value="id" />
        </el-select>
      </setting-item>
      <setting-item title="下载后自动合并音频和视频" desc="需同时下载音频和视频">
        <el-switch v-model="appSettings.autoMerge"> </el-switch>
      </setting-item>
      <setting-item
        title="当下载链接失效时，自动尝试重新解析资源地址，获取有效链接继续下载"
        desc="自动处理因排队等待导致链接过期的任务，无需重新添加下载任务"
      >
        <el-switch v-model="appSettings.autoReparseOnUrlExpired"> </el-switch>
      </setting-item>
      <setting-item
        title="存在相同文件时，是否自动添加序号避免重名"
        desc="例如【测试视频.mp4】重命名为【测试视频 - 1.mp4】"
      >
        <el-switch v-model="appSettings.autoRenameOnConflict"> </el-switch>
      </setting-item>
      <setting-item title="默认下载的资源">
        <el-checkbox-group v-model="appSettings.defaultResourceTypes">
          <el-checkbox v-for="(item, key) in downloadResourceNameMap" :label="item" :value="key" :key="key" />
        </el-checkbox-group>
      </setting-item>
    </setting-group>
    <setting-group name="文件命名模板">
      <FileNamerSettings></FileNamerSettings>
    </setting-group>
  </plugin-page-content>
</template>

<style scoped lang="scss">
.page-content {
  padding-right: 10px;
}
</style>
