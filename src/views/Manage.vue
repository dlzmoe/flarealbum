<template>
  <div class="manage-container">
    <!-- 侧边树状结构 -->
    <a-drawer
      v-model:visible="showBucketTree"
      title="存储桶文件结构"
      placement="left"
      :width="320"
      :closable="true"
    > 
      <div style="height: 100%;display: flex; flex-direction: column;">
        <div v-if="bucketTree" class="tree-container">
          <a-tree
            :treeData="[bucketTree]"
            :fieldNames="{ title: 'name', key: 'path', children: 'children' }"
            @select="keys => navigateFromTree(cacheService.getNodeByPath(keys[0]))"
          >
            <template #title="{ name, files, children }">
              <span>
                {{ name || '根目录' }}
                <a-tag v-if="files?.length || children?.length">
                  {{ getChildCount({ files, children }) }}
                </a-tag>
              </span>
            </template>
          </a-tree>
        </div>
        
        <div class="cache-stats">
          <h4>缓存统计</h4>
          <p>
            <strong>总缓存大小：</strong> {{ cacheStats?.totalSize || '0 B' }}<br>
            <strong>缓存目录数：</strong> {{ cacheStats?.fileCount || 0 }}<br>
            <strong>缓存图片数：</strong> {{ cacheStats?.urlCount || 0 }}<br>
            <strong>树结构大小：</strong> {{ cacheStats?.bucketTreeSize || '0 B' }}
          </p>
        </div>
      </div>
    </a-drawer>
    
    <a-page-header
      title="图床管理"
      sub-title="管理您的FlareAlbum图片"
      :backIcon="false"
    >
      <template #extra>
        <a-space>
          <a-tag v-if="!loading" color="success">
            <clock-circle-outlined /> {{ cacheTimestamp ? new Date(cacheTimestamp).toLocaleString() : '无缓存' }}
          </a-tag>
          <a-button @click="toggleViewMode">
            <template #icon>
              <appstore-outlined v-if="viewMode === 'list'" />
              <unordered-list-outlined v-else />
            </template>
            {{ viewMode === 'list' ? '网格视图' : '列表视图' }}
          </a-button>
          <a-button @click="toggleBucketTree">
            <template #icon>
              <partition-outlined />
            </template>
            文件夹树
          </a-button>
          <a-button type="primary" @click="refreshFiles" :loading="loading">
            <template #icon>
              <reload-outlined />
            </template>
            刷新
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <!-- 自定义域名提示 -->
    <a-alert
      v-if="customDomainPrefix"
      type="info"
      show-icon
      style="margin-bottom: 16px"
    >
      <template #message>
        当前使用自定义域名前缀：<a-tag color="blue">{{ customDomainPrefix }}</a-tag>
      </template>
      <template #description>
        所有图片链接将使用此域名前缀，而不是默认的 R2 存储 URL。您可以在<router-link to="/settings">设置页面</router-link>中修改。
      </template>
    </a-alert>

    <a-card>
      <!-- 面包屑导航 -->
      <a-breadcrumb style="margin-bottom: 16px">
        <a-breadcrumb-item>
          <a @click="navigateTo('')">根目录</a>
        </a-breadcrumb-item>
        <a-breadcrumb-item v-for="(part, index) in breadcrumbParts" :key="index">
          <a @click="navigateTo(part.path)">{{ part.name }}</a>
        </a-breadcrumb-item>
      </a-breadcrumb>
      
      <!-- 缓存指示器 -->
      <!-- <a-alert 
        v-if="cacheTimestamp && !loading" 
        type="info" 
        show-icon 
        message="使用缓存数据" 
        description="当前显示的是本地缓存数据，点击刷新按钮获取最新数据。"
        style="margin-bottom: 16px"
      /> -->
      
      <!-- 警告提示 -->
      <a-alert 
        v-if="!checkS3Config" 
        type="warning" 
        show-icon 
        message="请先完成S3配置" 
        description="您需要先在S3配置页面中完成Cloudflare R2存储设置后才能管理文件。"
        style="margin-bottom: 16px"
      />
      
      <!-- 加载中 -->
      <div v-if="loading" class="loading-container">
        <a-spin tip="正在加载文件列表..." />
      </div>
      
      <!-- 列表视图 -->
      <a-table
        v-else-if="viewMode === 'list'"
        :columns="columns"
        :data-source="fileList"
        :pagination="{ pageSize: 10 }"
        :locale="{ emptyText: '当前目录为空' }"
        row-key="key"
      >
        <!-- 缩略图列 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'thumbnail'">
            <div class="thumbnail-cell">
              <template v-if="record.isFolder">
                <folder-outlined class="folder-icon" />
              </template>
              <template v-else-if="isImageFile(record.name) && getFileUrl(record.key)">
                <div class="image-thumbnail" @click="openPreview(record)">
                  <img :src="getFileUrl(record.key)" :alt="record.name" />
                </div>
              </template>
              <template v-else>
                <file-image-outlined v-if="isImageFile(record.name)" class="image-icon" />
                <file-outlined v-else class="file-icon" />
              </template>
            </div>
          </template>
          
          <!-- 文件名列 -->
          <template v-if="column.dataIndex === 'name'">
            <a v-if="record.isFolder" @click="openFolder(record.key)">
              {{ record.name }}
            </a>
            <span v-else-if="isImageFile(record.name)" @click="openPreview(record)" class="image-name">
              {{ record.name }}
            </span>
            <span v-else>
              {{ record.name }}
            </span>
          </template>
          
          <!-- 大小列 -->
          <template v-if="column.dataIndex === 'size'">
            {{ record.isFolder ? '-' : formatFileSize(record.size) }}
          </template>
          
          <!-- 修改时间列 -->
          <template v-if="column.dataIndex === 'lastModified'">
            {{ record.lastModified ? formatDate(record.lastModified) : '-' }}
          </template>
          
          <!-- 操作列 -->
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <a-button 
                v-if="!record.isFolder" 
                type="link" 
                size="small"
                @click="copyUrl(record.key)"
              >
                复制链接
              </a-button>
              <a-popconfirm
                v-if="!record.isFolder"
                title="确定要删除这个文件吗?"
                @confirm="deleteFile(record.key)"
              >
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
      
      <!-- 网格视图 -->
      <div v-else-if="viewMode === 'grid'" class="grid-view">
        <a-row :gutter="[16, 16]">
          <!-- 文件夹 -->
          <a-col 
            v-for="item in fileList.filter(file => file.isFolder)" 
            :key="item.key"
            :xs="12" :sm="8" :md="6" :lg="4" :xl="4"
          >
            <a-card 
              hoverable 
              class="grid-card folder-card"
              @click="openFolder(item.key)"
            >
              <div class="grid-card-content">
                <folder-outlined class="grid-folder-icon" />
                <div class="grid-file-name">{{ item.name }}</div>
              </div>
            </a-card>
          </a-col>
          
          <!-- 图片文件 -->
          <a-col 
            v-for="item in fileList.filter(file => !file.isFolder && isImageFile(file.name))" 
            :key="item.key"
            :xs="12" :sm="8" :md="6" :lg="4" :xl="4"
          >
            <a-card 
              hoverable 
              class="grid-card image-card"
              @click="openPreview(item)"
            >
              <div class="grid-card-content">
                <div class="grid-image-container">
                  <img v-if="getFileUrl(item.key)" :src="getFileUrl(item.key)" :alt="item.name" />
                  <file-image-outlined v-else class="grid-image-icon" />
                </div>
                <div class="grid-file-name">{{ item.name }}</div>
                <div class="grid-file-info">{{ formatFileSize(item.size) }}</div>
              </div>
              <template #actions>
                <a-button type="link" size="small" @click.stop="copyUrl(item.key)">复制链接</a-button>
                <a-popconfirm
                  title="确定要删除这个文件吗?"
                  @confirm.stop="deleteFile(item.key)"
                  @click.stop
                >
                  <a-button type="link" size="small" danger>删除</a-button>
                </a-popconfirm>
              </template>
            </a-card>
          </a-col>
          
          <!-- 其他文件 -->
          <a-col 
            v-for="item in fileList.filter(file => !file.isFolder && !isImageFile(file.name))" 
            :key="item.key"
            :xs="12" :sm="8" :md="6" :lg="4" :xl="4"
          >
            <a-card 
              hoverable 
              class="grid-card file-card"
            >
              <div class="grid-card-content">
                <file-outlined class="grid-file-icon" />
                <div class="grid-file-name">{{ item.name }}</div>
                <div class="grid-file-info">{{ formatFileSize(item.size) }}</div>
              </div>
              <template #actions>
                <a-button type="link" size="small" @click.stop="copyUrl(item.key)">复制链接</a-button>
                <a-popconfirm
                  title="确定要删除这个文件吗?"
                  @confirm.stop="deleteFile(item.key)"
                  @click.stop
                >
                  <a-button type="link" size="small" danger>删除</a-button>
                </a-popconfirm>
              </template>
            </a-card>
          </a-col>
          
          <!-- 如果没有文件显示空状态 -->
          <a-col :span="24" v-if="fileList.length === 0">
            <div class="empty-container">
              <a-empty description="当前目录为空" />
            </div>
          </a-col>
        </a-row>
      </div>
    </a-card>
    
    <!-- 图片预览模态框 -->
    <a-modal
      v-model:visible="previewVisible"
      title="图片预览"
      :footer="null"
      @cancel="closePreview"
      :destroyOnClose="true"
      :maskClosable="true"
      centered
      width="800px"
    >
      <img 
        v-if="previewUrl" 
        :src="previewUrl" 
        style="width: 100%;" 
        :alt="previewImage?.name || '预览图片'" 
      />
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { 
  ReloadOutlined, 
  FolderOutlined, 
  FileOutlined,
  PictureOutlined,
  FileImageOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  PartitionOutlined,
  AppstoreOutlined,
  UnorderedListOutlined
} from '@ant-design/icons-vue'
import s3Service from '../services/s3Service'
import cacheService from '../services/cacheService'

const store = useStore()
const route = useRoute()
const router = useRouter()

// 状态
const loading = ref(false)
const fileList = ref([])
const currentPath = ref('')
const previewVisible = ref(false)
const previewUrl = ref('')
const previewImage = ref(null)
const fileUrlCache = ref({}) // 缓存文件 URL
const cacheTimestamp = ref(0) // 缓存时间戳
const showBucketTree = ref(false) // 是否显示存储桶树结构
const bucketTree = ref(null) // 存储桶树结构
const cacheStats = ref(null) // 缓存统计
const viewMode = ref('grid') // 修改默认为 'grid'，即九宫格模式

// 判断文件是否为图片
const isImageFile = (filename) => {
  if (!filename) return false
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
  const extension = filename.split('.').pop().toLowerCase()
  return imageExtensions.includes(extension)
}

// 表格列配置
const columns = [
  {
    title: '缩略图',
    dataIndex: 'thumbnail',
    key: 'thumbnail',
    width: 80
  },
  {
    title: '文件名',
    dataIndex: 'name',
    key: 'name',
    sorter: (a, b) => {
      // 文件夹排在前面
      if (a.isFolder && !b.isFolder) return -1
      if (!a.isFolder && b.isFolder) return 1
      return a.name.localeCompare(b.name)
    },
    defaultSortOrder: 'ascend'
  },
  {
    title: '大小',
    dataIndex: 'size',
    key: 'size',
    sorter: (a, b) => a.size - b.size
  },
  {
    title: '修改日期',
    dataIndex: 'lastModified',
    key: 'lastModified',
    sorter: (a, b) => {
      if (!a.lastModified || !b.lastModified) return 0
      return new Date(a.lastModified) - new Date(b.lastModified)
    }
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
    width: 160
  }
]

// 检查 S3 配置
const checkS3Config = computed(() => {
  return !!store.state.s3Config
})

// 生成面包屑数据
const breadcrumbParts = computed(() => {
  if (!currentPath.value) return []
  
  const parts = currentPath.value.split('/').filter(Boolean)
  const result = []
  
  let path = ''
  for (const part of parts) {
    path = path ? `${path}/${part}` : part
    result.push({
      name: part,
      path: path
    })
  }
  
  return result
})

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

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

// 导航到指定路径
const navigateTo = (path) => {
  // 标准化路径，但保留结尾的斜杠表示目录
  currentPath.value = path
  loadFiles()
}

// 打开文件夹
const openFolder = (path) => {
  // 确保路径以斜杠结尾表示目录
  if (path.endsWith('/')) {
    currentPath.value = path.replace(/\/+$/, '/') // 确保只有一个结尾斜杠
  } else {
    currentPath.value = path + '/'
  }
  loadFiles()
}

// 加载文件列表
const loadFiles = async () => {
  if (!checkS3Config.value) {
    message.warning('请先完成 S3 配置')
    return
  }
  
  // 获取缓存时间戳
  cacheTimestamp.value = parseInt(localStorage.getItem(cacheService.getTimestampKey()) || '0', 10)
  
  // 从缓存中获取文件列表
  const cachedFiles = cacheService.getFilesInPath(currentPath.value)
  if (cachedFiles && cachedFiles.length > 0) {
    fileList.value = cachedFiles
    
    // 加载 URL 缓存
    fileUrlCache.value = cacheService.loadFileUrls()
    
    // 加载树结构
    bucketTree.value = cacheService.getBucketTree()
    
    // 获取缓存统计
    updateCacheStats()
    return
  }
  
  // 如果没有缓存或缓存为空，尝试加载
  loading.value = true
  
  try {
    // 获取文件列表
    const files = await s3Service.listObjects(currentPath.value)
    
    fileList.value = files
    
    // 保存到缓存服务
    cacheService.saveFileList(currentPath.value, files)
    
    // 保存到本地状态
    cacheTimestamp.value = Date.now()
    
    // 预加载图片缩略图 URL
    await loadThumbnails(files)
    
    // 更新树结构
    bucketTree.value = cacheService.getBucketTree()
    
    // 获取缓存统计
    updateCacheStats()
  } catch (error) {
    console.error('加载文件失败：', error)
    message.error(`加载失败：${error.message}`)
    fileList.value = []
  } finally {
    loading.value = false
  }
}

// 更新缓存统计
const updateCacheStats = () => {
  cacheStats.value = cacheService.getCacheStats()
}

// 预加载缩略图 URL
const loadThumbnails = async (files) => {
  const imageFiles = files.filter(file => !file.isFolder && isImageFile(file.name))
  
  // 从缓存加载 URL
  fileUrlCache.value = cacheService.loadFileUrls()
  
  // 检查是否有自定义域名前缀
  const userSettings = store.state.userSettings
  const customDomain = userSettings?.customDomainPrefix?.trim().replace(/\/+$/, '')
  
  // 如果有自定义域名前缀，直接使用它构建 URL
  if (customDomain) {
    imageFiles.forEach(file => {
      if (!fileUrlCache.value[file.key]) {
        fileUrlCache.value[file.key] = `${customDomain}/${file.key}`
      }
    })
  } else {
    // 否则使用签名 URL
    await Promise.all(
      imageFiles.map(async (file) => {
        try {
          if (!fileUrlCache.value[file.key]) {
            const url = await s3Service.getSignedUrl(file.key, 3600 * 24) // 24 小时有效期
            fileUrlCache.value[file.key] = url
          }
        } catch (error) {
          console.error(`获取文件 ${file.key} 的 URL 失败:`, error)
        }
      })
    )
  }
  
  // 保存 URL 缓存
  cacheService.saveFileUrls(fileUrlCache.value)
}

// 获取文件缩略图 URL
const getFileUrl = (key) => {
  // 优先使用缓存中的 URL
  if (fileUrlCache.value[key]) {
    return fileUrlCache.value[key]
  }
  
  // 如果缓存中没有，尝试使用自定义域名前缀
  const userSettings = store.state.userSettings
  if (userSettings?.customDomainPrefix) {
    const domain = userSettings.customDomainPrefix.trim().replace(/\/+$/, '')
    return `${domain}/${key}`
  }
  
  // 没有自定义域名也没有缓存，返回 null
  return null
}

// 刷新文件列表 (强制刷新)
const refreshFiles = async () => {
  if (!checkS3Config.value) {
    message.warning('请先完成 S3 配置')
    return
  }
  
  loading.value = true
  message.info('正在刷新存储桶数据，这可能需要一些时间...')
  
  try {
    // 刷新整个存储桶数据
    await cacheService.refreshBucketData(s3Service)
    
    // 更新状态
    bucketTree.value = cacheService.getBucketTree()
    cacheTimestamp.value = Date.now()
    
    // 加载当前路径的文件
    fileList.value = cacheService.getFilesInPath(currentPath.value)
    
    // 清空 URL 缓存，以便重新生成
    fileUrlCache.value = {}
    
    // 预加载图片缩略图 URL
    await loadThumbnails(fileList.value)
    
    // 获取缓存统计
    updateCacheStats()
    
    message.success('存储桶数据刷新完成！')
  } catch (error) {
    console.error('刷新数据失败：', error)
    message.error(`刷新失败：${error.message}`)
  } finally {
    loading.value = false
  }
}

// 打开预览
const openPreview = (file) => {
  previewImage.value = file
  previewUrl.value = getFileUrl(file.key)
  if (previewUrl.value) {
    previewVisible.value = true
  } else {
    message.warning('无法加载预览图')
  }
}

// 关闭预览
const closePreview = () => {
  previewVisible.value = false
}

// 复制 URL
const copyUrl = async (key) => {
  try {
    let url = fileUrlCache.value[key]
    
    // 如果缓存中没有，重新获取
    if (!url) {
      // 检查是否有自定义域名前缀
      const userSettings = store.state.userSettings
      const customDomain = userSettings?.customDomainPrefix?.trim().replace(/\/+$/, '')
      
      if (customDomain) {
        // 使用自定义域名
        url = `${customDomain}/${key}`
      } else {
        // 否则获取签名 URL
        url = await s3Service.getSignedUrl(key)
      }
      
      // 保存到缓存
      fileUrlCache.value[key] = url
      
      // 更新 URL 缓存
      cacheService.saveFileUrls(fileUrlCache.value)
    }
    
    // 获取用户设置中的复制格式
    const userSettings = store.state.userSettings
    const copyFormat = userSettings?.copyFormat || 'url'
    const fileName = key.split('/').pop()
    
    let copyText = url
    
    // 根据设置的格式转换 URL
    if (copyFormat === 'markdown') {
      copyText = `![${fileName}](${url})`
    } else if (copyFormat === 'html') {
      copyText = `<img src="${url}" alt="${fileName}" />`
    }
    
    navigator.clipboard.writeText(copyText)
      .then(() => {
        message.success('链接已复制到剪贴板')
      })
      .catch(() => {
        message.error('复制失败，请手动复制')
        // 显示可复制的内容
        Modal.info({
          title: '请手动复制',
          content: h('div', [
            h('p', '请手动复制以下内容：'),
            h('pre', {
              style: 'background: #f5f5f5; padding: 8px; border-radius: 4px; overflow-x: auto;'
            }, copyText)
          ])
        })
      })
  } catch (error) {
    console.error('获取文件 URL 失败：', error)
    message.error(`获取链接失败：${error.message}`)
  }
}

// 删除文件
const deleteFile = async (key) => {
  loading.value = true
  
  try {
    await s3Service.deleteObject(key)
    message.success('文件已删除')
    
    // 从缓存中移除
    if (fileUrlCache.value[key]) {
      delete fileUrlCache.value[key]
      cacheService.saveFileUrls(fileUrlCache.value)
    }
    
    // 从当前列表中移除
    fileList.value = fileList.value.filter(file => file.key !== key)
    
    // 更新文件列表缓存
    cacheService.saveFileList(currentPath.value, fileList.value)
    
    // 更新树结构
    bucketTree.value = cacheService.getBucketTree()
    
    // 更新缓存统计
    updateCacheStats()
  } catch (error) {
    console.error('删除文件失败：', error)
    message.error(`删除失败：${error.message}`)
  } finally {
    loading.value = false
  }
}

// 切换显示树结构
const toggleBucketTree = () => {
  showBucketTree.value = !showBucketTree.value
}

// 从树结构导航
const navigateFromTree = (node) => {
  if (node) {
    navigateTo(node.path)
    if (showBucketTree.value) {
      showBucketTree.value = false
    }
  }
}

// 获取树中文件夹的子项数量
const getChildCount = (node) => {
  let count = 0
  if (node.files) count += node.files.length
  if (node.children) count += node.children.length
  return count
}

// 切换视图模式
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'list' ? 'grid' : 'list'
  // 保存用户偏好到本地存储
  localStorage.setItem('r2_image_hosting_view_mode', viewMode.value)
}

// 获取自定义域名前缀
const customDomainPrefix = computed(() => {
  const userSettings = store.state.userSettings
  return userSettings?.customDomainPrefix || null
})

// 挂载时加载数据
onMounted(() => {
  // 初始化缓存统计
  cacheStats.value = { totalSize: '0 B', fileCount: 0, urlCount: 0, bucketTreeSize: '0 B' }
  
  // 加载树结构
  bucketTree.value = cacheService.getBucketTree()
  
  // 加载 URL 缓存
  fileUrlCache.value = cacheService.loadFileUrls()
  
  // 加载视图模式偏好
  const savedViewMode = localStorage.getItem('r2_image_hosting_view_mode')
  if (savedViewMode) {
    viewMode.value = savedViewMode
  } else {
    // 如果没有保存的偏好，设置为默认九宫格模式并保存
    viewMode.value = 'grid'
    localStorage.setItem('r2_image_hosting_view_mode', 'grid')
  }
  
  // 从 Vuex 获取当前文件夹
  if (store.state.currentFolder) {
    currentPath.value = store.state.currentFolder
  }
  
  // 加载用户设置
  if (!store.state.userSettings) {
    // 尝试从 cacheService 加载
    const cachedSettings = cacheService.loadUserSettings()
    
    if (cachedSettings) {
      // 同步到 Vuex
      store.commit('setUserSettings', cachedSettings)
    } else {
      // 最后尝试从 localStorage 加载（兼容旧版本）
      const storedSettings = localStorage.getItem('userSettings')
      
      if (storedSettings) {
        try {
          const settings = JSON.parse(storedSettings)
          // 同步到 Vuex
          store.commit('setUserSettings', settings)
        } catch (e) {
          console.error('无法解析存储的设置：', e)
        }
      }
    }
  }

  // 检查是否有 S3 配置
  if (!checkS3Config.value) {
    // 尝试从缓存加载配置
    const cachedConfig = s3Service.loadConfigFromStorage() || cacheService.loadUserConfig();
    if (cachedConfig) {
      // 更新到 Vuex
      store.dispatch('saveConfig', cachedConfig).then(() => {
        // 配置加载成功后加载文件列表
        loadFiles()
      });
    }
  } else {
    // 有配置则直接加载文件列表
    loadFiles()
  }
  
  // 获取缓存统计
  updateCacheStats()
})

// 监听 S3 配置变化，如果配置了就加载文件
watch(
  () => store.state.s3Config,
  (newConfig) => {
    if (newConfig) {
      loadFiles()
    }
  }
)
</script>

<style scoped>
.manage-container {
  max-width: 1200px;
  margin: 0 auto;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
}

.thumbnail-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
}

.image-thumbnail {
  width: 50px;
  height: 50px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border-radius: 4px;
  background-color: #f0f0f0;
}

.image-thumbnail img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.folder-icon {
  font-size: 24px;
  color: #faad14;
}

.file-icon {
  font-size: 24px;
  color: #1890ff;
}

.image-icon {
  font-size: 24px;
  color: #52c41a;
}

.image-name {
  cursor: pointer;
  color: #1890ff;
}

.image-name:hover {
  text-decoration: underline;
}

.tree-container {
  overflow: auto;
  flex: 1;
}

.cache-stats {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 网格视图样式 */
.grid-view {
  padding: 4px 0; /* 减小上下内边距 */
}

.grid-card {
  height: 100%;
  margin-bottom: 6px; /* 减小卡片间距 */
}

.grid-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px; /* 减小内边距 */
  height: 180px; /* 增加高度以显示更大的图片 */
  overflow: hidden;
}

.grid-folder-icon {
  font-size: 56px; /* 增大文件夹图标 */
  color: #faad14;
  margin-bottom: 12px;
}

.grid-file-icon {
  font-size: 56px; /* 增大文件图标 */
  color: #1890ff;
  margin-bottom: 12px;
}

.grid-image-icon {
  font-size: 56px; /* 增大图像图标 */
  color: #52c41a;
  margin-bottom: 12px;
}

.grid-image-container {
  width: 100%;
  height: 160px; /* 增大图片容器高度 */
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px; /* 减小底部边距 */
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.grid-image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.grid-file-name {
  font-size: 14px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  margin-bottom: 4px;
  height: 28px;
}

.grid-file-info {
  font-size: 12px;
  color: #999;
  text-align: center;
}

.folder-card {
  cursor: pointer;
}

.image-card {
  cursor: pointer;
}


.empty-container {
  padding: 40px 0;
  text-align: center;
}
</style> 