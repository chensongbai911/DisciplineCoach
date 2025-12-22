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

module.exports = {
  setStorage,
  getStorage,
  removeStorage,
  clearStorage,
  getStorageInfo,
  KEYS
}
