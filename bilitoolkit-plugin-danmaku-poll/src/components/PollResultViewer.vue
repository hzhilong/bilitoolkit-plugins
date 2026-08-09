<template>
  <div class="poll-result-viewer">
    <div class="result-header">
      <div class="poll-title">
        <span>【投票】：</span>
        <OverflowText :content="result.config.title"></OverflowText>
      </div>
      <div class="poll-countdown-section">
        <template v-if="result.status === 'active' && countdownText">
          <el-icon class="icon"><Clock /></el-icon>
          <span class="value">{{ countdownText }}</span>
        </template>
        <span v-else-if="result.status === 'ended'">已结束</span>
      </div>
    </div>
    <div class="result-body">
      <div class="options-list">
        <div
          v-for="(item, index) in result.optionResults"
          :key="index"
          class="option-item"
          :style="{ '--item-color': item.option.color, '--item-progress': `${getPercentage(item.count)}%` }"
          :class="{ 'is-max': item.count === maxCount }"
        >
          <svg v-if="item.count === maxCount"><rect></rect></svg>
          <div class="option-index">{{ index + 1 }}</div>
          <div class="option-content">
            <div class="option-label">
              <OverflowText :content="item.option.label"></OverflowText>
            </div>
            <div class="option-detail">
              <div class="option-progress"></div>
              <div class="option-count">{{ item.count }} 票</div>
              <div class="option-percentage">({{ getPercentage(item.count) }}%)</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="result-footer" v-if="detailMode">
      <div class="time-section">
        <el-icon><Clock /></el-icon>
        <span class="time-label">开始:</span>
        <span>{{ getFormattedDateTime(new Date(result.startTime * 1000)) }}</span>
      </div>
      <div class="time-section">
        <el-icon><Clock /></el-icon>
        <span class="time-label">结束:</span>
        <span>{{ getFormattedDateTime(new Date(result.endTime * 1000)) }}</span>
      </div>
      <div class="stat">
        <span>总有效票数：</span>
        <span class="total">{{ result.totalVotes }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Clock } from '@element-plus/icons-vue'
import { type PollResult } from '@/types'
import { getFormattedDateTime } from '@ybgnb/utils'
import { OverflowText } from 'bilitoolkit-ui'

const props = defineProps<{
  result: PollResult
  countdownText?: string
  detailMode?: boolean
}>()

const getPercentage = (count: number) => {
  if (props.result.totalVotes === 0) return 0
  return ((count * 100) / props.result.totalVotes).toFixed(1)
}

const maxCount = computed(() => {
  const max = Math.max(...props.result.optionResults.map((item) => item.count))
  if (max === 0) return -1
  return max
})
</script>

<style scoped lang="scss">
.poll-result-viewer {
  $viewer-width: 300px;
  width: $viewer-width;
  margin: 0 auto;
  border-radius: 10px;
  border: 2px solid color-mix(in srgb, var(--el-color-primary), var(--app-color-background) 46%);
  overflow: hidden;

  .result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: nowrap;
    text-wrap: nowrap;
    padding: 6px 6px;
    background: color-mix(in srgb, var(--el-color-primary), var(--app-color-background) 76%);
    border-bottom: 1px dashed color-mix(in srgb, var(--el-color-primary), var(--app-color-background) 66%);

    .poll-title {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      font-size: 14px;
      font-weight: 700;
      color: color-mix(in srgb, var(--el-color-primary), var(--el-text-color-primary) 66%);
      display: flex;
      flex-wrap: nowrap;
    }

    .poll-countdown-section {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 12px;
      font-weight: 500;
      padding: 0px 6px;

      border: 1px solid color-mix(in srgb, var(--el-color-primary), var(--app-color-background) 46%);
      border-radius: 6px;

      .icon,
      .value {
        color: var(--el-color-primary);
      }
    }
  }

  .options-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 4px 6px;
    background: color-mix(in srgb, var(--el-color-primary), var(--app-color-background) 90%);
  }

  .option-item {
    width: 284px;
    height: 40px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 2px 10px;
    border: 1px solid var(--app-color-primary-transparent-20);
    background: color-mix(in srgb, var(--el-color-primary), var(--app-color-background) 98%);
    border-radius: 8px;
    position: relative;
    box-sizing: border-box;

    &.is-max {
      padding: 3px 11px;
      --border-total-length: 648;

      svg {
        position: absolute;
        top: -1px;
        left: -1px;
        width: calc(100% + 2px);
        height: calc(100% + 2px);
        border-radius: 8px;
      }
      svg rect {
        x: 1px;
        y: 1px;
        width: calc(100% - 2px);
        height: calc(100% - 2px);
        rx: 6px;
        ry: 6px;
        fill: transparent;
        stroke: color-mix(in srgb, var(--el-color-primary), var(--app-color-background) 48%);
        stroke-width: 1;
        stroke-dasharray: calc(var(--border-total-length) / 6) calc(5 * var(--border-total-length) / 6);
        transform: rotate(0);
        animation: 4s rotate linear infinite;
      }

      @keyframes rotate {
        to {
          stroke-dashoffset: 0;
        }
        from {
          stroke-dashoffset: var(--border-total-length);
        }
      }
    }

    .option-index {
      width: 26px;
      height: 26xpx;
      text-align: center;
      line-height: 26px;
      color: #fff;
      font-weight: 700;
      font-size: 16px;
      flex-shrink: 0;
      border-radius: 6px;
      background: var(--item-color);
    }

    .option-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;

      .option-detail {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }

    .option-label {
      width: 100%;
      color: var(--el-text-color-regular);
      font-size: 13px;
      line-height: 18px;
      font-weight: 500;
    }

    .option-progress {
      height: 8px;
      flex: 1;
      min-width: 0;
      border-radius: 10px;
      background: color-mix(in srgb, var(--item-color), var(--app-color-background) 66%);
      position: relative;
      overflow: hidden;

      &::after {
        position: absolute;
        content: '';
        top: 0;
        bottom: 0;
        left: 0;
        right: calc(100% - var(--item-progress));
        background: var(--item-color);
        border-radius: 10px;
        z-index: 1;
      }
    }

    .option-count {
      line-height: 16px;
      font-size: 12px;
      font-weight: 500;
      flex-shrink: 0;
      color: var(--item-color);
    }

    .option-percentage {
      line-height: 16px;
      font-size: 12px;
      font-weight: 400;
      flex-shrink: 0;
    }
  }

  .result-footer {
    padding: 4px 10px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    background: color-mix(in srgb, var(--el-color-primary), var(--app-color-background) 80%);

    .time-section {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}
</style>
