<script setup lang="ts"></script>
<template>
  <el-card shadow="never" class="abort-view">
    <template #header> </template>

    <el-alert
      type="warning"
      :closable="false"
      show-icon
      title="使用本插件前，请仔细阅读以下内容。继续使用即表示您已阅读并同意相关说明。"
      style="margin-bottom: 20px"
    />

    <section class="section">
      <h3>免责声明</h3>

      <ul>
        <li>使用本插件产生的一切后果由使用者自行承担。</li>
        <li>本项目仅供学习、研究和技术交流使用，请勿将其用于任何违反法律法规、版权规定或平台规则的用途。</li>
        <li>本项目不提供任何音视频资源的上传、存储、分发、分享或在线播放服务。</li>
        <li>本插件仅对用户具有合法访问权限的内容提供资源获取能力，不提供任何未经授权内容的访问能力。</li>
        <li>本插件获取的音视频、字幕、弹幕、封面等资源均来源于哔哩哔哩，其著作权及相关权益归原权利人所有。</li>
        <li>未经权利人许可，不得传播、分享、公开展示、商业使用或用于其他侵犯他人合法权益的用途。</li>
        <li>因使用本插件产生的版权纠纷、侵权纠纷或其他法律责任，均由使用者自行承担，与本项目及作者无关。</li>
        <li>本项目与哔哩哔哩官方无任何关联。</li>
      </ul>
    </section>

    <section class="section">
      <h3>项目边界</h3>

      <ul>
        <li>不提供账号、Cookie 或任何身份凭据。</li>
        <li>不绕过登录、会员、付费等访问控制。</li>
        <li>不破解或绕过 DRM（数字版权保护）机制。</li>
        <li>不绕过平台风控、人机验证、验证码或其他安全机制。</li>
        <li>不伪造官方客户端身份、设备指纹或签名鉴权。</li>
        <li style="color: red">
          仅支持下载 UP 主发布的普通视频，不支持付费课程、番剧、电视剧、电影、纪录片等受限制内容的下载。
        </li>
        <li>遇到平台风控、访问限制或鉴权失败时，将停止相关操作，而非尝试绕过限制。</li>
      </ul>
    </section>

    <el-divider />

    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="继续使用本插件，即表示您已阅读并同意上述内容，并承诺遵守相关法律法规、版权规定及平台用户协议。"
    />
  </el-card>
</template>

<style scoped lang="scss">
.abort-view {
  margin: 0px auto !important;
  padding: 0 !important;
  border: unset !important;

  ::v-deep(.el-card__header) {
    padding: 4px 0 !important;
  }
}

.section {
  margin-top: 8px;
  h3 {
    margin: 0 0 12px;
    font-size: 16px;
  }
  ul {
    margin: 0;
    padding-left: 20px;
    li {
      margin: 8px 0;
      line-height: 1;
    }
  }
}
</style>
