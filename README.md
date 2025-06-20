# FlareAlbum

<p align="center">
  <img src="https://raw.githubusercontent.com/dlzmoe/flarealbum-assets/main/logo.png" alt="FlareAlbum Logo" width="200">
</p>

<p align="center">
  <strong>便捷、高效的 Cloudflare R2 图床管理工具</strong>
</p>

<p align="center">
  <a href="#特性">特性</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#使用指南">使用指南</a> •
  <a href="#环境要求">环境要求</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#许可证">许可证</a>
</p>

## 简介

FlareAlbum 是一个基于 Vue 3 和 Ant Design Vue 构建的图床管理工具，专为 Cloudflare R2 存储设计。通过直观的界面，您可以轻松上传、管理和分享图片，同时获得 Cloudflare CDN 的全球加速优势。

## 特性

- **简单配置** - 轻松配置 S3 兼容的 Cloudflare R2 存储桶
- **高效上传** - 支持拖拽上传、批量上传，自定义路径和文件名
- **文件管理** - 文件夹结构管理，预览、删除和复制图片链接
- **自定义域名** - 支持配置自定义域名，优化图片访问链接
- **本地缓存** - 智能缓存机制，提高浏览和管理效率
- **响应式设计** - 适配各种屏幕尺寸，支持列表/网格视图切换
- **安全存储** - 存储桶配置本地加密存储，不泄露敏感信息

## 快速开始

### 安装

```bash
# 克隆项目
git clone https://github.com/yourusername/flarealbum.git

# 进入项目目录
cd flarealbum

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建

```bash
# 构建生产版本
npm run build
```

## 使用指南

### 1. S3 配置

首先配置您的 Cloudflare R2 存储：

- 导航至 `S3 配置` 页面
- 填写以下信息：
  - 终端节点 URL（例如：`https://<account-id>.r2.cloudflarestorage.com`）
  - 存储桶名称
  - Access Key ID
  - Secret Access Key
  - 区域（通常为 `auto`）

### 2. 上传图片

- 导航至 `上传图片` 页面
- 选择或拖拽文件到上传区域
- 设置上传路径和文件命名规则
- 点击 `开始上传` 按钮

### 3. 管理图片

- 导航至 `图床管理` 页面
- 浏览文件夹和图片
- 支持预览、复制链接和删除操作
- 支持列表/网格视图切换

### 4. 个性化设置

- 导航至 `我的设置` 页面
- 配置默认上传路径
- 设置自定义域名前缀
- 选择默认复制格式（URL/Markdown/HTML）
- 设置文件命名规则

## 环境要求

- Node.js 16.0+
- 现代浏览器（Chrome, Firefox, Safari, Edge）
- Cloudflare R2 存储桶及访问凭证

## 技术栈

- [Vue 3](https://v3.vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Ant Design Vue](https://antdv.com/) - 企业级 UI 组件库
- [AWS SDK for JavaScript](https://aws.amazon.com/sdk-for-javascript/) - S3 操作 SDK

## 贡献

欢迎贡献代码、报告问题或提出新功能建议！请查看 [贡献指南](CONTRIBUTING.md) 了解更多信息。

## 许可证

[MIT](LICENSE)

---

<p align="center">
  由 <a href="https://github.com/dlzmoe">dlzmoe</a> 开发维护
</p>