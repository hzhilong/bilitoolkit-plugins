<script setup lang="ts">
import { toolkitApi } from '@/api/toolkit-api'
import { BiliUserCard } from 'bilitoolkit-ui'
import type { UserInfoWithCookie } from '@ybgnb/bili-api'
import { ref, onMounted } from 'vue'
import type { AppThemeState } from 'bilitoolkit-types'

const user = ref<UserInfoWithCookie>()
const switchUser = async () => {
  user.value = await toolkitApi.user.switchUser()
}
const theme = ref<AppThemeState>()
const listenerTheme = async () => {
  theme.value = await toolkitApi.system.getAppThemeState()
  await toolkitApi.event.onUpdateAppTheme((newTheme) => {
    theme.value = newTheme
  })
}

onMounted(() => {
  listenerTheme()
})
</script>

<template>
  <el-config-provider :size="'small'" :z-index="3000">
    <div class="demo">
      <div class="btn-list">
        <el-button @click="switchUser">切换用户</el-button>
      </div>
      <div class="user-wrapper">
        <span>{{ user ? '授权的用户：' : '未选择用户' }}</span>
        <bili-user-card v-if="user" :user="user"></bili-user-card>
      </div>
      <div class="test-effect">
        当前软件主题：
        <div>
          主题色：<span :style="{ color: theme?.primaryColor }">{{ theme?.primaryColor }}</span>
        </div>
        <div>主题模式：{{ theme?.themeMode }}</div>
      </div>
    </div>
  </el-config-provider>
</template>

<style scoped lang="scss">
.demo {
  padding: 20px;

  .btn-list {
    display: flex;
    margin-bottom: 1.5rem;
  }

  .user-card {
    width: 300px;
  }

  .test-effect {
    padding: 1.25rem 1.5rem;
    border: var(--el-border);
    border-radius: 1em;
    margin: 1em 0;
    width: fit-content;

    .user-card {
      width: 300px;
    }
  }
}
</style>
