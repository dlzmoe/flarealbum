import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createStore } from 'vuex'
import { createRouter, createWebHistory } from 'vue-router'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'
import s3Service from './services/s3Service'

// 引入路由配置
import routes from './router'

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
  // 添加 scrollBehavior 配置，确保路由切换后滚动到顶部
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置（例如用户点击了后退按钮），则使用保存的位置
    if (savedPosition) {
      return savedPosition
    } else {
      // 否则滚动到顶部
      return { top: 0 }
    }
  }
})

// 从本地存储加载配置
const loadConfigFromStorage = () => {
  return s3Service.loadConfigFromStorage()
}

// 创建 Vuex 存储
const store = createStore({
  state() {
    return {
      s3Config: loadConfigFromStorage(),
      imageList: [],
      currentFolder: '',
      loading: false
    }
  },
  mutations: {
    setS3Config(state, config) {
      state.s3Config = config
      // 如果配置有效，初始化 S3 服务
      if (config && config.endpoint && config.accessKeyId && config.secretAccessKey) {
        s3Service.initialize(config)
      }
    },
    setImageList(state, list) {
      state.imageList = list
    },
    setCurrentFolder(state, folder) {
      state.currentFolder = folder
    },
    setLoading(state, status) {
      state.loading = status
    }
  },
  actions: {
    // 保存配置并初始化服务
    saveConfig({ commit }, config) {
      // 保存到 Vuex
      commit('setS3Config', config)
      
      // 安全地保存到本地存储，包括密钥
      s3Service.saveConfigToStorage(config)
      
      return true
    }
  }
})

// 初始化 S3 服务 (如果本地存储中有配置)
if (store.state.s3Config) {
  s3Service.initialize(store.state.s3Config)
}

const app = createApp(App)
app.use(router)
app.use(store)
app.use(Antd)
app.mount('#app')
