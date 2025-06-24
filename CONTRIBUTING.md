# 贡献指南

感谢您对 R2 图片托管项目的关注！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- 🎨 优化用户界面

## 项目简介

R2 图片托管是一个基于 Vue 3 + Ant Design Vue 的现代化图片管理工具，支持：

- 📤 图片上传到 Cloudflare R2 存储
- 🗂️ 文件夹管理和路径选择
- 🖼️ 图片预览和管理
- 🔗 自定义域名支持
- 💾 智能缓存机制
- 🎯 WebP 格式转换

## 开发环境设置

### 前置要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0
- Git

### 本地开发

1. **克隆项目**
   ```bash
   git clone https://github.com/ezyshu/flarealbum.git
   cd flarealbum
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或
   yarn install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   # 或
   yarn dev
   ```

4. **构建生产版本**
   ```bash
   npm run build
   # 或
   yarn build
   ```

## 项目结构

```
flarealbum/
├── public/                 # 静态资源
├── src/
│   ├── assets/            # 项目资源文件
│   ├── components/        # Vue 组件
│   ├── router/           # 路由配置
│   ├── services/         # 服务层（S3、缓存等）
│   ├── views/            # 页面组件
│   ├── App.vue           # 根组件
│   ├── main.js           # 入口文件
│   └── style.css         # 全局样式
├── index.html            # HTML 模板
├── package.json          # 项目配置
├── vite.config.js        # Vite 配置
└── README.md             # 项目说明
```

## 代码规范

### Vue 组件规范

- 使用 Vue 3 Composition API
- 组件名使用 PascalCase
- 文件名使用 PascalCase
- 使用 `<script setup>` 语法

```vue
<template>
  <div class="component-name">
    <!-- 模板内容 -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'

// 响应式数据
const data = ref([])

// 计算属性
const computedValue = computed(() => {
  return data.value.length
})

// 生命周期
onMounted(() => {
  // 初始化逻辑
})

// 方法
const handleClick = () => {
  message.success('操作成功')
}
</script>

<style scoped>
.component-name {
  /* 样式 */
}
</style>
```

### JavaScript 规范

- 使用 ES6+ 语法
- 优先使用 `const` 和 `let`，避免 `var`
- 使用箭头函数
- 使用模板字符串
- 使用解构赋值

```javascript
// ✅ 推荐
const { name, age } = user
const fullName = `${firstName} ${lastName}`
const handleSubmit = async () => {
  try {
    const result = await api.submit(data)
    return result
  } catch (error) {
    console.error('提交失败：', error)
  }
}

// ❌ 避免
var userName = user.name
var userAge = user.age
var fullName = firstName + ' ' + lastName
function handleSubmit() {
  // 旧式函数声明
}
```

### CSS 规范

- 使用 BEM 命名规范
- 优先使用 CSS 变量
- 使用 scoped 样式
- 避免深层嵌套

```css
/* ✅ 推荐 */
.upload-container {
  max-width: 1200px;
  margin: 0 auto;
}

.upload-form__item {
  margin-bottom: 16px;
}

.upload-form__item--error {
  border-color: var(--error-color);
}

/* ❌ 避免 */
.upload-container .upload-form .upload-form-item {
  /* 深层嵌套 */
}
```

## 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 提交类型

- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 提交示例

```bash
# 新功能
git commit -m "feat: 添加图片批量上传功能"

# 修复 Bug
git commit -m "fix: 修复路径显示重复斜杠问题"

# 文档更新
git commit -m "docs: 更新安装说明"

# 代码重构
git commit -m "refactor: 重构缓存服务逻辑"
```

## 工作流程

### 1. 创建 Issue

在开始工作之前，请先创建一个 Issue 来描述您要解决的问题或新功能。

### 2. Fork 项目

点击 GitHub 页面右上角的 "Fork" 按钮，将项目复制到您的账户。

### 3. 创建分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

### 4. 开发

- 编写代码
- 添加测试（如果适用）
- 确保代码符合规范
- 测试功能是否正常工作

### 5. 提交代码

```bash
git add .
git commit -m "feat: 添加新功能描述"
git push origin feature/your-feature-name
```

### 6. 创建 Pull Request

1. 在 GitHub 上创建 Pull Request
2. 填写 PR 描述，说明变更内容
3. 关联相关 Issue
4. 等待代码审查

## 测试

### 运行测试

```bash
npm run test
# 或
yarn test
```

### 手动测试清单

在提交 PR 之前，请确保：

- [ ] 功能正常工作
- [ ] 没有控制台错误
- [ ] 响应式设计正常
- [ ] 不同浏览器兼容性
- [ ] 性能没有明显下降

## 常见问题

### Q: 如何配置 Cloudflare R2？

A: 请参考 [README.md](./README.md) 中的配置说明。

### Q: 如何添加新的页面？

A: 
1. 在 `src/views/` 目录下创建新的 Vue 组件
2. 在 `src/router/index.js` 中添加路由配置
3. 在导航菜单中添加链接

### Q: 如何修改样式？

A: 
1. 对于组件特定样式，使用 `<style scoped>`
2. 对于全局样式，修改 `src/style.css`
3. 使用 Ant Design Vue 的主题变量进行自定义

## 行为准则

我们致力于为每个人提供友好、安全和欢迎的环境。请：

- 尊重所有贡献者
- 使用包容性语言
- 接受建设性批评
- 关注社区利益
- 对其他社区成员表现出同理心

## 许可证

通过提交代码，您同意您的贡献将在 [Apache-2.0 license](./LICENSE) 下发布。

## 联系方式

如果您有任何问题或建议，请：

- 创建 [Issue](../../issues)
- 发送邮件到项目维护者
- 参与项目讨论

感谢您的贡献！🎉
