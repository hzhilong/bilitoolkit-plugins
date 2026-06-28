<script setup lang="ts">
import { Warning } from '@element-plus/icons-vue'
import { PluginPageContent, useSelectedUserStore } from 'bilitoolkit-ui'
import { ref } from 'vue'
import type { UserCard, UserInfo } from '@ybgnb/bili-api'
import { storeToRefs } from 'pinia'
import { crackUidHash } from '@/utils/crack'
import { client } from '@/common/client'

const midHash = ref('')
const users = ref<UserCard[]>([])

const { user } = storeToRefs(useSelectedUserStore())
const assertLoggedIn = () => {
  if (user.value == null) {
    throw new Error('请先登录')
  }
}
const formatUserLabel = (user: UserInfo) => {
  return `${user.name}　${user.mid}　lv${user.level}`
}
const handleCrack = async () => {
  assertLoggedIn()
  const uids = crackUidHash(midHash.value, 10)
  users.value = (await client.user.getUserCards(uids)).filter((u) => u != null && u.level > 1) as UserCard[]
}
const handleOpenSpace = (user: UserInfo) => {
  assertLoggedIn()
  window.open(`https://space.bilibili.com/${user.mid}`)
}
</script>

<template>
  <PluginPageContent class="page">
    <div class="query-section">
      <div class="hint">
        <el-icon><Warning /></el-icon>
        加密后的 mid：可在弹幕屏蔽黑名单中查看（10 位字符）
      </div>
      <el-input v-model.trim="midHash" placeholder="">
        <template #prepend> 加密 mid </template>
      </el-input>
      <el-button type="primary" @click="handleCrack">解密</el-button>
    </div>
    <div class="user-list">
      <div v-for="user in users" :key="user.mid" class="user">
        <el-button type="primary" link @click="handleOpenSpace(user)">{{ formatUserLabel(user) }}</el-button>
      </div>
    </div>
  </PluginPageContent>
</template>

<style scoped lang="scss">
.page {
  width: 560px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 20px;
  margin: 0 auto;
}

.query-section {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .hint {
    color: var(--el-text-color-secondary) !important;
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.user-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
</style>
