/**
 * performance.js - 性能监控工具
 * 用于追踪页面加载时间、API调用耗时等性能指标
 */

// 性能数据存储
const performanceData = {}

// 性能阈值配置（毫秒）
const THRESHOLDS = {
  PAGE_LOAD: 1000,      // 页面加载
  API_CALL: 2000,       // API调用
  IMAGE_LOAD: 3000,     // 图片加载
  RENDER: 500           // 渲染耗时
}

/**
 * 开始计时
 * @param {string} key - 计时键名
 */
function startTimer (key) {
  performanceData[key] = {
    startTime: Date.now(),
    endTime: null,
    duration: null
  }
  console.log(`[Performance] 开始计时: ${key}`)
}

/**
 * 结束计时
 * @param {string} key - 计时键名
 * @param {object} options - 配置选项
 * @returns {number} 耗时（毫秒）
 */
function endTimer (key, options = {}) {
  const {
    log = true,           // 是否打印日志
    threshold = null,     // 性能阈值
    report = false        // 是否上报
  } = options

  if (!performanceData[key]) {
    console.warn(`[Performance] 计时器不存在: ${key}`)
    return 0
  }

  const data = performanceData[key]
  data.endTime = Date.now()
  data.duration = data.endTime - data.startTime

  // 日志输出
  if (log) {
    const thresholdValue = threshold || getThreshold(key)
    const status = data.duration > thresholdValue ? '⚠️ 慢' : '✅ 快'
    console.log(`[Performance] ${status} ${key}: ${data.duration}ms`)
  }

  // 性能上报
  if (report) {
    reportPerformance(key, data.duration)
  }

  return data.duration
}

/**
 * 获取性能阈值
 * @param {string} key - 计时键名
 * @returns {number}
 */
function getThreshold (key) {
  if (key.includes('page')) return THRESHOLDS.PAGE_LOAD
  if (key.includes('api')) return THRESHOLDS.API_CALL
  if (key.includes('image')) return THRESHOLDS.IMAGE_LOAD
  if (key.includes('render')) return THRESHOLDS.RENDER
  return 1000
}

/**
 * 测量函数执行时间
 * @param {string} name - 函数名称
 * @param {Function} fn - 要执行的函数
 * @returns {Promise}
 */
async function measureAsync (name, fn) {
  startTimer(name)
  try {
    const result = await fn()
    endTimer(name)
    return result
  } catch (error) {
    endTimer(name, { log: true })
    throw error
  }
}

/**
 * 测量同步函数执行时间
 * @param {string} name - 函数名称
 * @param {Function} fn - 要执行的函数
 * @returns {*}
 */
function measure (name, fn) {
  startTimer(name)
  try {
    const result = fn()
    endTimer(name)
    return result
  } catch (error) {
    endTimer(name, { log: true })
    throw error
  }
}

/**
 * 获取所有性能数据
 * @returns {object}
 */
function getPerformanceData () {
  return { ...performanceData }
}

/**
 * 获取性能统计摘要
 * @returns {object}
 */
function getPerformanceSummary () {
  const keys = Object.keys(performanceData)
  const durations = keys
    .filter(key => performanceData[key].duration !== null)
    .map(key => performanceData[key].duration)

  if (durations.length === 0) {
    return {
      count: 0,
      total: 0,
      avg: 0,
      min: 0,
      max: 0
    }
  }

  return {
    count: durations.length,
    total: durations.reduce((sum, d) => sum + d, 0),
    avg: Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length),
    min: Math.min(...durations),
    max: Math.max(...durations)
  }
}

/**
 * 清除性能数据
 * @param {string} key - 要清除的键名，不传则清除所有
 */
function clearPerformanceData (key) {
  if (key) {
    delete performanceData[key]
  } else {
    Object.keys(performanceData).forEach(k => delete performanceData[k])
  }
  console.log('[Performance] 清除性能数据')
}

/**
 * 性能数据上报（集成监控平台）
 * @param {string} key - 指标名称
 * @param {number} duration - 耗时
 */
function reportPerformance (key, duration) {
  try {
    // 使用统一的监控系统
    const monitor = require('./monitor.js');

    monitor.reportPerformance({
      metric: key,
      duration,
      page: getCurrentPage()
    });

    // 同时使用实时日志(兼容旧逻辑)
    const logManager = wx.getRealtimeLogManager?.();
    if (logManager) {
      logManager.info('performance', {
        metric: key,
        duration,
        timestamp: Date.now(),
        page: getCurrentPage()
      })
    }
  } catch (e) {
    console.warn('性能上报失败:', e)
  }
}

/**
 * 获取当前页面路径
 * @returns {string}
 */
function getCurrentPage () {
  try {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    return currentPage?.route || 'unknown'
  } catch (e) {
    return 'unknown'
  }
}

/**
 * 页面性能监控装饰器
 * @param {string} pageName - 页面名称
 * @returns {object}
 */
function pagePerformance (pageName) {
  return {
    onLoad (options) {
      startTimer(`${pageName}_load`)
    },

    onReady () {
      endTimer(`${pageName}_load`, {
        log: true,
        threshold: THRESHOLDS.PAGE_LOAD,
        report: true
      })
    },

    onShow () {
      startTimer(`${pageName}_show`)
    },

    onHide () {
      if (performanceData[`${pageName}_show`]) {
        endTimer(`${pageName}_show`, { log: false })
      }
    }
  }
}

module.exports = {
  startTimer,
  endTimer,
  measureAsync,
  measure,
  getPerformanceData,
  getPerformanceSummary,
  clearPerformanceData,
  pagePerformance,
  THRESHOLDS
}
