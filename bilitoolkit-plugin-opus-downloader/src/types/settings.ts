import type { DownloadResourceType } from '@/types/download'

export interface AppSettings {
  downloadResourceTypes: DownloadResourceType[]
  mdLocalImages: boolean
  /** md 文档是否在开头添加来源信息 */
  mdPrependAttribution: boolean
  turndownOptions: {
    /**
     * 标题样式。
     * - `'setext'`：一级标题（H1）使用 `===` 下划线，二级标题（H2）使用 `---` 下划线（仅支持 H1/H2，其余级仍用 `#`）。
     * - `'atx'`：所有级别标题均使用 `#` 符号（H1 → `# `，H2 → `## `，依此类推）。
     * @default 'setext'
     */
    headingStyle: 'setext' | 'atx'

    /**
     * 水平分割线的 Markdown 表示。
     * 常用的分隔符包括 `---`、`***`、`___`，可自定义任意字符串（需符合 CommonMark 分隔线规则）。
     * @default '---'
     */
    hr: string

    /**
     * 换行符（`<br>`）的转换方式。
     * 通常为结尾添加两个空格或直接输出换行，Turndown 默认输出 `  `（两个空格 + 换行）以保留硬换行。
     * 可自定义为任意字符串（例如 `'\n'` 或 `'  \n'`）。
     * @default '  \n'
     */
    br: string

    /**
     * 无序列表的项目符号。
     * 可选 `'-'`、`'+'` 或 `'*'`，影响所有无序列表项的前缀。
     * @default '*'
     */
    bulletListMarker: '-' | '+' | '*'

    /**
     * 代码块样式。
     * - `'indented'`：使用缩进（每行前加 4 个空格）表示代码块。
     * - `'fenced'`：使用围栏（如 ` ``` `）包裹代码块。
     * @default 'indented'
     */
    codeBlockStyle: 'indented' | 'fenced'

    /**
     * 斜体（强调）的定界符。
     * 可选 `'_'` 或 `'*'`，用于包裹斜体文本。
     * @default '_'
     */
    emDelimiter: '_' | '*'

    /**
     * 围栏代码块的界定符（当 `codeBlockStyle: 'fenced'` 时生效）。
     * 可选 `'```'` 或 `'~~~'`，用于标记代码块开始和结束。
     * @default '```'
     */
    fence: '```' | '~~~'

    /**
     * 加粗（强强）的定界符。
     * 可选 `'__'` 或 `'**'`，用于包裹加粗文本。
     * @default '**'
     */
    strongDelimiter: '__' | '**'

    /**
     * 链接样式。
     * - `'inlined'`：内联链接，格式为 `[text](url)`。
     * - `'referenced'`：引用链接，格式为 `[text][id]`，并在文末定义 `[id]: url`。
     * @default 'inlined'
     */
    linkStyle: 'inlined' | 'referenced'

    /**
     * 引用链接的引用样式（当 `linkStyle: 'referenced'` 时生效）。
     * - `'full'`：完整引用 `[text][id]`。
     * - `'collapsed'`：折叠引用 `[text][]`（允许省略 `id`）。
     * - `'shortcut'`：快捷引用 `[text]`（即省略 `[]`）。
     * @default 'full'
     */
    linkReferenceStyle: 'full' | 'collapsed' | 'shortcut'

    /**
     * 是否保留 `<pre>` 和 `<code>` 标签内的空白（缩进、换行）不变。
     * 若为 `true`，则不会对代码内容进行额外折叠或修剪，适合保留严格格式的代码。
     * @default false
     */
    preformattedCode: boolean
  }
}
