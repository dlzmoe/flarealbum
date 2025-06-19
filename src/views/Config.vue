<template>
  <div class="config-container">
    <a-card title="S3/R2存储配置" class="config-card">
      <a-form
        :model="formState"
        :rules="rules"
        layout="vertical"
        ref="formRef"
        @finish="onFinish"
        validate-trigger="blur"
      >
        <a-form-item name="endpoint" label="终端节点URL">
          <a-input 
            v-model:value="formState.endpoint" 
            placeholder="例如: https://xxxxx.r2.cloudflarestorage.com" 
            @blur="() => formRef?.validateFields(['endpoint'])"
          />
        </a-form-item>
        
        <a-form-item name="region" label="区域">
          <a-input 
            v-model:value="formState.region" 
            placeholder="R2通常为'auto'" 
          />
        </a-form-item>
        
        <a-form-item name="bucket" label="存储桶名称">
          <a-input 
            v-model:value="formState.bucket" 
            placeholder="您的存储桶名称" 
            @blur="() => formRef?.validateFields(['bucket'])"
          />
        </a-form-item>
        
        <a-form-item name="accessKeyId" label="Access Key ID">
          <a-input 
            v-model:value="formState.accessKeyId" 
            placeholder="R2 Access Key ID" 
            @blur="() => formRef?.validateFields(['accessKeyId'])"
          />
        </a-form-item>
        
        <a-form-item name="secretAccessKey" label="Secret Access Key">
          <a-input-password 
            v-model:value="formState.secretAccessKey" 
            placeholder="R2 Secret Access Key" 
            @blur="() => formRef?.validateFields(['secretAccessKey'])"
          />
        </a-form-item>
        
        <a-alert 
          v-if="corsError" 
          type="warning" 
          show-icon 
          message="CORS 配置错误" 
          description="您需要在 Cloudflare R2 控制台中为此存储桶配置 CORS 设置，以允许从您的网站访问。请参阅下方的配置说明。"
          style="margin-bottom: 16px"
        />
        
        <a-form-item>
          <a-space>
            <a-button type="primary" html-type="submit" :loading="loading">
              保存配置
            </a-button>
            <a-button @click="testConnection" :disabled="!isFormComplete" :loading="testing">
              测试连接
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
    
    <div class="config-help">
      <a-typography-title :level="4">如何获取 Cloudflare R2 配置信息？</a-typography-title>
      <a-typography-paragraph>
        1. 登录 Cloudflare 仪表板
      </a-typography-paragraph>
      <a-typography-paragraph>
        2. 在左侧导航栏中选择"R2"
      </a-typography-paragraph>
      <a-typography-paragraph>
        3. 创建一个新的存储桶或选择现有存储桶
      </a-typography-paragraph>
      <a-typography-paragraph>
        4. 在"R2"页面中，点击"管理 R2 API 令牌"
      </a-typography-paragraph>
      <a-typography-paragraph>
        5. 创建一个新的 API 令牌，确保它具有读写权限
      </a-typography-paragraph>
      <a-typography-paragraph>
        6. 将获得的 Access Key ID 和 Secret Access Key 填入此表单
      </a-typography-paragraph>
      <a-typography-paragraph>
        7. 终端节点 URL 通常为：<code>https://&lt;ACCOUNT_ID&gt;.r2.cloudflarestorage.com</code>
      </a-typography-paragraph>
      <a-typography-paragraph>
        <a-alert type="info" show-icon>
          <template #message>
            Cloudflare R2 兼容 S3 API，因此可以使用相同的配置方式。
          </template>
        </a-alert>
      </a-typography-paragraph>
      
      <a-divider />
      
      <a-typography-title :level="4" id="cors-config">配置 CORS（跨源资源共享）</a-typography-title>
      <a-typography-paragraph>
        要使用 R2 图床，您需要在 Cloudflare R2 控制台中配置 CORS 设置：
      </a-typography-paragraph>
      <a-typography-paragraph>
        1. 登录 Cloudflare 仪表板
      </a-typography-paragraph>
      <a-typography-paragraph>
        2. 在左侧导航栏中选择"R2"
      </a-typography-paragraph>
      <a-typography-paragraph>
        3. 选择您的存储桶
      </a-typography-paragraph>
      <a-typography-paragraph>
        4. 点击"设置"标签
      </a-typography-paragraph>
      <a-typography-paragraph>
        5. 找到"跨源资源共享 (CORS)"部分并点击"添加规则"
      </a-typography-paragraph>
      <a-typography-paragraph>
        6. 配置规则如下：
      </a-typography-paragraph>
      <a-typography-paragraph>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">
{
  "AllowedOrigins": ["*"],  // 或使用您的网站域名，如 ["https://example.com"]
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}</pre>
      </a-typography-paragraph>
      <a-typography-paragraph>
        7. 点击"保存"
      </a-typography-paragraph>
      <a-typography-paragraph>
        <a-alert type="info" show-icon>
          <template #message>
            在生产环境中，建议将 AllowedOrigins 设置为您的实际网站域名，而不是使用通配符 "*"。
          </template>
        </a-alert>
      </a-typography-paragraph>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { message } from 'ant-design-vue'
import s3Service from '../services/s3Service'

const store = useStore()
const formRef = ref()
const loading = ref(false)
const testing = ref(false)
const corsError = ref(false)

// 表单状态
const formState = reactive({
  endpoint: '',
  region: 'auto',
  bucket: '',
  accessKeyId: '',
  secretAccessKey: ''
})

// 表单验证规则
const rules = {
  endpoint: [
    { required: true, message: '请输入终端节点 URL', trigger: ['blur', 'change'] },
    { 
      type: 'string', 
      pattern: /^https?:\/\/.+/,
      message: '终端节点 URL 必须以 http://或 https://开头',
      trigger: ['blur', 'change']
    }
  ],
  bucket: [
    { required: true, message: '请输入存储桶名称', trigger: ['blur', 'change'] }
  ],
  accessKeyId: [
    { required: true, message: '请输入 Access Key ID', trigger: ['blur', 'change'] }
  ],
  secretAccessKey: [
    { required: true, message: '请输入 Secret Access Key', trigger: ['blur', 'change'] }
  ]
}

// 判断表单是否完整填写
const isFormComplete = computed(() => {
  return formState.endpoint && 
         formState.bucket && 
         formState.accessKeyId && 
         formState.secretAccessKey
})

// 提交表单
const onFinish = async () => {
  loading.value = true
  
  try {
    // 保存配置到 Vuex 和本地存储，包括密钥
    const config = { ...formState }
    await store.dispatch('saveConfig', config)
    
    message.success('配置已保存')
    // 重置 CORS 错误标志
    corsError.value = false
  } catch (error) {
    console.error('保存配置失败：', error)
    message.error(`保存失败：${error.message}`)
  } finally {
    loading.value = false
  }
}

// 测试连接
const testConnection = async () => {
  testing.value = true
  corsError.value = false
  
  try {
    // 创建临时 S3 服务客户端
    const tempService = new s3Service.constructor({ ...formState })
    
    // 尝试列出对象
    await tempService.listObjects()
    
    message.success('连接成功！可以正常访问您的 R2 存储桶。')
  } catch (error) {
    console.error('连接测试失败：', error)
    
    // 检查是否是 CORS 错误
    if (error.message && (
        error.message.includes('CORS') || 
        error.message.includes('Access-Control-Allow-Origin') ||
        error.message.includes('cross-origin')
      )) {
      corsError.value = true
      message.error('CORS 错误：您需要在 R2 控制台中配置跨域资源共享设置')
      // 滚动到 CORS 配置说明
      setTimeout(() => {
        document.getElementById('cors-config')?.scrollIntoView({ behavior: 'smooth' })
      }, 500)
    } else {
      message.error(`连接失败：${error.message}`)
    }
  } finally {
    testing.value = false
  }
}

// 组件挂载时，从 Vuex 加载配置
onMounted(() => {
  // 从 Vuex 加载配置
  const storeConfig = store.state.s3Config
  
  if (storeConfig) {
    // 使用 Vuex 中的配置填充表单
    Object.keys(formState).forEach(key => {
      if (storeConfig[key] !== undefined) {
        formState[key] = storeConfig[key]
      }
    })
  }
})
</script>

<style scoped>
.config-container {
  max-width: 800px;
  margin: 0 auto;
}

.config-card {
  margin-bottom: 24px;
}

.config-help {
  background-color: #fafafa;
  border-radius: 4px;
  padding: 16px;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style> 