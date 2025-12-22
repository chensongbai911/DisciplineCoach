/**
 * common.js - 通用工具函数
 */

/**
 * 显示提示消息
 * @param {string} title - 提示文本
 * @param {string} icon - 图标类型 success/error/loading/none
 * @param {number} duration - 持续时间(ms)
 */
function showToast (title, icon = 'none', duration = 2000) {
  wx.showToast({
    title,
    icon,
    duration
  });
}

/**
 * 显示加载中
 * @param {string|object} options - 加载提示文本或配置对象
 * 支持格式:
 * 1. showLoading('加载中...')
 * 2. showLoading({ type: 'saving', text: '保存中...' })
 */
function showLoading (options = '加载中...') {
  // 场景化文案映射
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
    'generating': '生成中...'
  };

  let title = '加载中...';

  if (typeof options === 'string') {
    title = options;
  } else if (typeof options === 'object') {
    title = options.text || LOADING_TEXTS[options.type] || LOADING_TEXTS['default'];
  }

  wx.showLoading({
    title,
    mask: true
  });
}

/**
 * 隐藏加载中
 */
function hideLoading () {
  wx.hideLoading();
}

/**
 * 显示模态对话框
 * @param {object} options - 配置选项
 * @returns {Promise}
 */
function showModal (options) {
  const defaultOptions = {
    title: '提示',
    content: '',
    showCancel: true,
    cancelText: '取消',
    cancelColor: '#000000',
    confirmText: '确定',
    confirmColor: '#07C160'
  };

  return new Promise((resolve) => {
    wx.showModal({
      ...defaultOptions,
      ...options,
      success (res) {
        if (options.success) {
          options.success(res);
        }
        resolve(res);
      },
      fail (err) {
        if (options.fail) {
          options.fail(err);
        }
        resolve({ confirm: false, cancel: false });
      }
    });
  });
}

/**
 * 显示操作菜单
 * @param {array} itemList - 菜单项列表
 * @returns {Promise<number>} - 选中的索引
 */
function showActionSheet (itemList) {
  return new Promise((resolve, reject) => {
    wx.showActionSheet({
      itemList,
      success (res) {
        resolve(res.tapIndex);
      },
      fail (err) {
        if (err.errMsg !== 'showActionSheet:fail cancel') {
          reject(err);
        }
      }
    });
  });
}

/**
 * 页面跳转
 * @param {string} url - 页面路径
 * @param {string} type - 跳转类型 navigate/redirect/switchTab/reLaunch
 */
function navigateTo (url, type = 'navigate') {
  const methods = {
    navigate: wx.navigateTo,
    redirect: wx.redirectTo,
    switchTab: wx.switchTab,
    reLaunch: wx.reLaunch
  };

  const method = methods[type] || wx.navigateTo;
  method({ url });
}

/**
 * 返回上一页
 * @param {number} delta - 返回的页面数
 */
function navigateBack (delta = 1) {
  wx.navigateBack({ delta });
}

/**
 * 防抖函数
 * @param {function} fn - 要执行的函数
 * @param {number} delay - 延迟时间(ms)
 */
function debounce (fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 节流函数
 * @param {function} fn - 要执行的函数
 * @param {number} interval - 时间间隔(ms)
 */
function throttle (fn, interval = 300) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any}
 */
function deepClone (obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }

  if (obj instanceof Object) {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string}
 */
function formatFileSize (bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 */
function copyToClipboard (text) {
  wx.setClipboardData({
    data: text,
    success () {
      showToast('已复制到剪贴板', 'success');
    }
  });
}

/**
 * 拨打电话
 * @param {string} phoneNumber - 电话号码
 */
function makePhoneCall (phoneNumber) {
  wx.makePhoneCall({
    phoneNumber,
    fail () {
      showToast('拨号失败');
    }
  });
}

/**
 * 预览图片
 * @param {string} current - 当前图片URL
 * @param {array} urls - 所有图片URL列表
 */
function previewImage (current, urls = []) {
  wx.previewImage({
    current,
    urls: urls.length > 0 ? urls : [current]
  });
}

/**
 * 选择图片
 * @param {number} count - 最多可选择的图片数量
 * @param {array} sizeType - 图片尺寸 ['original', 'compressed']
 * @param {array} sourceType - 图片来源 ['album', 'camera']
 * @returns {Promise}
 */
function chooseImage (count = 1, sizeType = ['compressed'], sourceType = ['album', 'camera']) {
  return new Promise((resolve, reject) => {
    wx.chooseImage({
      count,
      sizeType,
      sourceType,
      success (res) {
        resolve(res.tempFilePaths);
      },
      fail (err) {
        reject(err);
      }
    });
  });
}

/**
 * 获取系统信息
 * @returns {object}
 */
function getSystemInfo () {
  try {
    return wx.getSystemInfoSync();
  } catch (error) {
    console.error('获取系统信息失败:', error);
    return {};
  }
}

/**
 * 检查网络状态
 * @returns {Promise<object>}
 */
function getNetworkType () {
  return new Promise((resolve, reject) => {
    wx.getNetworkType({
      success (res) {
        resolve(res);
      },
      fail (err) {
        reject(err);
      }
    });
  });
}

/**
 * 震动反馈
 * @param {string} type - 震动类型 short/medium/long
 */
function vibrate (type = 'short') {
  if (type === 'short') {
    wx.vibrateShort();
  } else if (type === 'long') {
    wx.vibrateLong();
  }
}

/**
 * 数字格式化（添加千分位）
 * @param {number} num - 数字
 * @returns {string}
 */
function formatNumber (num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 数字补零
 * @param {number} num - 数字
 * @param {number} length - 目标长度
 * @returns {string}
 */
function padZero (num, length = 2) {
  return num.toString().padStart(length, '0');
}

module.exports = {
  showToast,
  showLoading,
  hideLoading,
  showModal,
  showActionSheet,
  navigateTo,
  navigateBack,
  debounce,
  throttle,
  deepClone,
  formatFileSize,
  copyToClipboard,
  makePhoneCall,
  previewImage,
  chooseImage,
  getSystemInfo,
  getNetworkType,
  vibrate,
  formatNumber,
  padZero
};
