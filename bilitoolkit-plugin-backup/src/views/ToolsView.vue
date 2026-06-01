<script setup lang="ts">
const handleTest = () => {
  console.log(`test`)
}
</script>

<template>
  <div class="tools-container">
    <tool-card
      title="测试测试"
      desc="描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述"
      @click="handleTest"
    ></tool-card>
  </div>
</template>

<style scoped lang="scss">
.tools-container {
  display: grid;
  padding: 20px 10px;
  grid-template-columns: repeat(auto-fill, 260px);
}
</style>
