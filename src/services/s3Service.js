import { 
  S3Client, 
  ListObjectsV2Command, 
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

class S3Service {
  constructor(config) {
    this.client = null
    this.config = null
    if (config) {
      this.initialize(config)
    }
  }

  initialize(config) {
    this.config = config
    this.client = new S3Client({
      region: config.region || 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    })
  }

  // 简单加密配置，用于本地存储（仅基础保护）
  encryptConfig(config) {
    try {
      // 注意：这不是真正的加密，只是简单的编码
      // 生产环境应使用更安全的加密方法
      const jsonStr = JSON.stringify(config)
      return btoa(jsonStr)
    } catch (e) {
      console.error('加密配置失败', e)
      return null
    }
  }

  // 解密配置
  decryptConfig(encryptedData) {
    try {
      // 解码
      const jsonStr = atob(encryptedData)
      return JSON.parse(jsonStr)
    } catch (e) {
      console.error('解密配置失败', e)
      return null
    }
  }

  // 保存配置到本地存储
  saveConfigToStorage(config) {
    try {
      const encrypted = this.encryptConfig(config)
      if (encrypted) {
        localStorage.setItem('s3ConfigData', encrypted)
        return true
      }
      return false
    } catch (e) {
      console.error('保存配置失败', e)
      return false
    }
  }

  // 从本地存储加载配置
  loadConfigFromStorage() {
    try {
      const encrypted = localStorage.getItem('s3ConfigData')
      if (encrypted) {
        return this.decryptConfig(encrypted)
      }
      return null
    } catch (e) {
      console.error('加载配置失败', e)
      return null
    }
  }

  async listObjects(prefix = '') {
    if (!this.client) {
      throw new Error('S3 客户端未初始化，请先配置存储')
    }

    try {
      // 标准化前缀，避免双斜杠问题
      const normalizedPrefix = prefix.replace(/\/+/g, '/').replace(/^\//, '')
      
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: normalizedPrefix,
        Delimiter: '/'
      })
      
      const response = await this.client.send(command)
      
      // 处理文件夹
      const folders = (response.CommonPrefixes || []).map(prefix => {
        // 确保前缀中没有重复的斜杠
        const normalizedPrefix = prefix.Prefix.replace(/\/+/g, '/');
        return {
          key: normalizedPrefix,
          name: normalizedPrefix.split('/').filter(Boolean).pop() + '/',
          isFolder: true,
          size: 0,
          lastModified: null
        };
      })
      
      // 处理文件
      const files = (response.Contents || [])
        .filter(item => item.Key !== normalizedPrefix) // 过滤掉当前前缀
        .map(item => ({
          key: item.Key,
          name: item.Key.split('/').pop(),
          isFolder: false,
          size: item.Size,
          lastModified: item.LastModified
        }))
      
      return [...folders, ...files]
    } catch (error) {
      console.error('列出对象失败：', error)
      throw error
    }
  }
  
  async uploadFile(file, key) {
    if (!this.client) {
      throw new Error('S3 客户端未初始化，请先配置存储')
    }
    
    // 如果没有提供 key，则使用文件名
    if (!key) {
      key = file.name
    }
    
    try {
      // 将 File 对象转换为 ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: new Uint8Array(arrayBuffer),
        ContentType: file.type
      })
      
      const response = await this.client.send(command)
      
      // 构建完整的文件 URL
      const fileUrl = `${this.config.endpoint}/${this.config.bucket}/${key}`
      
      return {
        success: true,
        key,
        url: fileUrl,
        response
      }
    } catch (error) {
      console.error('上传文件失败：', error)
      throw error
    }
  }
  
  async deleteObject(key) {
    if (!this.client) {
      throw new Error('S3 客户端未初始化，请先配置存储')
    }
    
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key
      })
      
      const response = await this.client.send(command)
      
      return {
        success: true,
        key,
        response
      }
    } catch (error) {
      console.error('删除对象失败：', error)
      throw error
    }
  }
  
  async getSignedUrl(key, expiresIn = 3600) {
    if (!this.client) {
      throw new Error('S3 客户端未初始化，请先配置存储')
    }
    
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key
      })
      
      const signedUrl = await getSignedUrl(this.client, command, {
        expiresIn
      })
      
      return signedUrl
    } catch (error) {
      console.error('获取签名 URL 失败：', error)
      throw error
    }
  }
}

export default new S3Service() 