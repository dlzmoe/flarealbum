<template>
  <div class="settings-container">
    <a-page-header
      title="我的设置"
      sub-title="个性化您的FlareAlbum体验"
    />
    
    <a-card title="通用设置">
      <a-form layout="vertical">
        <a-form-item label="默认复制格式">
          <a-radio-group v-model:value="copyFormat">
            <a-radio value="url">URL 链接</a-radio>
            <a-radio value="markdown">Markdown 格式</a-radio>
            <a-radio value="html">HTML 格式</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="默认上传路径">
          <a-input 
            v-model:value="defaultUploadPath"
            placeholder="例如: images/"
            addonAfter="/"
          />
        </a-form-item>
        
        <a-form-item label="自定义域名前缀">
          <a-input 
            v-model:value="customDomainPrefix"
            placeholder="例如: https://cdn.example.com"
            addonAfter="/"
          >
            <template #prefix>
              <info-circle-outlined />
            </template>
          </a-input>
          <div class="setting-tip">
            设置后，生成的图片链接将使用此域名替代默认的 R2 存储 URL。
            <a-tag v-if="customDomainPrefix" color="success">示例：{{ getExampleUrl() }}</a-tag>
          </div>
        </a-form-item>
        
        <a-form-item label="默认文件名处理">
          <a-radio-group v-model:value="defaultFileNameOption">
            <a-radio value="original">保留原始文件名</a-radio>
            <a-radio value="timestamp">使用时间戳替换</a-radio>
            <a-radio value="uuid">使用 UUID 替换</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="图片自动转换为WebP格式">
          <a-switch v-model:checked="convertToWebp" />
          <div class="setting-tip">
            启用后，上传的图片将自动转换为 WebP 格式，可以大幅减小文件体积并提高加载速度。
            <a-tag v-if="convertToWebp" color="success">体积减小约 30-70%</a-tag>
          </div>
        </a-form-item>
        
        <a-form-item label="WebP质量设置" v-if="convertToWebp">
          <a-slider 
            v-model:value="webpQuality" 
            :min="50" 
            :max="100" 
            :step="5"
            :marks="{
              50: '50%',
              75: '75%',
              100: '100%'
            }"
          />
          <div class="setting-tip">
            调整 WebP 转换的质量，数值越高质量越好，但文件越大。推荐 75%-85% 的设置可以平衡质量和体积。
          </div>
        </a-form-item>
        
        <a-form-item label="自动复制上传后的链接">
          <a-switch v-model:checked="autoCopy" />
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
        <a-typography-title :level="4">FlareAlbum</a-typography-title>
        <a-typography-paragraph>
          这是一个基于 Vue3 和 Ant Design Vue 构建的图床上传工具，专为 Cloudflare R2 存储设计。通过直观的界面，您可以轻松上传、管理和分享图片。
        </a-typography-paragraph>
        <a-typography-paragraph>
          <ul>
            <li>支持拖拽上传图片</li>
            <li>支持管理 R2 存储中的文件</li>
            <li>支持文件夹管理</li>
            <li>支持预览和分享图片</li>
            <li>支持自定义域名前缀</li>
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
import { useStore } from 'vuex'
import { InfoCircleOutlined } from '@ant-design/icons-vue'
import s3Service from '../services/s3Service'
import cacheService from '../services/cacheService'

const router = useRouter()
const store = useStore()

// 设置项
const copyFormat = ref('url')
const defaultUploadPath = ref('')
const defaultFileNameOption = ref('original')
const autoCopy = ref(true)
const customDomainPrefix = ref('') // 新增自定义域名前缀
const convertToWebp = ref(false)
const webpQuality = ref(75)

// 生成示例 URL
const getExampleUrl = () => {
  const domain = customDomainPrefix.value.trim().replace(/\/+$/, '')
  const path = defaultUploadPath.value.trim().replace(/^\/+|\/+$/g, '')
  const filename = 'example.jpg'
  
  if (domain) {
    if (path) {
      return `${domain}/${path}/${filename}`
    } else {
      return `${domain}/${filename}`
    }
  } else {
    return 'https://your-r2.example.com/example.jpg'
  }
}

// 保存设置
const saveSettings = () => {
  // 处理域名前缀，移除结尾的斜杠
  const domain = customDomainPrefix.value.trim().replace(/\/+$/, '')
  
  const settings = {
    copyFormat: copyFormat.value,
    defaultUploadPath: defaultUploadPath.value,
    defaultFileNameOption: defaultFileNameOption.value,
    autoCopy: autoCopy.value,
    customDomainPrefix: domain, // 保存自定义域名前缀
    convertToWebp: convertToWebp.value,
    webpQuality: webpQuality.value
  }
  
  // 使用 Vuex store action 保存设置
  store.dispatch('saveUserSettings', settings).then(() => {
    message.success('设置已保存并生效')
  })
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
  // 清除 Vuex 中的状态
  store.commit('setS3Config', null)
  store.commit('setUserSettings', null)
  
  // 清除 localStorage 中的数据
  localStorage.removeItem('s3ConfigData')
  localStorage.removeItem('userSettings')
  localStorage.removeItem('recentUploads')
  
  // 清除 cacheService 缓存
  cacheService.clearAllCache()
  
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
  // 从 Vuex 获取设置
  const storeSettings = store.state.userSettings

  if (storeSettings) {
    // 如果 store 中有设置，使用 store 中的设置
    copyFormat.value = storeSettings.copyFormat || 'url'
    defaultUploadPath.value = storeSettings.defaultUploadPath || ''
    defaultFileNameOption.value = storeSettings.defaultFileNameOption || 'original'
    autoCopy.value = storeSettings.autoCopy !== undefined ? storeSettings.autoCopy : true
    customDomainPrefix.value = storeSettings.customDomainPrefix || '' // 加载自定义域名前缀
    convertToWebp.value = storeSettings.convertToWebp !== undefined ? storeSettings.convertToWebp : false
    webpQuality.value = storeSettings.webpQuality || 75
  } else {
    // 尝试从 cacheService 加载
    const cachedSettings = cacheService.loadUserSettings()
    
    if (cachedSettings) {
      copyFormat.value = cachedSettings.copyFormat || 'url'
      defaultUploadPath.value = cachedSettings.defaultUploadPath || ''
      defaultFileNameOption.value = cachedSettings.defaultFileNameOption || 'original'
      autoCopy.value = cachedSettings.autoCopy !== undefined ? cachedSettings.autoCopy : true
      customDomainPrefix.value = cachedSettings.customDomainPrefix || '' // 加载自定义域名前缀
      convertToWebp.value = cachedSettings.convertToWebp !== undefined ? cachedSettings.convertToWebp : false
      webpQuality.value = cachedSettings.webpQuality || 75
      
      // 同步到 Vuex
      store.commit('setUserSettings', cachedSettings)
    } else {
      // 最后尝试从 localStorage 加载（兼容旧版本）
      const storedSettings = localStorage.getItem('userSettings')
      
      if (storedSettings) {
        try {
          const settings = JSON.parse(storedSettings)
          copyFormat.value = settings.copyFormat || 'url'
          defaultUploadPath.value = settings.defaultUploadPath || ''
          defaultFileNameOption.value = settings.defaultFileNameOption || 'original'
          autoCopy.value = settings.autoCopy !== undefined ? settings.autoCopy : true
          customDomainPrefix.value = settings.customDomainPrefix || '' // 加载自定义域名前缀
          convertToWebp.value = settings.convertToWebp !== undefined ? settings.convertToWebp : false
          webpQuality.value = settings.webpQuality || 75
          
          // 同步到 Vuex
          store.commit('setUserSettings', settings)
        } catch (e) {
          console.error('无法解析存储的设置：', e)
        }
      }
    }
  }
})
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
}

.setting-tip {
  color: #666;
  font-size: 12px;
  margin-top: 4px;
}
</style>