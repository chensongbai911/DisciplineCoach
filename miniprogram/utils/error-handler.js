/**
 * error-handler.js - 统一错误处理工具
 * 提供友好的错误提示和错误上报
 */

const vibrate = require('./vibrate.js')

// 错误类型映射
const ERROR_TYPES = {
  NETWORK: 'network',
  AUTH: 'auth',
  BUSINESS: 'business',
  VALIDATION: 'validation',
  PERMISSION: 'permission',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown'
}

// 错误信息映射
const ERROR_MESSAGES = {
  // 网络错误
  'network': '网络连接失败，请检查网络设置',
  'timeout': '请求超时，请稍后重试',

  // 认证错误
  'auth': '登录已过期，请重新登录',
  'permission': '暂无权限，请联系管理员',

  // 业务错误
  'not_found': '数据不存在',
  'already_exists': '数据已存在',
  'invalid_data': '数据格式错误',

  // 验证错误
  'validation': '输入信息有误，请检查',
  'required': '必填项不能为空',

  // 默认错误
  'unknown': '操作失败，请稍后重试'
}

/**
 * 统一错误处理
 * @param {Error|string} error - 错误对象或错误消息
 * @param {object} options - 配置选项
 * @returns {object} 处理后的错误信息
 */
function handleError (error, options = {}) {
  const {
    showToast = true,        // 是否显示提示
    vibrate: shouldVibrate = true,  // 是否震动反馈
    report = false,          // 是否上报错误
    context = ''             // 错误上下文
  } = options

  // 解析错误信息
  const errorInfo = parseError(error)

  // 日志记录
  console.error(`[ErrorHandler] ${context}:`, errorInfo)

  // 显示用户友好提示
  if (showToast) {
    wx.showToast({
      title: errorInfo.message,
      icon: 'none',
      duration: 2500
    })
  }

  // 震动反馈
  if (shouldVibrate) {
    vibrate.error()
  }

  // 错误上报
  if (report) {
    reportError(errorInfo, context)
  }

  return errorInfo
}

/**
 * 解析错误对象
 * @param {Error|string} error - 错误
 * @returns {object} 错误信息
 */
function parseError (error) {
  let type = ERROR_TYPES.UNKNOWN
  let message = ERROR_MESSAGES.unknown
  let code = null
  let detail = null

  if (typeof error === 'string') {
    message = error
  } else if (error instanceof Error) {
    message = error.message || ERROR_MESSAGES.unknown
    detail = error.stack

    // 判断错误类型
    if (error.message.includes('网络') || error.message.includes('network')) {
      type = ERROR_TYPES.NETWORK
      message = ERROR_MESSAGES.network
    } else if (error.message.includes('超时') || error.message.includes('timeout')) {
      type = ERROR_TYPES.TIMEOUT
      message = ERROR_MESSAGES.timeout
    } else if (error.message.includes('登录') || error.message.includes('auth')) {
      type = ERROR_TYPES.AUTH
      message = ERROR_MESSAGES.auth
    } else if (error.message.includes('权限') || error.message.includes('permission')) {
      type = ERROR_TYPES.PERMISSION
      message = ERROR_MESSAGES.permission
    }
  } else if (typeof error === 'object') {
    // 云函数错误格式
    code = error.code || error.errCode
    message = error.message || error.errMsg || ERROR_MESSAGES.unknown
    type = error.type || ERROR_TYPES.BUSINESS
  }

  return {
    type,
    code,
    message,
    detail,
    timestamp: Date.now()
  }
}

/**
 * 错误上报（集成监控平台）
 * @param {object} errorInfo - 错误信息
 * @param {string} context - 上下文
 */
function reportError (errorInfo, context) {
  try {
    // 使用统一的监控系统
    const monitor = require('./monitor.js');

    monitor.reportError({
      type: monitor.ERROR_TYPE.LOGIC,
      level: monitor.ERROR_LEVEL.ERROR,
      message: errorInfo.message || '未知错误',
      stack: errorInfo.stack,
      context: {
        ...errorInfo,
        contextName: context,
        userInfo: getCurrentUserInfo()
      }
    });

    // 同时使用实时日志(兼容旧逻辑)
    const logManager = wx.getRealtimeLogManager?.();
    if (logManager) {
      logManager.error({
        context,
        ...errorInfo,
        userInfo: getCurrentUserInfo()
      });
    }
  } catch (e) {
    console.warn('错误上报失败:', e);
  }
}
}

/**
 * 获取当前用户信息（用于错误上报）
 * @returns {object}
 */
function getCurrentUserInfo () {
  try {
    const app = getApp()
    return {
      openid: app.globalData.openid || 'unknown',
      version: app.data?.version || '1.0.0'
    }
  } catch (e) {
    return {}
  }
}

/**
 * Promise错误包装器
 * @param {Promise} promise - Promise对象
 * @param {object} options - 错误处理选项
 * @returns {Promise}
 */
async function catchAsync (promise, options = {}) {
  try {
    const result = await promise
    return [null, result]
  } catch (error) {
    const errorInfo = handleError(error, options)
    return [errorInfo, null]
  }
}

/**
 * 函数错误包装器
 * @param {Function} fn - 要执行的函数
 * @param {object} options - 错误处理选项
 * @returns {Function}
 */
function wrapErrorHandler (fn, options = {}) {
  return async function (...args) {
    try {
      return await fn.apply(this, args)
    } catch (error) {
      handleError(error, {
        ...options,
        context: fn.name || 'anonymous'
      })
      throw error
    }
  }
}

module.exports = {
  handleError,
  parseError,
  catchAsync,
  wrapErrorHandler,
  ERROR_TYPES,
  ERROR_MESSAGES
}
