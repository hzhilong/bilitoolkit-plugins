import TurndownService from 'turndown'

export class OpusMdConverter {
  private readonly turndown: TurndownService

  constructor(options: TurndownService.Options) {
    this.turndown = new TurndownService(options)
    this.addRules()
  }

  async convert(container: Element): Promise<string> {
    const root = container.cloneNode(true) as Element
    this.removeIgnoredElements(root)
    return this.turndown.turndown(root.innerHTML)
  }

  private addRules(): void {
    // 富文本编辑器代码块
    this.turndown.addRule('customComplexCodeBlock', {
      // 代码块的最外层容器 div
      filter: (node) => {
        return node.nodeName === 'DIV' && node.classList.contains('code-block-container')
      },

      // 内部重写提取逻辑
      replacement: (content, node) => {
        // 精准查找容器内部的 code 标签
        const codeNode = node.querySelector('code.hljs')
        if (!codeNode) return '' // 容错处理

        // 使用 textContent 彻底隔离外部行号、复制成功等噪音
        const rawCode = codeNode.textContent.trim()

        //  兼容逻辑 1：如果用户设置了缩进式代码块 (indented)
        if (this.turndown.options.codeBlockStyle === 'indented') {
          // 缩进式代码块不能写语言名称，每行代码前必须加 4 个空格
          const indentedCode = rawCode
            .split('\n')
            .map((line) => '    ' + line)
            .join('\n')
          return '\n\n' + indentedCode + '\n\n'
        }

        //  兼容逻辑 2：用户设置了围栏式代码块 (fenced，默认值)
        // 动态提取语言类型 (如 javascript)
        const className = codeNode.getAttribute('class') || ''
        const langMatch = className.match(/(?:lang|language)-(\w+)/)
        const language = langMatch ? langMatch[1] : ''

        // 读取用户配置的围栏符号（如 ``` 或 ~~~）
        const fence = this.turndown.options.fence || '```'

        return `\n\n${fence}${language}\n${rawCode}\n${fence}\n\n`
      },
    })

    // 表情包
    this.turndown.addRule('emojiImage', {
      filter: (node) => {
        return node.nodeName === 'IMG' && !!node.parentElement?.classList.contains('opus-text-rich-emoji')
      },

      replacement(_content, node) {
        const img = node as HTMLImageElement
        const alt = img.alt.replace(/^\[|\]$/g, '')
        const src = img.getAttribute('src') ?? ''

        return `![${alt}](${src})`
      },
    })

    // 投票
    this.turndown.addRule('biliVoteCard', {
      filter(node) {
        return node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).classList.contains('vote-card-container')
      },

      replacement(_content, node) {
        const root = node as HTMLElement

        const titleElement = root.querySelector('.vote-card-title')
        const title = titleElement?.textContent?.trim() ?? ''

        const multiTag = titleElement?.querySelector('.vote-card-multi-tag')?.textContent?.trim() ?? ''

        const desc = root.querySelector('.vote-card-desc-text')?.textContent?.trim() ?? ''

        const hasImages = root.querySelector('.vote-card-options.has-images') !== null

        const joinNum = root.querySelector('.vote-card-join-num')?.textContent?.trim() ?? ''

        const endTime = root.querySelector('.vote-card-end-time')?.textContent?.trim() ?? ''

        const result: string[] = []

        // 标题
        if (title) {
          const titleText = multiTag ? `${multiTag} · ${title}` : title

          result.push(`> **${titleText}**`)
        }

        // 说明
        if (desc) {
          result.push(`>`, `> ${desc}`)
        }

        if (hasImages) {
          const options = Array.from(root.querySelectorAll('.vote-card-option'))

          for (const option of options) {
            const image = option.querySelector('.vote-option-image') as HTMLImageElement | null

            const label = option.querySelector('.vote-option-label-desc')?.textContent?.trim() ?? ''

            if (image?.getAttribute('src')) {
              result.push(`>`, `> ![](${image.getAttribute('src')})`)
            }

            if (label) {
              result.push(`>`, `> ${label}`)
            }
          }
        } else {
          // 普通文字投票
          const options = Array.from(root.querySelectorAll('.vote-card-option .vote-option-desc'))
            .map((el) => el.textContent?.trim() ?? '')
            .filter(Boolean)

          if (options.length) {
            result.push(`>`)

            for (const option of options) {
              result.push(`> - ${option}`)
            }
          }
        }

        // 投票信息
        const footer = [joinNum, endTime].filter(Boolean).join(' · ')

        if (footer) {
          result.push(`>`, `> *${footer}*`)
        }

        return `\n\n${result.join('\n')}\n\n`
      },
    })

    // 视频
    this.turndown.addRule('biliVideoCard', {
      filter(node) {
        return node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).classList.contains('video-card')
      },

      replacement(_content, node) {
        const root = node as HTMLElement
        const player = root.querySelector('.video-player-container')
        const cover = root.querySelector('.video-player-cover') as HTMLElement | null
        const title = root.querySelector('.video-card-player-title')?.textContent?.trim() ?? ''

        const playCount = root.querySelector('.play-count')?.textContent?.trim() ?? ''

        const danmakuCount = root.querySelector('.danmaku-count')?.textContent?.trim() ?? ''

        const duration = root.querySelector('.video-player-duration')?.textContent?.trim() ?? ''

        const bv = player?.id.match(/video-player-(BV[\S]+)/)?.[1]

        // 从 background-image 中提取图片地址
        const coverUrl = cover?.style.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/)?.[1] ?? ''

        const result: string[] = []

        if (title) {
          if (bv) {
            result.push(`> 🎬 [${title}](https://www.bilibili.com/video/${bv})`)
          } else {
            result.push(`> 🎬 ${title}`)
          }
        }

        const stats = [duration, playCount, danmakuCount].filter(Boolean).join(' · ')

        if (stats) {
          result.push(`>`, `> ${stats}`)
        }

        if (coverUrl) {
          result.push(`>`, `> ![](${coverUrl})`)
        }

        return `\n\n${result.join('\n')}\n\n`
      },
    })

    // 图文
    this.turndown.addRule('biliOpusCard', {
      filter(node) {
        return (
          node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).matches('a.eva3-card-renderer:has(.opus-card)')
        )
      },

      replacement(_content, node) {
        const root = (node as HTMLElement).querySelector<HTMLElement>('.opus-card')

        if (!root) return ''

        const link = root.closest('a') as HTMLAnchorElement | null

        const title = root.querySelector('.opus-title')?.textContent?.trim() ?? ''

        const tag = root.querySelector('.opus-tag')?.textContent?.trim() ?? ''

        const author = root.querySelector('.opus-author')?.textContent?.trim() ?? ''

        const stats = Array.from(root.querySelectorAll('.opus-stats .stat-item'))
          .map((el) => el.textContent?.trim() ?? '')
          .filter(Boolean)
          .join(' · ')

        const image = root.querySelector('.opus-cover img') as HTMLImageElement | null

        const result: string[] = []

        if (title) {
          result.push(`> 📝 [${title}](${link?.getAttribute('href') ?? ''})`)
        }

        const meta = [tag, author].filter(Boolean).join(' · ')

        if (meta) {
          result.push(`>`, `> ${meta}`)
        }

        if (stats) {
          result.push(`>`, `> ${stats}`)
        }

        if (image?.getAttribute('src')) {
          result.push(`>`, `> ![](${image.getAttribute('src')})`)
        }

        return `\n\n${result.join('\n')}\n\n`
      },
    })

    // 直播
    this.turndown.addRule('biliLiveCard', {
      filter(node) {
        return node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).classList.contains('link-card-live')
      },

      replacement(_content, node) {
        const root = node as HTMLElement

        const title = root.querySelector('.link-card-live__title')?.textContent?.trim() ?? ''

        const status = root.querySelector('.link-card-live__tag span')?.textContent?.trim() ?? ''

        const author = root.querySelector('.link-card-live__subtitle span')?.textContent?.trim() ?? ''

        const desc = Array.from(root.querySelectorAll('.link-card-live__desc span'))
          .map((el) => el.textContent?.trim() ?? '')
          .filter(Boolean)
          .join(' · ')

        const image = root.querySelector('.link-card-live__cover img') as HTMLImageElement | null

        const result: string[] = []

        if (status) {
          result.push(`> 🔴 **${status}**`)
        }

        if (title) {
          result.push(`>`, `> **${title}**`)
        }

        const meta = [author, desc].filter(Boolean).join(' · ')

        if (meta) {
          result.push(`>`, `> ${meta}`)
        }

        if (image?.getAttribute('src')) {
          result.push(`>`, `> ![](${image.getAttribute('src')})`)
        }

        return `\n\n${result.join('\n')}\n\n`
      },
    })

    // 评论
    this.turndown.addRule('biliCommentCard', {
      filter(node) {
        return node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).classList.contains('comment-card')
      },

      replacement(_content, node) {
        const root = node as HTMLElement

        const author = root.querySelector('.author-name')?.textContent?.trim() ?? ''

        const replyAuthor = root.querySelector('.reply-author')?.textContent?.trim() ?? ''

        const replyText = root.querySelector('.reply-text')?.textContent?.trim() ?? ''

        const commentText = root.querySelector('.comment-text')?.textContent?.trim() ?? ''

        const likeCount = root.querySelector('.like-count')?.textContent?.trim() ?? ''

        const sourceTitle = root.querySelector('.source-title')?.textContent?.trim() ?? ''

        const result: string[] = []

        if (author) {
          result.push(`> 💬 **${author}**`)
        }

        if (replyAuthor && replyText) {
          result.push(
            `>`,
            `> 回复 **${replyAuthor}**：`,
            `>`,
            ...replyText.split('\n').map((line) => `> > ${line.trim()}`),
          )
        }

        if (commentText) {
          result.push(`>`, `> ${commentText}`)
        }

        if (likeCount) {
          result.push(`>`, `> 👍 ${likeCount} · 围观讨论`)
        }

        if (sourceTitle) {
          result.push(`>`, `> 来源：**${sourceTitle}**`)
        }

        return `\n\n${result.join('\n')}\n\n`
      },
    })

    // 名片
    this.turndown.addRule('biliUserCard', {
      filter(node) {
        return node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).classList.contains('opus-user-node')
      },

      replacement(_content, node) {
        const root = node as HTMLElement

        const link = root.querySelector('.opus-user-node__inner') as HTMLAnchorElement | null

        const name = root.querySelector('.opus-user-node__name')?.textContent?.trim() ?? ''

        if (!name) {
          return ''
        }

        const href = link?.getAttribute('href') ?? ''

        return href ? `[${name}](${href})` : name
      },
    })
  }

  private removeIgnoredElements(_root: Element): void {
    this.turndown.remove((node) => {
      if (node.nodeName !== 'DIV') return false
      if (!node.classList.contains('eva3-card-error')) return false
      const style = node.getAttribute('style') || ''
      return style.includes('display: none') || style.includes('display:none')
    })
  }
}
