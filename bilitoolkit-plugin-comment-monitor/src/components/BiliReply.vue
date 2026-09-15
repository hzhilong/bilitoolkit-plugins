<script setup lang="ts">
import { type BiliCommentEntity } from 'bili-comment-core'
import { IconLabel, formatStatCount } from 'bilitoolkit-ui'
import { getFormattedDateTime } from '@ybgnb/utils'
import { handleOpenComment, handleCopyCommentUrl, handleOpenCommentUser } from '@/utils/click-handlers'
import { getUserAvatarThumbnail } from 'bilitoolkit-ui'

defineProps<{
  reply: BiliCommentEntity
}>()
</script>

<template>
  <div class="bili-reply-container">
    <img
      class="user-avatar"
      :src="getUserAvatarThumbnail(reply.senderFace)"
      alt=""
      loading="lazy"
      :class="'subCount' in reply ? 'big' : ''"
    />
    <div class="main">
      <span class="user-name" @click.stop="handleOpenCommentUser(reply)">{{ reply.senderName }}</span>
      <span class="reply-content">{{ reply.content }}</span>
    </div>
    <div class="footer">
      <div class="reply-time">{{ getFormattedDateTime(new Date(reply.ctime * 1000)) }}</div>
      <IconLabel icon="thumb-up">{{ formatStatCount(reply.like) }}</IconLabel>
      <el-button link @click.stop="handleOpenComment(reply)">打开</el-button>
      <el-button link @click.stop="handleCopyCommentUrl(reply)">复制评论链接</el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bili-reply-container {
  width: 100%;
  position: relative;
  padding: 8px 0px 8px 34px;
  border-radius: 4px;

  .user-avatar {
    position: absolute;
    left: 0px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }

  .main {
    .user-name {
      display: inline-block;
      font-weight: 600;
      color: var(--el-text-color-regular);
      font-size: 14px;
      white-space: nowrap;
      margin-right: 8px;
      cursor: pointer;
    }

    .reply-content {
      display: inline;
      font-size: 15px;
      color: var(--el-text-color-primary);
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;
    }
  }

  .footer {
    display: flex;
    align-items: center;
    gap: 20px;
    color: var(--el-text-color-secondary);
    font-size: 13px;

    ::v-deep(.el-button) {
      font-size: 13px;
      color: transparent;
      margin-left: 0;
    }
  }

  &:hover {
    background-color: var(--app-color-primary-transparent-7);

    .footer::v-deep(.el-button) {
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
