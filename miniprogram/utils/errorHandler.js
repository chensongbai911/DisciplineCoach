/**
 * errorHandler.js - 统一错误处理工具
 */

/**
 * 错误类型映射
 */
const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_FAILED: 'AUTH_FAILED',
  PARAM_INVALID: 'PARAM_INVALID',
  SERVER_ERROR: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  CLOUD_FUNCTION_ERROR: 'CLOUD_FUNCTION_ERROR'
};

/**
 * 错误信息配置
 */
const ERROR_CONFIG = {
  NETWORK_ERROR: {
    title: '网络连接失败',
    message: '请检查网络连接后重试',
    confirmText: '重试',
    showCancel: true,
    action: 'retry'
  },
  AUTH_FAILED: {
    title: '登录已过期',
    message: '请重新登录后继续使用',
    confirmText: '去登录',
    showCancel: false,
    action: 'relogin'
  },
  PARAM_INVALID: {
    title: '参数错误',
    message: '请检查输入信息是否正确',
    confirmText: '我知道了',
    showCancel: false,
    action: 'none'
  },
  SERVER_ERROR: {
    title: '服务器繁忙',
    message: '服务器正在处理大量请求，请稍后再试',
    confirmText: '我知道了',
    showCancel: true,
    cancelText: '重试',
    action: 'retry'
  },
  NOT_FOUND: {
    title: '数据不存在',
    message: '您访问的数据不存在或已被删除',
    confirmText: '返回',
    showCancel: false,
    action: 'back'
  },
  PERMISSION_DENIED: {
    title: '权限不足',
    message: '您没有权限执行此操作',
    confirmText: '我知道了',
    showCancel: false,
    action: 'none'
  },
  CLOUD_FUNCTION_ERROR: {
    title: '功能异常',
    message: '系统功能出现异常，请稍后重试',
    confirmText: '重试',
    showCancel: true,
    action: 'retry'
  }
};

/**
 * 解析错误类型
 */
function parseErrorType (error) {
  // 网络错误
  if (error.errMsg && error.errMsg.includes('request:fail')) {
    return ERROR_TYPES.NETWORK_ERROR;
  }

  // 云函数错误
  if (error.errMsg && error.errMsg.includes('cloud.callFunction')) {
    return ERROR_TYPES.CLOUD_FUNCTION_ERROR;
  }

  // 根据错误码判断
  if (error.code) {
    switch (error.code) {
      case 401:
      case 'AUTH_FAILED':
        return ERROR_TYPES.AUTH_FAILED;
      case 400:
      case 'PARAM_INVALID':
        return ERROR_TYPES.PARAM_INVALID;
      case 404:
      case 'NOT_FOUND':
        return ERROR_TYPES.NOT_FOUND;
      case 403:
      case 'PERMISSION_DENIED':
        return ERROR_TYPES.PERMISSION_DENIED;
      case 500:
      case 'SERVER_ERROR':
        return ERROR_TYPES.SERVER_ERROR;
    }
  }

  // 默认为服务器错误
  return ERROR_TYPES.SERVER_ERROR;
}

/**
 * 处理 API 错误
 * @param {Error} error - 错误对象
 * @param {Object} options - 配置选项
 * @param {Function} options.onRetry - 重试回调
 * @param {Function} options.onCancel - 取消回调
 * @returns {Promise}
 */
function handleAPIError (error, options = {}) {
  console.error('[错误处理]', error);

  const errorType = parseErrorType(error);
  const config = ERROR_CONFIG[errorType] || ERROR_CONFIG.SERVER_ERROR;

  // 自定义消息
  const message = error.message || error.errMsg || config.message;

  return new Promise((resolve, reject) => {
    wx.showModal({
      title: config.title,
      content: message,
      confirmText: config.confirmText,
      showCancel: config.showCancel,
      cancelText: config.cancelText || '取消',
      success: (res) => {
        if (res.confirm) {
          // 处理确认操作
          switch (config.action) {
            case 'retry':
              if (options.onRetry) {
                options.onRetry();
                resolve('retry');
              }
              break;
            case 'relogin':
              // 重新登录
              const app = getApp();
              if (app && app.login) {
                app.login();
              }
              resolve('relogin');
              break;
            case 'back':
              wx.navigateBack();
              resolve('back');
              break;
            default:
              resolve('confirm');
          }
        } else if (res.cancel) {
          // 处理取消操作
          if (config.showCancel && config.cancelText === '重试' && options.onRetry) {
            options.onRetry();
            resolve('retry');
          } else {
            if (options.onCancel) {
              options.onCancel();
            }
            resolve('cancel');
          }
        }
      },
      fail: () => {
        reject(error);
      }
    });
  });
}

/**
 * 显示友好的错误提示
 * @param {String} message - 错误消息
 * @param {Number} duration - 显示时长（毫秒）
 */
function showErrorToast (message, duration = 2000) {
  wx.showToast({
    title: message,
    icon: 'none',
    duration
  });
}

/**
 * 处理网络错误
 */
function handleNetworkError (onRetry) {
  return handleAPIError(
    { errMsg: 'request:fail' },
    { onRetry }
  );
}

/**
 * 处理云函数错误
 */
function handleCloudFunctionError (error, onRetry) {
  const customError = {
    ...error,
    errMsg: 'cloud.callFunction:fail',
    message: error.message || '云函数调用失败'
  };

  return handleAPIError(customError, { onRetry });
}

/**
 * 包装 API 调用，自动处理错误
 * @param {Function} apiFunc - API 函数
 * @param {Object} options - 配置选项
 */
async function wrapAPICall (apiFunc, options = {}) {
  const {
    loading = true,
    loadingText = '加载中...',
    errorHandler = handleAPIError,
    maxRetries = 3
  } = options;

  let retries = 0;

  const execute = async () => {
    if (loading) {
      wx.showLoading({ title: loadingText, mask: true });
    }

    try {
      const result = await apiFunc();

      if (loading) {
        wx.hideLoading();
      }

      return result;
    } catch (error) {
      if (loading) {
        wx.hideLoading();
      }

      // 如果还有重试次数
      if (retries < maxRetries) {
        const action = await errorHandler(error, {
          onRetry: () => {
            retries++;
            return execute();
          }
        });

        if (action === 'retry') {
          return execute();
        }
      } else {
        // 达到最大重试次数
        showErrorToast('操作失败，请稍后再试');
      }

      throw error;
    }
  };

  return execute();
}

module.exports = {
  ERROR_TYPES,
  handleAPIError,
  showErrorToast,
  handleNetworkError,
  handleCloudFunctionError,
  wrapAPICall
};
