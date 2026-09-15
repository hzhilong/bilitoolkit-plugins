/* eslint-disable @typescript-eslint/no-explicit-any */

import { formatTime, getErrorMessage } from '@ybgnb/utils'
import { getCommentUrl, type BiliCommentEntity } from 'bili-comment-core'

/**
 * 飞书自定义机器人推送工具类
 * 支持签名校验、文本、富文本、消息卡片等多种消息格式
 */
export class FeiShuBot {
  private readonly webhookUrl: string
  private readonly secret: string | null

  constructor(webhookUrl: string, secret?: string) {
    this.webhookUrl = webhookUrl
    this.secret = secret ?? null
  }

  /**
   * 生成签名（完全遵循飞书官方规范）
   * 核心逻辑：使用 `${timestamp}\n${secret}` 作为HMAC-SHA256的密钥，对空字符串签名，结果Base64编码 12
   */
  async genSign(timestamp: number): Promise<string> {
    if (!this.secret) {
      throw new Error('未设置签名密钥(secret)，无法生成签名')
    }

    // 1. 拼接签名字符串：timestamp + "\n" + secret
    // 参考飞书官方示例，这是与常规HMAC用法的主要区别 1
    const stringToSign = `${timestamp}\n${this.secret}`
    const encoder = new TextEncoder()

    try {
      // 2. 将签名字符串作为HMAC密钥导入
      // 这与飞书官方文档的示例保持一致 12
      const keyData = encoder.encode(stringToSign)
      const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: { name: 'SHA-256' } }, false, [
        'sign',
      ])

      // 3. 对空消息体（空字节）进行签名
      const signature = await crypto.subtle.sign('HMAC', key, new Uint8Array(0))

      // 4. Base64编码签名结果
      const signString = String.fromCharCode(...new Uint8Array(signature))
      return btoa(signString)
    } catch (error) {
      console.error('签名生成失败:', error)
      throw new Error(`飞书签名生成异常: ${getErrorMessage(error)}`)
    }
  }

  /**
   * 核心发送方法
   */
  private async sendRequest(payload: Record<string, any>): Promise<boolean> {
    const timestamp = Math.floor(Date.now() / 1000) // 秒级时间戳 1
    const body: Record<string, any> = {
      timestamp: String(timestamp),
      ...payload,
    }

    // 如果配置了签名，则计算并附加
    if (this.secret) {
      const sign = await this.genSign(timestamp)
      body.sign = sign
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.code !== 0) {
        // 解析常见错误码
        switch (result.code) {
          case 19001:
            throw new Error(`签名校验失败: ${result.msg}。请检查 secret 和时间戳是否正确，注意时间戳单位为秒 12`)
          case 19002:
            throw new Error(`请求频率超限: ${result.msg}。建议控制在 100次/分钟，5次/秒 2`)
          case 10205:
            throw new Error(`关键词校验失败: ${result.msg}。消息内容需包含已设置的自定义关键词之一 5`)
          default:
            throw new Error(`飞书API错误 (${result.code}): ${result.msg}`)
        }
      }

      console.log('飞书消息发送成功')
      return true
    } catch (error) {
      console.error('发送请求失败:', error)
      throw error
    }
  }

  /** 发送文本消息 (msgtype: text) */
  async sendText(content: string): Promise<boolean> {
    return this.sendRequest({
      msg_type: 'text', // 注意：部分旧版API使用 msgtype，这里使用新版规范 2
      content: { text: content },
    })
  }

  /** 发送富文本消息 (msgtype: post) */
  async sendRichText(title: string, paragraphs: Array<Array<Record<string, any>>>): Promise<boolean> {
    // 富文本消息格式参考 25
    return this.sendRequest({
      msg_type: 'post',
      content: {
        post: {
          zh_cn: {
            title: title,
            content: paragraphs,
          },
        },
      },
    })
  }

  /** 发送交互式卡片消息 (msgtype: interactive) */
  async sendCard(cardContent: Record<string, any>): Promise<boolean> {
    // 卡片消息体结构 5
    return this.sendRequest({
      msg_type: 'interactive',
      card: cardContent,
    })
  }

  /** 发送图片消息 (msgtype: image) */
  async sendImage(imageKey: string): Promise<boolean> {
    // 需要先通过上传图片接口获取image_key 2
    return this.sendRequest({
      msg_type: 'image',
      content: { image_key: imageKey },
    })
  }

  async sendMonitorResultByPost(configName: string, items: Array<BiliCommentEntity>): Promise<boolean> {
    // 构建富文本段落
    const paragraphs: Array<Array<Record<string, any>>> = []

    paragraphs.push([{ tag: 'text', text: '--------------' }])

    if (items.length === 0) {
      paragraphs.push([{ tag: 'text', text: '暂无新增评论' }])
    } else {
      for (let index = 0; index < items.length; index++) {
        const item = items[index]
        // 每条评论由多个段落组成
        paragraphs.push([{ tag: 'text', text: `${index + 1}. ${item.senderName} (UID: ${item.senderUid})\n` }])
        paragraphs.push([
          {
            tag: 'a',
            text: `${item.content}\n`,
            href: getCommentUrl(item),
          },
        ])
        paragraphs.push([{ tag: 'text', text: `${formatTime(item.ctime)}` }])

        if (index < items.length - 1) {
          paragraphs.push([{ tag: 'text', text: '--------------' }])
        }
      }
    }

    return await this.sendRichText(`评论提醒 - ${configName}`, paragraphs)
  }
}
