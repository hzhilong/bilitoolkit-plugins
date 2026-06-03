<script setup lang="ts">
import { useUser } from '@/composables/useUser'
import { ref } from 'vue'
import { assertUserLoggedIn } from '@/utils/assert'
import ToolExecutionModal from '@/components/modal/ToolExecutionModal.vue'
import type { Tool } from '@/tools'
import { CopyFavTool } from '@/tools/copy-fav'
import { FavAllVideosTool } from '@/tools/fav-all-videos'
import { RemoveBotFansTool } from '@/tools/remove-bot-fans'

const { user } = useUser()
const tools: Tool[] = [new CopyFavTool(), new FavAllVideosTool(), new RemoveBotFansTool()]
const visible = ref(false)
const currTool = ref<Tool>()
const openTool = async (tool: Tool) => {
  assertUserLoggedIn(user.value)
  currTool.value = tool
  visible.value = true
}
</script>

<template>
  <div class="tools-view">
    <div class="tools-card-container">
      <tool-card
        class="tool-card"
        v-for="tool in tools"
        :key="tool.title"
        :title="tool.title"
        :desc="tool.desc"
        @click="openTool(tool)"
      ></tool-card>
    </div>
    <ToolExecutionModal v-if="currTool && user" :tool="currTool" :user="user" v-model="visible"></ToolExecutionModal>
  </div>
</template>

<style scoped lang="scss">
.tools-view {
  display: flex;
  flex-direction: column;
  .tools-card-container {
    display: grid;
    padding: 20px 10px;
    grid-template-columns: repeat(auto-fill, 220px);
    gap: 14px;
  }

  .log-print-box {
    width: 100%;
    flex: 1;
  }
}
</style>
