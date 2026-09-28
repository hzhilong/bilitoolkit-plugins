# 用户弹幕查询

BiliToolkit UI 插件。输入 Bilibili UID 后，可查询 Danmakus 第三方服务已经收录的直播弹幕记录，并在本地保存最近 20 个查询对象。

## 功能

- 按 UID 查询直播弹幕和互动记录
- 按直播间房间号或主播名称筛选全部历史场次
- 按关键词即时筛选当前已经加载的弹幕内容
- 按直播场次展示主播、标题、开播时间及弹幕内容
- 分页加载历史记录
- 可在 1–100 场之间自定义每次加载数量，并在结果顶部或底部继续加载
- 本地保存、单独删除或清空查询历史
- 支持取消仍在进行的首次查询

## 本地开发

需要 Node.js 22 和 pnpm。

```powershell
cd bilitoolkit-plugin-user-danmaku-search
pnpm install
pnpm dev
```

在 BiliToolkit 的插件开发模式中载入开发地址 `http://localhost:5174`。

## 构建

```powershell
pnpm check
pnpm build
```

构建产物位于 `dist`。发布到 npm 后，BiliToolkit 可根据 `package.json` 中的 `bilitoolkit-plugin`、名称及 `type:ui` 关键字识别并安装它。

## 数据与隐私

查询数据来自 Danmakus 的第三方接口，并非 Bilibili 官方接口，因此完整性和长期可用性取决于该服务。插件只把 UID、查询到的用户名和查询时间保存在当前设备的 BiliToolkit 插件数据库中，不会保存整份弹幕结果。
