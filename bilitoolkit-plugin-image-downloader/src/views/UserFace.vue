<script setup lang="ts">
import { ref } from 'vue'
import { PluginPageContent, useLoadingData } from 'bilitoolkit-ui'
import { type UserCardData, parseUID } from '@ybgnb/bili-api'
import { client } from '@/common/client'
import { getFileSuffix, downloadFace } from '@/utils/download'

const { loading, loadingData } = useLoadingData()
const userUrl = ref('')
const userCard = ref<UserCardData>()
const fetchFace = loadingData(async () => {
  const uid = await parseUID(userUrl.value)
  userCard.value = await client.user.getUserCard({
    mid: uid,
  })
})
const saveFace = async () => {
  const src = userCard.value!.card.face
  await downloadFace(src, `${userCard.value!.card.mid}${getFileSuffix(src)}`)
}
</script>

<template>
  <PluginPageContent class="page" v-loading="loading">
    <div class="query-section">
      <el-input v-model.trim="userUrl" placeholder="请输入用户链接 / b23分享链接 / 用户UID">
        <template #prepend> 用户链接 </template>
      </el-input>
      <el-button type="primary" @click="fetchFace">获取头像</el-button>
      <el-button v-if="userCard?.card.face" type="primary" @click="saveFace()">保存头像</el-button>
    </div>
    <div class="cover-container">
      <img v-if="userCard?.card.face" :src="userCard.card.face" alt="cover" />
    </div>
  </PluginPageContent>
</template>

<style scoped lang="scss">
.query-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;

  ::v-deep(.el-button + .el-button) {
    margin-left: 0 !important;
  }
}
.cover-container {
  > img {
    width: 100%;
    height: 100%;
  }
}
</style>
