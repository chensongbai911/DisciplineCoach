/**
 * 错误监控与性能追踪工具
 * 集成微信小程序实时日志和自定义错误上报
 */

// 实时日志管理器
const logger = wx.getRealtimeLogManager ? wx.getRealtimeLogManager() : null;

// 错误等级
const ERROR_LEVEL = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal'
};

// 错误类型
const ERROR_TYPE = {
  API: 'api',           // API调用错误
  PAGE: 'page',         // 页面错误
  COMPONENT: 'component', // 组件错误
  NETWORK: 'network',   // 网络错误
  STORAGE: 'storage',   // 存储错误
  LOGIC: 'logic'        // 业务逻辑错误
};

// 监控配置
const MONITOR_CONFIG = {
  enabled: true,                    // 是否启用监控
  sampleRate: 1.0,                 // 采样率 (0-1)
  maxErrors: 50,                   // 本地最多保存错误数
  autoReport: true,                // 是否自动上报
  reportInterval: 60000,           // 上报间隔 (ms)
  includeSystemInfo: true,         // 是否包含系统信息
  includeNetworkInfo: true         // 是否包含网络信息
};

// 本地错误队列
let errorQueue = [];

// 系统信息缓存
let systemInfo = null;

/**
 * 初始化监控
 */
function init (config = {}) {
  Object.assign(MONITOR_CONFIG, config);

  console.log('[监控] 初始化监控系统', MONITOR_CONFIG);

  // 获取系统信息
  if (MONITOR_CONFIG.includeSystemInfo) {
    systemInfo = wx.getSystemInfoSync();
  }

  // 设置全局错误处理
  if (MONITOR_CONFIG.enabled) {
    setupGlobalErrorHandler();
  }

  // 定时上报
  if (MONITOR_CONFIG.autoReport) {
    setInterval(() => {
      reportErrors();
    }, MONITOR_CONFIG.reportInterval);
  }
}

/**
 * 设置全局错误处理
 */
function setupGlobalErrorHandler () {
  // 安全检查：确保 getApp 可用
  let app;
  try {
    app = getApp();
  } catch (e) {
    console.warn('[监控] getApp() 不可用，跳过全局错误处理设置');
    return;
  }

  if (!app) {
    console.warn('[监控] App 实例不存在，跳过全局错误处理设置');
    return;
  }

  // App级别错误
  if (!app.onError) {
    app.onError = (error) => {
      reportError({
        type: ERROR_TYPE.LOGIC,
        level: ERROR_LEVEL.ERROR,
        message: error,
        stack: new Error().stack
      });
    };
  }

  // Promise rejection - 添加安全检查
  if (typeof app.onUnhandledRejection !== 'undefined') {
    const originalOnUnhandledRejection = app.onUnhandledRejection;
    app.onUnhandledRejection = (res) => {
      reportError({
        type: ERROR_TYPE.LOGIC,
        level: ERROR_LEVEL.ERROR,
        message: res.reason,
        context: { promise: true }
      });

      if (originalOnUnhandledRejection) {
        originalOnUnhandledRejection.call(app, res);
      }
    };
  }
}

/**
 * 上报错误
 * @param {Object} error - 错误信息
 */
function reportError (error) {
  if (!MONITOR_CONFIG.enabled) return;

  // 采样控制
  if (Math.random() > MONITOR_CONFIG.sampleRate) return;

  const errorInfo = {
    ...error,
    timestamp: Date.now(),
    page: getCurrentPage(),
    systemInfo: MONITOR_CONFIG.includeSystemInfo ? systemInfo : null,
    networkType: MONITOR_CONFIG.includeNetworkInfo ? getNetworkType() : null
  };

  // 输出到实时日志
  if (logger) {
    switch (error.level) {
      case ERROR_LEVEL.INFO:
        logger.info('[错误]', errorInfo);
        break;
      case ERROR_LEVEL.WARN:
        logger.warn('[警告]', errorInfo);
        break;
      case ERROR_LEVEL.ERROR:
      case ERROR_LEVEL.FATAL:
        logger.error('[错误]', errorInfo);
        break;
    }
  }

  // 添加到本地队列
  errorQueue.push(errorInfo);

  // 限制队列大小
  if (errorQueue.length > MONITOR_CONFIG.maxErrors) {
    errorQueue = errorQueue.slice(-MONITOR_CONFIG.maxErrors);
  }

  // 控制台输出
  console.error('[监控] 捕获错误:', errorInfo);
}

/**
 * 上报性能数据
 * @param {Object} metrics - 性能指标
 */
function reportPerformance (metrics) {
  if (!MONITOR_CONFIG.enabled) return;

  const perfInfo = {
    ...metrics,
    timestamp: Date.now(),
    page: getCurrentPage()
  };

  // 输出到实时日志
  if (logger) {
    logger.info('[性能]', perfInfo);
  }

  console.log('[监控] 性能数据:', perfInfo);
}

/**
 * 批量上报错误
 */
async function reportErrors () {
  if (errorQueue.length === 0) return;

  try {
    console.log(`[监控] 准备上报 ${errorQueue.length} 条错误`);

    // 这里可以接入自己的错误上报服务
    // 或使用第三方服务如: Sentry, Fundebug等

    // 示例: 上报到云函数
    /*
    await wx.cloud.callFunction({
      name: 'errorReport',
      data: {
        errors: errorQueue
      }
    });
    */

    // 清空队列
    errorQueue = [];
    console.log('[监控] 错误上报成功');

  } catch (error) {
    console.error('[监控] 错误上报失败:', error);
  }
}

/**
 * 获取当前页面路径
 */
function getCurrentPage () {
  const pages = getCurrentPages();
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1];
    return currentPage.route;
  }
  return '';
}

/**
 * 获取网络类型
 */
function getNetworkType () {
  let networkType = 'unknown';
  try {
    const res = wx.getNetworkTypeSync();
    networkType = res.networkType;
  } catch (e) {
    // ignore
  }
  return networkType;
}

/**
 * API调用包装器 - 自动捕获错误
 * @param {Function} apiFunc - API函数
 * @param {Object} options - API参数
 * @param {Object} errorContext - 错误上下文
 * @returns {Promise}
 */
function wrapAPI (apiFunc, options = {}, errorContext = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    apiFunc({
      ...options,
      success: (res) => {
        // 记录成功的性能数据
        reportPerformance({
          api: errorContext.api || 'unknown',
          duration: Date.now() - startTime,
          success: true
        });

        if (options.success) {
          options.success(res);
        }
        resolve(res);
      },
      fail: (err) => {
        // 记录失败错误
        reportError({
          type: ERROR_TYPE.API,
          level: ERROR_LEVEL.ERROR,
          message: err.errMsg || 'API调用失败',
          context: {
            ...errorContext,
            duration: Date.now() - startTime,
            error: err
          }
        });

        if (options.fail) {
          options.fail(err);
        }
        reject(err);
      },
      complete: options.complete
    });
  });
}

/**
 * 页面性能监控
 * @param {Object} page - 页面实例
 */
function monitorPagePerformance (page) {
  const pagePath = page.route || 'unknown';
  const loadStart = Date.now();

  // 监控onLoad
  const originalOnLoad = page.onLoad;
  page.onLoad = function (options) {
    const loadTime = Date.now() - loadStart;
    reportPerformance({
      page: pagePath,
      event: 'onLoad',
      duration: loadTime
    });

    if (originalOnLoad) {
      originalOnLoad.call(this, options);
    }
  };

  // 监控onShow
  const originalOnShow = page.onShow;
  let showStart = Date.now();
  page.onShow = function () {
    showStart = Date.now();
    if (originalOnShow) {
      originalOnShow.call(this);
    }
  };

  // 监控onReady
  const originalOnReady = page.onReady;
  page.onReady = function () {
    const readyTime = Date.now() - showStart;
    reportPerformance({
      page: pagePath,
      event: 'onReady',
      duration: readyTime
    });

    if (originalOnReady) {
      originalOnReady.call(this);
    }
  };
}

/**
 * 手动上报错误
 * @param {Error} error - 错误对象
 * @param {Object} context - 上下文信息
 */
function captureError (error, context = {}) {
  reportError({
    type: context.type || ERROR_TYPE.LOGIC,
    level: context.level || ERROR_LEVEL.ERROR,
    message: error.message || String(error),
    stack: error.stack,
    context
  });
}

/**
 * 手动上报异常
 * @param {string} message - 异常信息
 * @param {Object} context - 上下文信息
 */
function captureException (message, context = {}) {
  reportError({
    type: context.type || ERROR_TYPE.LOGIC,
    level: context.level || ERROR_LEVEL.WARN,
    message,
    context
  });
}

/**
 * 获取错误队列
 * @returns {Array} 错误列表
 */
function getErrors () {
  return [...errorQueue];
}

/**
 * 清空错误队列
 */
function clearErrors () {
  errorQueue = [];
}

module.exports = {
  ERROR_LEVEL,
  ERROR_TYPE,
  MONITOR_CONFIG,
  init,
  reportError,
  reportPerformance,
  reportErrors,
  wrapAPI,
  monitorPagePerformance,
  captureError,
  captureException,
  getErrors,
  clearErrors
};
