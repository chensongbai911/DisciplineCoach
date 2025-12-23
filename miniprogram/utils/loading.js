/**
 * loading.js - 增强的加载状态管理工具
 * 支持场景化文案和自定义loading组件
 */

// 场景化加载文案
const LOADING_TEXTS = {
  'default': '加载中...',
  'login': '登录中...',
  'saving': '保存中...',
  'uploading': '上传中...',
  'deleting': '删除中...',
  'submitting': '提交中...',
  'loading-data': '加载数据中...',
  'syncing': '同步中...',
  'processing': '处理中...',
  'generating': '生成海报中...',
  'exporting': '导出中...',
  'importing': '导入中...',
  'calculating': '计算中...',
  'refreshing': '刷新中...'
}

// loading 状态管理
let loadingCount = 0
let loadingTimer = null

/**
 * 显示加载状态
 * @param {string|object} options - 加载提示文本或配置对象
 * 支持格式:
 * 1. showLoading('加载中...')
 * 2. showLoading({ type: 'saving', text: '保存中...', mask: true })
 */
function showLoading (options = 'default') {
  loadingCount++

  let config = {
    title: '加载中...',
    mask: true
  }

  if (typeof options === 'string') {
    config.title = LOADING_TEXTS[options] || options
  } else if (typeof options === 'object') {
    config.title = options.text || LOADING_TEXTS[options.type] || LOADING_TEXTS['default']
    config.mask = options.mask !== undefined ? options.mask : true
  }

  // 清除之前的定时器
  if (loadingTimer) {
    clearTimeout(loadingTimer)
  }

  wx.showLoading(config)

  // 自动超时保护（15秒）
  loadingTimer = setTimeout(() => {
    hideLoading()
    wx.showToast({
      title: '加载超时，请重试',
      icon: 'none',
      duration: 2000
    })
  }, 15000)
}

/**
 * 隐藏加载状态
 * @param {boolean} force - 是否强制隐藏（忽略引用计数）
 */
function hideLoading (force = false) {
  if (force) {
    loadingCount = 0
  } else {
    loadingCount = Math.max(0, loadingCount - 1)
  }

  if (loadingCount === 0) {
    wx.hideLoading()
    if (loadingTimer) {
      clearTimeout(loadingTimer)
      loadingTimer = null
    }
  }
}

/**
 * 显示自定义loading（通过事件通知页面组件）
 * @param {string} text - 加载文案
 */
function showCustomLoading (text = '加载中...') {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]

  if (currentPage && typeof currentPage.setData === 'function') {
    currentPage.setData({
      customLoadingShow: true,
      customLoadingText: text
    })
  }
}

/**
 * 隐藏自定义loading
 */
function hideCustomLoading () {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]

  if (currentPage && typeof currentPage.setData === 'function') {
    currentPage.setData({
      customLoadingShow: false
    })
  }
}

/**
 * 重置loading状态
 */
function resetLoading () {
  loadingCount = 0
  if (loadingTimer) {
    clearTimeout(loadingTimer)
    loadingTimer = null
  }
  wx.hideLoading()
}

module.exports = {
  showLoading,
  hideLoading,
  showCustomLoading,
  hideCustomLoading,
  resetLoading,
  LOADING_TEXTS
}
