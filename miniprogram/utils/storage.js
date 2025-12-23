/**
 * storage.js - 本地存储工具函数
 */

/**
 * 存储数据
 * @param {string} key - 键名
 * @param {*} value - 值
 * @returns {boolean} 是否成功
 */
function setStorage (key, value) {
  try {
    wx.setStorageSync(key, value)
    return true
  } catch (err) {
    console.error('存储失败:', key, err)
    return false
  }
}

/**
 * 获取数据
 * @param {string} key - 键名
 * @param {*} defaultValue - 默认值
 * @returns {*}
 */
function getStorage (key, defaultValue = null) {
  try {
    const value = wx.getStorageSync(key)
    return value || defaultValue
  } catch (err) {
    console.error('读取失败:', key, err)
    return defaultValue
  }
}

/**
 * 删除数据
 * @param {string} key - 键名
 * @returns {boolean}
 */
function removeStorage (key) {
  try {
    wx.removeStorageSync(key)
    return true
  } catch (err) {
    console.error('删除失败:', key, err)
    return false
  }
}

/**
 * 清空所有数据
 * @returns {boolean}
 */
function clearStorage () {
  try {
    wx.clearStorageSync()
    return true
  } catch (err) {
    console.error('清空失败:', err)
    return false
  }
}

/**
 * 获取存储信息
 * @returns {object} {keys, currentSize, limitSize}
 */
function getStorageInfo () {
  try {
    return wx.getStorageInfoSync()
  } catch (err) {
    console.error('获取存储信息失败:', err)
    return null
  }
}

// 常用键名常量
const KEYS = {
  OPENID: 'openid',
  USER_INFO: 'userInfo',
  PLANS: 'plans',
  TODAY_RECORDS: 'todayRecords',
  SETTINGS: 'settings',
  COACH_MESSAGES: 'coachMessages'
}

/**
 * 缓存管理器 - 支持过期时间和版本控制
 */
const CacheManager = {
  // 缓存版本号
  VERSION: '1.0.0',

  /**
   * 设置缓存（带过期时间）
   * @param {string} key - 缓存键名
   * @param {*} data - 要缓存的数据
   * @param {number} expireMs - 过期时间（毫秒），默认5分钟
   */
  set (key, data, expireMs = 5 * 60 * 1000) {
    try {
      const cacheData = {
        data,
        expire: Date.now() + expireMs,
        version: this.VERSION,
        timestamp: Date.now()
      }
      wx.setStorageSync(`cache_${key}`, cacheData)
      console.log(`[Cache] 设置缓存: ${key}, 过期时间: ${expireMs}ms`)
      return true
    } catch (err) {
      console.error(`[Cache] 设置缓存失败: ${key}`, err)
      return false
    }
  },

  /**
   * 获取缓存
   * @param {string} key - 缓存键名
   * @returns {*} 缓存的数据，如果过期或不存在返回 null
   */
  get (key) {
    try {
      const cache = wx.getStorageSync(`cache_${key}`)
      if (!cache) {
        return null
      }

      // 检查版本
      if (cache.version !== this.VERSION) {
        console.log(`[Cache] 缓存版本不匹配: ${key}`)
        this.remove(key)
        return null
      }

      // 检查是否过期
      if (cache.expire < Date.now()) {
        console.log(`[Cache] 缓存已过期: ${key}`)
        this.remove(key)
        return null
      }

      console.log(`[Cache] 使用缓存: ${key}`)
      return cache.data
    } catch (err) {
      console.error(`[Cache] 读取缓存失败: ${key}`, err)
      return null
    }
  },

  /**
   * 检查缓存是否有效
   * @param {string} key - 缓存键名
   * @returns {boolean}
   */
  isValid (key) {
    return this.get(key) !== null
  },

  /**
   * 删除缓存
   * @param {string} key - 缓存键名
   */
  remove (key) {
    try {
      wx.removeStorageSync(`cache_${key}`)
      console.log(`[Cache] 删除缓存: ${key}`)
      return true
    } catch (err) {
      console.error(`[Cache] 删除缓存失败: ${key}`, err)
      return false
    }
  },

  /**
   * 清除所有缓存
   */
  clearAll () {
    try {
      const info = wx.getStorageInfoSync()
      const cacheKeys = info.keys.filter(k => k.startsWith('cache_'))
      cacheKeys.forEach(key => {
        wx.removeStorageSync(key)
      })
      console.log(`[Cache] 清除所有缓存，共 ${cacheKeys.length} 项`)
      return true
    } catch (err) {
      console.error('[Cache] 清除缓存失败', err)
      return false
    }
  },

  /**
   * 获取缓存信息
   * @returns {object} {count, size}
   */
  getInfo () {
    try {
      const info = wx.getStorageInfoSync()
      const cacheKeys = info.keys.filter(k => k.startsWith('cache_'))
      return {
        count: cacheKeys.length,
        keys: cacheKeys,
        totalSize: info.currentSize,
        limitSize: info.limitSize
      }
    } catch (err) {
      console.error('[Cache] 获取缓存信息失败', err)
      return null
    }
  }
}

// 预定义的缓存过期时间
const CACHE_EXPIRE = {
  SHORT: 5 * 60 * 1000,      // 5分钟 - 计划列表
  MEDIUM: 30 * 60 * 1000,    // 30分钟 - 记录数据
  LONG: 60 * 60 * 1000,      // 1小时 - 统计数据
  VERY_LONG: 24 * 60 * 60 * 1000  // 1天 - 用户信息
}

module.exports = {
  setStorage,
  getStorage,
  removeStorage,
  clearStorage,
  getStorageInfo,
  KEYS,
  CacheManager,
  CACHE_EXPIRE
}
