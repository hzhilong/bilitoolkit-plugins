<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAppSettingsStore } from '@/stores/app-settings'
import { PluginPageContent, SettingItem, SettingGroup, showConfirm, showWarning } from 'bilitoolkit-ui'
import FileNamerSettings from '@/components/FileNamerSettings.vue'
import { downloadResourceTypeMap } from '@/types/download'
import type { CheckboxValueType } from 'element-plus'

const store = useAppSettingsStore()
const { reset } = store
const { appSettings } = storeToRefs(store)
const resetMdSettings = async () => {
  await showConfirm('是否恢复默认的 markdown 设置？')
  await reset()
}
const handleTypesUpdate = (value: CheckboxValueType[]) => {
  console.log(value)
  if (value.length === 0) {
    showWarning('请至少选择一个转换的资源格式')
    appSettings.value.downloadResourceTypes = ['md']
  }
}
</script>

<template>
  <plugin-page-content class="settings-page">
    <setting-group name="下载设置">
      <setting-item title="需要转换的资源格式">
        <el-checkbox-group v-model="appSettings.downloadResourceTypes" @change="handleTypesUpdate">
          <el-checkbox v-for="(item, key) in downloadResourceTypeMap" :label="item" :value="key" :key="key" />
        </el-checkbox-group>
      </setting-item>
    </setting-group>
    <setting-group name="markdown 设置">
      <setting-item title="是否下载图片到本地">
        <el-switch v-model="appSettings.mdLocalImages" />
      </setting-item>
      <setting-item title="是否在开头添加来源信息">
        <el-switch v-model="appSettings.mdPrependAttribution" />
      </setting-item>
      <setting-item title="斜体的定界符">
        <el-select v-model="appSettings.turndownOptions.emDelimiter" default-first-option style="width: 120px">
          <el-option label="*" value="*"></el-option>
          <el-option label="_" value="_"></el-option>
        </el-select>
      </setting-item>
      <setting-item title="加粗的定界符">
        <el-select v-model="appSettings.turndownOptions.strongDelimiter" default-first-option style="width: 120px">
          <el-option label="**" value="**"></el-option>
          <el-option label="__" value="__"></el-option>
        </el-select>
      </setting-item>
      <setting-item title="水平分割线">
        <el-select v-model="appSettings.turndownOptions.hr" style="width: 120px">
          <el-option label="---" value="---"></el-option>
          <el-option label="***" value="***"></el-option>
          <el-option label="___" value="___"></el-option>
        </el-select>
      </setting-item>
      <setting-item title="无序列表的项目符号">
        <el-select v-model="appSettings.turndownOptions.bulletListMarker" default-first-option style="width: 120px">
          <el-option label="-" value="-"></el-option>
          <el-option label="+" value="+"></el-option>
          <el-option label="*" value="*"></el-option>
        </el-select>
      </setting-item>
      <setting-item title="换行符">
        <el-select v-model="appSettings.turndownOptions.br" style="width: 160px">
          <el-option label="换行" :value="'\n'"></el-option>
          <el-option label="两个空格 + 换行" :value="'  \n'"></el-option>
          <el-option label="反斜杠 + 换行" :value="'\\\n'"></el-option>
        </el-select>
      </setting-item>
      <setting-item title="代码块样式">
        <el-select v-model="appSettings.turndownOptions.codeBlockStyle" default-first-option style="width: 180px">
          <el-option label="indented：4空格缩进" value="indented"></el-option>
          <el-option label="fenced：使用```包裹" value="fenced"></el-option>
        </el-select>
      </setting-item>
      <setting-item title="围栏代码块的界定符">
        <el-select v-model="appSettings.turndownOptions.fence" default-first-option style="width: 120px">
          <el-option label="~~~" value="~~~"></el-option>
          <el-option label="```" value="```"></el-option>
        </el-select>
      </setting-item>
      <setting-item title="链接样式">
        <el-select v-model="appSettings.turndownOptions.linkStyle" default-first-option style="width: 220px">
          <el-option label="inlined：内联链接 [text](url)" value="inlined"></el-option>
          <el-option label="referenced：引用链接 [text][id]" value="referenced"></el-option>
        </el-select>
      </setting-item>
      <setting-item title="引用链接的样式">
        <el-select v-model="appSettings.turndownOptions.linkReferenceStyle" default-first-option style="width: 220px">
          <el-option label="full：完整引用 [text][id]" value="full"></el-option>
          <el-option label="collapsed：折叠引用 [text][]" value="collapsed"></el-option>
          <el-option label="shortcut：快捷引用 [text]" value="shortcut"></el-option>
        </el-select>
      </setting-item>
      <setting-item title="是否保留 `<pre>` 和 `<code>` 标签内的空白（缩进、换行）不变">
        <el-switch v-model="appSettings.turndownOptions.preformattedCode" />
      </setting-item>
      <el-button @click="resetMdSettings">恢复默认</el-button>
    </setting-group>
    <setting-group name="文件命名模板">
      <FileNamerSettings></FileNamerSettings>
    </setting-group>
  </plugin-page-content>
</template>

<style scoped lang="scss">
.settings-page {
  padding-right: 10px;
}
</style>
