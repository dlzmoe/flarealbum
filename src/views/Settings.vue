<template>
  <div class="settings-container">
    <a-page-header
      title="我的设置"
      sub-title="个性化您的使用体验"
    />
    
    <a-card title="通用设置">
      <a-form layout="vertical">
        <a-form-item label="默认复制格式">
          <a-radio-group v-model="copyFormat">
            <a-radio value="url">URL 链接</a-radio>
            <a-radio value="markdown">Markdown 格式</a-radio>
            <a-radio value="html">HTML 格式</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="默认上传路径">
          <a-input 
            v-model="defaultUploadPath"
            placeholder="例如: images/"
            addonAfter="/"
          />
        </a-form-item>
        
        <a-form-item label="默认文件名处理">
          <a-radio-group v-model="defaultFileNameOption">
            <a-radio value="original">保留原始文件名</a-radio>
            <a-radio value="timestamp">添加时间戳前缀</a-radio>
            <a-radio value="uuid">使用 UUID 替换</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="自动复制上传后的链接">
          <a-switch v-model="autoCopy" />
        </a-form-item>
        
        <a-form-item>
          <a-button type="primary" @click="saveSettings">保存设置</a-button>
        </a-form-item>
      </a-form>
    </a-card>
    
    <a-card title="数据管理" style="margin-top: 16px">
      <a-space direction="vertical" style="width: 100%">
        <a-alert 
          type="info" 
          show-icon
          message="清除配置会删除您存储的所有设置和上传历史"
        />
        
        <a-button danger @click="showClearDataConfirm">
          清除所有数据
        </a-button>
      </a-space>
    </a-card>
    
    <a-card title="关于" style="margin-top: 16px">
      <a-typography>
        <a-typography-title :level="4">R2 图床上传工具</a-typography-title>
        <a-typography-paragraph>
          这是一个基于 Vue3 和 Ant Design Vue 构建的图床上传工具，支持上传图片到 Cloudflare R2 存储桶。
        </a-typography-paragraph>
        <a-typography-paragraph>
          <ul>
            <li>支持拖拽上传图片</li>
            <li>支持管理 R2 存储中的文件</li>
            <li>支持文件夹管理</li>
            <li>支持预览和分享图片</li>
          </ul>
        </a-typography-paragraph>
        <a-typography-paragraph>
          <a-tag color="processing">Vue 3</a-tag>
          <a-tag color="success">Vite</a-tag>
          <a-tag color="warning">Cloudflare R2</a-tag>
          <a-tag color="error">S3 API</a-tag>
        </a-typography-paragraph>
      </a-typography>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'

const router = useRouter()

// 设置项
const copyFormat = ref('url')
const defaultUploadPath = ref('')
const defaultFileNameOption = ref('original')
const autoCopy = ref(true)

// 保存设置
const saveSettings = () => {
  const settings = {
    copyFormat: copyFormat.value,
    defaultUploadPath: defaultUploadPath.value,
    defaultFileNameOption: defaultFileNameOption.value,
    autoCopy: autoCopy.value
  }
  
  // 保存到本地存储
  localStorage.setItem('userSettings', JSON.stringify(settings))
  message.success('设置已保存')
}

// 显示清除数据确认
const showClearDataConfirm = () => {
  Modal.confirm({
    title: '确定要清除所有数据吗？',
    content: '这将删除您的所有配置和上传历史记录，此操作不可恢复。',
    okText: '确定清除',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      clearAllData()
    }
  })
}

// 清除所有数据
const clearAllData = () => {
  localStorage.removeItem('s3Config')
  localStorage.removeItem('userSettings')
  localStorage.removeItem('recentUploads')
  
  message.success('所有数据已清除')
  
  // 重定向到上传页面
  setTimeout(() => {
    router.push('/upload')
    // 刷新页面以确保状态重置
    window.location.reload()
  }, 1000)
}

// 组件挂载时加载设置
onMounted(() => {
  const storedSettings = localStorage.getItem('userSettings')
  
  if (storedSettings) {
    try {
      const settings = JSON.parse(storedSettings)
      copyFormat.value = settings.copyFormat || 'url'
      defaultUploadPath.value = settings.defaultUploadPath || ''
      defaultFileNameOption.value = settings.defaultFileNameOption || 'original'
      autoCopy.value = settings.autoCopy !== undefined ? settings.autoCopy : true
    } catch (e) {
      console.error('无法解析存储的设置：', e)
    }
  }
})
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
}
</style> 