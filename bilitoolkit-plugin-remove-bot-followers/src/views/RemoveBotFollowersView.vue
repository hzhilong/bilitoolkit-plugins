<template>
  <plugin-page-content>
    <div class="header">
      <el-button type="primary" @click="handleQuery"> 查询机器人粉丝 </el-button>
      <div class="hint-area">
        <el-alert
          title="2025.4 后出现大量机器人粉丝，据传被关注后可能导致账号遭到举报/警告/封禁"
          type="info"
          :closable="false"
        />
      </div>
    </div>

    <div class="table-toolbar" v-if="tableData.length > 0">
      <el-text>共筛选出 {{ tableData.length }} 个疑似机器人的粉丝</el-text>
      <el-button type="primary" @click="handleRemoveSelected(false)"> 移除所选粉丝 </el-button>
      <el-button type="primary" @click="handleRemoveSelected(true)"> 移除并拉黑所选粉丝 </el-button>
    </div>

    <div class="table-wrapper">
      <el-table v-if="tableData.length > 0" ref="tableRef" :data="tableData" border style="width: 100%">
        <el-table-column type="selection" width="35" align="center" />

        <el-table-column prop="mid" label="UID" width="140" />
        <el-table-column prop="level" label="等级" width="50" align="center" />

        <el-table-column prop="uname" label="昵称" :show-overflow-tooltip="true"> </el-table-column>

        <el-table-column label="头像" width="60" align="center">
          <template #default="{ row }">
            <img :src="row.face" loading="lazy" width="24" height="24" style="border-radius: 50%" />
          </template>
        </el-table-column>

        <el-table-column label="会员" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.vip != null && row.vip.vipType !== 0 ? 'success' : 'info'" size="small">
              {{ parseVipTypeName((row as RobotFans).vip.vipType ?? 0) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="60" align="center">
          <template #default="{ row }">
            <el-tag :type="row.silence === 1 ? 'danger' : 'success'" size="small">
              {{ row.silence === 1 ? '封禁' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="robotScore" label="评分" width="50" align="center" />

        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row, $index }">
            <el-button type="primary" link @click="handleOpenSpace(row as RobotFans)"> 查看 </el-button>
            <el-button type="primary" link @click="handleIgnore(row as RobotFans, $index)"> 忽略 </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </plugin-page-content>
</template>

<script setup lang="ts">
import { ref, nextTick, useTemplateRef } from 'vue'
import { ElTable } from 'element-plus'
import { useSelectedUserStore, PluginPageContent, showToast, showWarning, showConfirm } from 'bilitoolkit-ui'
import type { RobotFans } from '@/types'
import { useAppSettingsStore } from '@/stores/app-settings'
import { storeToRefs } from 'pinia'
import type { UserCard } from '@ybgnb/bili-api'
import type { ComponentExposed } from 'vue-component-type-helpers'
import { removeFans } from '@/utils/remove-fans'
import { getRobotFans } from '@/utils/robot'

const userStore = useSelectedUserStore()
const { assertLoggedIn } = userStore
const { user } = storeToRefs(userStore)
const { appSettings } = storeToRefs(useAppSettingsStore())
const tableData = ref<RobotFans[]>([])

const tableRef = useTemplateRef<ComponentExposed<typeof ElTable<RobotFans>>>('tableRef')

const handleQuery = async () => {
  assertLoggedIn()
  tableData.value = await getRobotFans(appSettings.value, { user: user.value! })
  if (tableData.value.length < 1) {
    showToast('暂未发现疑似机器人的粉丝')
  }
  await nextTick(() => {
    if (tableRef.value && tableData.value.length > 0) {
      tableRef.value.toggleAllSelection()
    }
  })
}

const handleIgnore = (row: RobotFans, index: number) => {
  tableRef.value?.toggleRowSelection(row, false)
  tableData.value.splice(index, 1)
}

const parseVipTypeName = (type: 0 | 1 | 2) => {
  return { 0: '无', 1: '月度大会员', 2: '年度大会员' }[type]
}

const handleOpenSpace = (user: UserCard) => {
  window.open(`https://space.bilibili.com/${user.mid}`)
}

const handleRemoveSelected = async (block: boolean) => {
  const selectedRows = tableRef.value!.getSelectionRows()
  if (selectedRows.length === 0) {
    showWarning('请选择需要移除的粉丝')
    return
  }
  await showConfirm(`确定移除 ${selectedRows.length} 个所选粉丝吗？`)
  await removeFans(selectedRows, block, { user: user.value! })
  showToast(`成功移除${block ? '并拉黑' : ''} ${selectedRows.length} 个机器人粉丝`)
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 20px;
  line-height: 1;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color);
  margin-bottom: 10px;
}

.table-wrapper {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
}

.table-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}
</style>
