<template>
  <div class="upload-container">
    <a-page-header 
      title="上传图片"
      sub-title="将图片上传到您的R2存储桶"
    />
    
    <a-row :gutter="24">
      <a-col :span="16">
        <a-card class="upload-card">
          <div 
            class="upload-area"
            :class="{ 'is-dragover': isDragover }"
            @dragover.prevent="onDragover"
            @dragleave.prevent="onDragleave"
            @drop.prevent="onFileDrop"
            @click="triggerFileSelect"
          >
            <input 
              type="file" 
              ref="fileInput" 
              style="display: none" 
              @change="onFileChange"
              multiple
              accept="image/*"
            >
            
            <div v-if="!uploadFiles.length" class="upload-placeholder">
              <cloud-upload-outlined class="upload-icon" />
              <p>拖拽图片到此处或点击上传</p>
              <p class="upload-tip">支持单个或多个文件上传</p>
            </div>
            
            <div v-else class="upload-list">
              <a-list 
                :data-source="uploadFiles" 
                :locale="{ emptyText: '没有待上传的文件' }"
              >
                <template #renderItem="{ item, index }">
                  <a-list-item>
                    <a-list-item-meta>
                      <template #avatar>
                        <div class="file-preview">
                          <img v-if="item.preview" :src="item.preview" :alt="item.file.name" />
                          <file-image-outlined v-else />
                        </div>
                      </template>
                      <template #title>{{ item.file.name }}</template>
                      <template #description>
                        <div>{{ formatFileSize(item.file.size) }}</div>
                        <a-progress 
                          v-if="item.status !== 'waiting'" 
                          :percent="item.progress" 
                          size="small" 
                          :status="item.status === 'error' ? 'exception' : undefined"
                        />
                      </template>
                    </a-list-item-meta>
                    <template #extra>
                      <a-space>
                        <a-button 
                          v-if="item.status === 'success'" 
                          type="link" 
                          @click="copyUrl(item.url)"
                        >
                          复制链接
                        </a-button>
                        <a-button 
                          v-if="item.status === 'waiting'" 
                          type="link" 
                          @click="removeFile(index)"
                        >
                          移除
                        </a-button>
                      </a-space>
                    </template>
                  </a-list-item>
                </template>
              </a-list>
            </div>
          </div>
          
          <a-row style="margin-top: 16px">
            <a-col :span="24">
              <a-space style="display: flex; justify-content: center;">
                <a-button type="primary" @click="uploadAll" :disabled="!canUpload">
                  上传全部
                </a-button>
                <a-button @click="clearFiles">清空列表</a-button>
              </a-space>
            </a-col>
          </a-row>
          
        </a-card>
      </a-col>
      
      <a-col :span="8">
        <a-card title="上传选项" class="options-card">
          <a-form layout="vertical">
            <a-form-item label="目标目录">
              <a-tree-select
                v-model:value="uploadPath"
                placeholder="选择目标目录"
                style="width: 100%"
                :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
                :tree-data="treeData"
                :load-data="onLoadData"
                :field-names="{ children: 'children', label: 'name', value: 'path', key: 'path' }"
                tree-default-expand-all
                show-search
                :filter-tree-node="filterTreeNode"
                allow-clear
              >
                <template #suffixIcon><folder-outlined /></template>
                <template #title="{ value, name }">
                  <span>{{ name || '根目录' }}</span>
                </template>
                <template #notFoundContent>
                  <div v-if="loadingDirectories">
                    <a-spin size="small" /> 加载中...
                  </div>
                  <div v-else>
                    <empty-outlined /> 没有找到目录
                  </div>
                </template>
                <template #dropdownRender="{ menuNode: menu }">
                  <div>
                    <div style="padding: 6px 12px; display: flex; align-items: center">
                      <span v-if="uploadPath"><folder-outlined /> 当前路径：{{ uploadPath }}</span>
                      <span v-else><home-outlined /> 根目录</span>
                      <a-divider type="vertical" />
                      <a-button type="link" size="small" @click="showCreateFolderModal = true">
                        <plus-outlined /> 新建文件夹
                      </a-button>
                    </div>
                    <a-divider style="margin: 4px 0" />
                    <div>{{ menu }}</div>
                  </div>
                </template>
              </a-tree-select>
            </a-form-item>
            
            <a-form-item label="文件名处理">
              <a-radio-group v-model="fileNameOption">
                <a-radio :value="'original'">保留原始文件名</a-radio>
                <a-radio :value="'timestamp'">添加时间戳前缀</a-radio>
                <a-radio :value="'uuid'">使用 UUID 替换</a-radio>
              </a-radio-group>
            </a-form-item>
            
            <a-divider />
            
            <a-alert 
              v-if="!checkS3Config" 
              type="warning" 
              show-icon 
              message="请先完成S3配置" 
              description="您需要先在S3配置页面中完成R2存储设置后才能上传文件。"
              style="margin-bottom: 16px"
            />
            
            <a-typography-title :level="4">上传历史</a-typography-title>
            
            <a-list 
              class="recent-list"
              :data-source="recentUploads" 
              :locale="{ emptyText: '暂无上传历史' }"
              size="small"
            >
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta>
                    <template #title>{{ item.fileName }}</template>
                    <template #description>{{ item.time }}</template>
                  </a-list-item-meta>
                  <a-button type="link" @click="copyUrl(item.url)">
                    复制链接
                  </a-button>
                </a-list-item>
              </template>
            </a-list>
          </a-form>
        </a-card>
      </a-col>
    </a-row>
    
    <!-- 新建文件夹对话框 -->
    <a-modal
      v-model:visible="showCreateFolderModal"
      title="新建文件夹"
      @ok="createNewFolder"
      :confirm-loading="creatingFolder"
    >
      <a-input
        v-model:value="newFolderName"
        placeholder="请输入文件夹名称"
        @pressEnter="createNewFolder"
      />
      <p v-if="uploadPath" style="margin-top: 8px">
        将在 <strong>{{ uploadPath }}</strong> 下创建文件夹
      </p>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, h, watch } from 'vue'
import { useStore } from 'vuex'
import { message } from 'ant-design-vue'
import { 
  CloudUploadOutlined, 
  FileImageOutlined,
  PlusOutlined,
  FolderOutlined,
  HomeOutlined,
  EmptyOutlined
} from '@ant-design/icons-vue'
import s3Service from '../services/s3Service'
import cacheService from '../services/cacheService'

const store = useStore()
const fileInput = ref(null)
const isDragover = ref(false)
const uploadFiles = ref([])
const uploadPath = ref('')
const fileNameOption = ref('original')
const recentUploads = ref([])

// 目录相关状态
const availableDirectories = ref([])
const loadingDirectories = ref(false)
const showCreateFolderModal = ref(false)
const newFolderName = ref('')
const creatingFolder = ref(false)

// 树形数据
const treeData = ref([{
  name: '根目录',
  path: '',
  key: 'root',
  isLeaf: false,
  children: null
}])

// 目标目录选择筛选
const filterTreeNode = (inputValue, node) => {
  const name = node.name || ''
  const path = node.path || ''
  return name.toLowerCase().includes(inputValue.toLowerCase()) ||
         path.toLowerCase().includes(inputValue.toLowerCase())
}

// 处理异步加载数据
const onLoadData = (treeNode) => {
  return new Promise(async (resolve) => {
    if (treeNode.dataRef.children && treeNode.dataRef.children.length) {
      resolve()
      return
    }
    
    try {
      loadingDirectories.value = true
      const path = treeNode.dataRef.path || ''
      const childFolders = await fetchDirectories(path)
      
      // 如果是根节点
      if (treeNode.dataRef.key === 'root') {
        treeData.value[0].children = childFolders
      } else {
        // 查找并更新正确的节点
        updateTreeNodeChildren(treeData.value, treeNode.dataRef.path, childFolders)
      }
      
      loadingDirectories.value = false
      resolve()
    } catch (error) {
      console.error('加载目录失败：', error)
      loadingDirectories.value = false
      message.error('加载子目录失败')
      resolve()
    }
  })
}

// 更新树节点的子节点
const updateTreeNodeChildren = (nodes, path, children) => {
  if (!nodes) return false
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (node.path === path) {
      node.children = children
      return true
    }
    
    if (node.children) {
      if (updateTreeNodeChildren(node.children, path, children)) {
        return true
      }
    }
  }
  
  return false
}

// 加载可用目录列表
const loadDirectories = async () => {
  if (!checkS3Config.value) {
    message.warning('请先完成 S3 配置')
    return
  }
  
  loadingDirectories.value = true
  
  try {
    // 尝试从缓存加载目录树结构
    const bucketTree = cacheService.getBucketTree()
    if (bucketTree) {
      // 从缓存构建树形结构
      treeData.value = [{
        name: '根目录',
        path: '',
        key: 'root',
        isLeaf: false,
        children: convertCacheTreeToTreeData(bucketTree.children || [])
      }]
    } else {
      // 如果没有缓存，则加载根目录
      const rootFolders = await fetchDirectories('')
      treeData.value = [{
        name: '根目录',
        path: '',
        key: 'root',
        isLeaf: false,
        children: rootFolders
      }]
    }
  } catch (error) {
    console.error('加载目录列表失败：', error)
    message.error(`加载目录列表失败：${error.message || '未知错误'}`)
  } finally {
    loadingDirectories.value = false
  }
}

// 将缓存树结构转换为树形选择器数据
const convertCacheTreeToTreeData = (nodes) => {
  if (!nodes || nodes.length === 0) return []
  
  return nodes.map(node => ({
    name: node.name,
    path: node.path,
    key: node.path,
    isLeaf: !(node.children && node.children.length),
    children: node.children ? convertCacheTreeToTreeData(node.children) : null
  }))
}

// 创建文件夹后刷新树形数据
const refreshTreeDataAfterFolderCreation = (folderPath) => {
  // 提取父路径
  const lastSlashIndex = folderPath.lastIndexOf('/')
  let parentPath = ''
  
  if (lastSlashIndex > 0) {
    parentPath = folderPath.substring(0, lastSlashIndex)
  }
  
  // 查找并刷新父节点的子节点
  if (parentPath) {
    updateNodeAndParents(treeData.value, parentPath)
  } else {
    // 如果是根目录，直接刷新根节点
    onLoadData({ dataRef: { key: 'root', path: '' } })
  }
}

// 递归更新节点和其父节点
const updateNodeAndParents = async (nodes, path) => {
  if (!nodes) return false
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    
    // 如果找到匹配的节点
    if (node.path === path) {
      // 重新加载该节点的子节点
      const childFolders = await fetchDirectories(path)
      node.children = childFolders
      return true
    }
    
    // 递归检查子节点
    if (node.children) {
      if (await updateNodeAndParents(node.children, path)) {
        return true
      }
    }
  }
  
  return false
}

// 检查 S3 配置
const checkS3Config = computed(() => {
  return !!store.state.s3Config
})

// 是否可以上传
const canUpload = computed(() => {
  return checkS3Config.value && 
         uploadFiles.value.length > 0 && 
         uploadFiles.value.some(item => item.status === 'waiting')
})

// 获取指定路径下的目录
const fetchDirectories = async (prefix = '') => {
  try {
    const objects = await s3Service.listObjects(prefix)
    
    // 只保留文件夹
    const folders = objects.filter(item => item.isFolder).map(folder => ({
      name: folder.name,
      path: folder.key,
      // 标记此文件夹可能有子文件夹
      isLeaf: false,
      // 标记尚未加载子文件夹
      children: null
    }))
    
    // 如果是根路径查询，直接更新可用目录列表
    if (!prefix) {
      availableDirectories.value = folders
    }
    
    return folders
  } catch (error) {
    console.error('获取目录列表失败：', error)
    throw error
  }
}

// 触发文件选择
const triggerFileSelect = () => {
  if (!checkS3Config.value) {
    message.warning('请先完成 S3 配置')
    return
  }
  fileInput.value.click()
}

// 拖拽区域事件处理
const onDragover = () => {
  isDragover.value = true
}

const onDragleave = () => {
  isDragover.value = false
}

// 文件拖拽放置处理
const onFileDrop = (e) => {
  isDragover.value = false
  
  if (!checkS3Config.value) {
    message.warning('请先完成 S3 配置')
    return
  }
  
  const files = e.dataTransfer.files
  if (files && files.length > 0) {
    handleFiles(files)
  }
}

// 文件选择处理
const onFileChange = (e) => {
  const files = e.target.files
  if (files && files.length > 0) {
    handleFiles(files)
  }
  // 重置文件选择器
  e.target.value = ''
}

// 处理选择的文件
const handleFiles = (files) => {
  const fileArray = Array.from(files)
  
  // 只处理图片文件
  const imageFiles = fileArray.filter(file => file.type.startsWith('image/'))
  
  if (imageFiles.length === 0) {
    message.warning('仅支持上传图片文件')
    return
  }
  
  // 为每个文件创建预览
  imageFiles.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadFiles.value.push({
        file,
        preview: e.target.result,
        status: 'waiting',
        progress: 0,
        url: null
      })
    }
    reader.readAsDataURL(file)
  })
}

// 移除文件
const removeFile = (index) => {
  uploadFiles.value.splice(index, 1)
}

// 清空文件列表
const clearFiles = () => {
  uploadFiles.value = []
}

// 格式化文件大小
const formatFileSize = (size) => {
  if (size < 1024) {
    return size + ' B'
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + ' KB'
  } else if (size < 1024 * 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(2) + ' MB'
  } else {
    return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  }
}

// 生成文件名
const generateFileName = (file) => {
  const extension = file.name.split('.').pop()
  let fileName = ''
  
  switch (fileNameOption.value) {
    case 'original':
      fileName = file.name
      break
    case 'timestamp':
      fileName = `${Date.now()}_${file.name}`
      break
    case 'uuid':
      fileName = `${self.crypto.randomUUID()}.${extension}`
      break
    default:
      fileName = file.name
  }
  
  // 添加路径前缀
  let path = uploadPath.value
  if (path) {
    path = path.endsWith('/') ? path : path + '/'
    fileName = path + fileName
  }
  
  return fileName
}

// 上传单个文件
const uploadFile = async (fileItem, index) => {
  if (fileItem.status !== 'waiting') {
    return
  }
  
  fileItem.status = 'uploading'
  fileItem.progress = 0
  
  try {
    const fileName = generateFileName(fileItem.file)
    
    // 启动进度更新定时器
    const progressInterval = setInterval(() => {
      if (fileItem.progress < 90) {
        fileItem.progress += Math.floor(Math.random() * 10) + 1
        if (fileItem.progress > 90) {
          fileItem.progress = 90
        }
      }
    }, 200)
    
    // 实际上传文件
    const result = await s3Service.uploadFile(fileItem.file, fileName)
    
    // 停止进度更新
    clearInterval(progressInterval)
    
    // 更新状态和 URL
    fileItem.progress = 100
    fileItem.status = 'success'
    
    // 如果返回了 URL 直接使用，否则尝试获取签名 URL
    if (result.url) {
      fileItem.url = result.url
    } else if (result.key) {
      try {
        fileItem.url = await s3Service.getSignedUrl(result.key)
      } catch (urlError) {
        console.error('获取签名 URL 失败：', urlError)
        fileItem.url = `${s3Service.config.endpoint}/${s3Service.config.bucket}/${result.key}`
      }
    }
    
    // 添加到上传历史
    addToRecentUploads({
      fileName: fileItem.file.name,
      url: fileItem.url,
      time: new Date().toLocaleString()
    })
    
    message.success(`文件 ${fileItem.file.name} 上传成功`)
  } catch (error) {
    console.error('上传文件失败：', error)
    fileItem.status = 'error'
    fileItem.progress = 0
    message.error(`上传失败：${error.message || '未知错误'}`)
  }
}

// 上传所有文件
const uploadAll = async () => {
  if (!checkS3Config.value) {
    message.warning('请先完成 S3 配置')
    return
  }
  
  const waitingFiles = uploadFiles.value.filter(item => item.status === 'waiting')
  
  if (waitingFiles.length === 0) {
    message.info('没有待上传的文件')
    return
  }
  
  // 并行上传所有文件
  const promises = waitingFiles.map((item, index) => 
    uploadFile(item, uploadFiles.value.indexOf(item))
  )
  
  try {
    await Promise.all(promises)
    message.success('所有文件上传完成')
  } catch (error) {
    console.error('上传过程中出错：', error)
  }
}

// 复制 URL
const copyUrl = (url) => {
  if (!url) return
  
  navigator.clipboard.writeText(url)
    .then(() => {
      message.success('链接已复制到剪贴板')
    })
    .catch(err => {
      console.error('无法复制到剪贴板：', err)
      message.error('复制失败，请手动复制')
    })
}

// 添加到最近上传
const addToRecentUploads = (upload) => {
  // 只保留最近 10 条记录
  recentUploads.value.unshift(upload)
  if (recentUploads.value.length > 10) {
    recentUploads.value.pop()
  }
  
  // 保存到本地存储
  localStorage.setItem('recentUploads', JSON.stringify(recentUploads.value))
}

// 修改树结构渲染函数，支持树形展示
const renderTreeNodes = (data) => {
  if (!data || data.length === 0) return null
  
  return data.map(item => {
    if (item.children !== null) {
      // 有子节点，渲染树节点
      return h(
        'a-tree-node',
        {
          key: item.path,
          title: item.name,
          isLeaf: false,
          dataRef: item
        },
        { 
          default: () => renderTreeNodes(item.children)
        }
      )
    }
    
    // 叶子节点或未加载子节点
    return h(
      'a-tree-node',
      {
        key: item.path,
        title: item.name,
        isLeaf: false,
        dataRef: item
      }
    )
  })
}

// 组件挂载时加载最近上传记录
onMounted(() => {
  const stored = localStorage.getItem('recentUploads')
  if (stored) {
    try {
      recentUploads.value = JSON.parse(stored)
    } catch (e) {
      console.error('无法解析上传历史：', e)
    }
  }
  
  // 初始加载目录列表
  if (checkS3Config.value) {
    loadDirectories()
  }
})
</script>

<style scoped>
.upload-container {
  max-width: 1200px;
  margin: 0 auto;
}

.upload-card {
  min-height: 400px;
}

.options-card {
  height: 100%;
}

.upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 4px;
  padding: 20px;
  text-align: center;
  background-color: #fafafa;
  cursor: pointer;
  transition: border-color 0.3s, background-color 0.3s;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.upload-area.is-dragover {
  border-color: #1890ff;
  background-color: #e6f7ff;
}

.upload-icon {
  font-size: 48px;
  color: #1890ff;
  margin-bottom: 16px;
}

.upload-placeholder p {
  margin: 4px 0;
}

.upload-tip {
  font-size: 12px;
  color: #999;
}

.upload-list {
  width: 100%;
  text-align: left;
}

.file-preview {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  background-color: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

.recent-list {
  max-height: 200px;
  overflow-y: auto;
}
</style> 