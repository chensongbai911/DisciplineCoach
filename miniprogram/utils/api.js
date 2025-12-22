/**
 * api.js - 云函数调用封装
 */

/**
 * 调用云函数的统一方法
 * @param {string} name - 云函数名称
 * @param {object} data - 传递的数据
 * @returns {Promise}
 */
function callFunction (name, data = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data
    }).then(res => {
      console.log(`云函数 ${name} 返回:`, res)

      // 云函数返回格式：{ result: { success: true, data: ... } }
      if (res.result) {
        if (res.result.success) {
          resolve(res.result.data || [])
        } else {
          const errMsg = res.result.message || res.result.msg || '请求失败'
          console.error(`云函数 ${name} 业务错误:`, errMsg)
          reject(new Error(errMsg))
        }
      } else {
        console.error(`云函数 ${name} 返回格式错误:`, res)
        reject(new Error('云函数返回格式错误'))
      }
    }).catch(err => {
      console.error(`调用云函数 ${name} 失败:`, err)
      reject(err)
    })
  })
}

/**
 * 用户相关API
 */
const userAPI = {
  // 登录
  login () {
    return callFunction('user', { action: 'login' })
  },

  // 获取用户信息
  getUserInfo () {
    return callFunction('user', { action: 'getUserInfo' })
  },

  // 更新用户信息
  updateUserInfo (userInfo) {
    return callFunction('user', {
      action: 'updateUserInfo',
      userInfo
    })
  },

  // 更新设置
  updateSettings (settings) {
    return callFunction('user', {
      action: 'updateSettings',
      settings
    })
  }
}

/**
 * 计划相关API
 */
const planAPI = {
  // 创建计划
  create (planData) {
    return callFunction('plan', {
      action: 'create',
      ...planData
    })
  },

  // 更新计划
  update (planId, planData) {
    return callFunction('plan', {
      action: 'update',
      planId,
      ...planData
    })
  },

  // 删除计划
  delete (planId) {
    return callFunction('plan', {
      action: 'delete',
      planId
    })
  },

  // 获取计划列表
  list (params = {}) {
    return callFunction('plan', {
      action: 'list',
      params  // 云函数期望 event.params
    })
  },

  // 切换计划状态
  toggle (planId, isActive) {
    return callFunction('plan', {
      action: 'toggle',
      planId,
      isActive
    })
  }
}

/**
 * 打卡记录相关API
 */
const recordAPI = {
  // 创建打卡记录
  create (recordData) {
    return callFunction('record', {
      action: 'create',
      ...recordData
    })
  },

  // 更新打卡记录
  update (recordId, recordData) {
    return callFunction('record', {
      action: 'update',
      recordId,
      ...recordData
    })
  },

  // 获取今日记录
  getTodayRecords () {
    return callFunction('record', {
      action: 'getTodayRecords'
    })
  },

  // 获取指定日期记录
  getByDate (date) {
    return callFunction('record', {
      action: 'getByDate',
      date
    })
  },

  // 获取日期范围记录
  getByRange (startDate, endDate) {
    return callFunction('record', {
      action: 'getByRange',
      startDate,
      endDate
    })
  },

  // 删除打卡记录
  delete (recordId) {
    return callFunction('record', {
      action: 'delete',
      recordId
    })
  },

  // 计算连续天数
  calculateStreak (category = null) {
    return callFunction('record', {
      action: 'calculateStreak',
      category
    })
  }
}

/**
 * 统计相关API
 */
const statisticsAPI = {
  // 获取综合统计
  getOverview (dateRange = {}) {
    return callFunction('statistics', {
      action: 'getOverview',
      dateRange
    })
  },

  // 获取维度统计
  getDimensionStats (dateRange = {}) {
    return callFunction('statistics', {
      action: 'getDimensionStats',
      dateRange
    })
  },

  // 获取趋势数据
  getTrend (dateRange = {}) {
    return callFunction('statistics', {
      action: 'getTrend',
      dateRange
    })
  },

  // 获取徽章数据
  getBadges () {
    return callFunction('statistics', {
      action: 'getBadges'
    })
  },

  // 获取完成率
  getCompletionRate (days = 7) {
    return callFunction('statistics', {
      action: 'getCompletionRate',
      days
    })
  },

  // 生成周总结
  generateWeeklySummary () {
    return callFunction('statistics', {
      action: 'generateWeeklySummary'
    })
  }
}

/**
 * 支付相关API
 */
const paymentAPI = {
  // 创建订单
  createOrder (orderData) {
    return callFunction('payment', {
      action: 'createOrder',
      ...orderData
    })
  },

  // 统一下单
  unifiedOrder (orderId) {
    return callFunction('payment', {
      action: 'unifiedOrder',
      orderId
    })
  },

  // 检查会员状态
  checkMembership () {
    return callFunction('payment', {
      action: 'checkMembership'
    })
  }
}

/**
 * 反馈相关API
 */
const feedbackAPI = {
  // 提交反馈
  submit (feedbackData) {
    return callFunction('feedback', {
      action: 'submit',
      ...feedbackData
    })
  },

  // 获取反馈列表
  list () {
    return callFunction('feedback', {
      action: 'list'
    })
  },

  // 获取反馈详情
  detail (feedbackId) {
    return callFunction('feedback', {
      action: 'detail',
      feedbackId
    })
  }
}

/**
 * 消息相关API
 */
const messageAPI = {
  // 发送订阅消息
  sendSubscription (type, data) {
    return callFunction('message', {
      action: 'sendSubscription',
      type,
      data
    })
  }
}

/**
 * 导出相关API
 */
const exportAPI = {
  // 导出为 Excel
  exportToExcel (startDate, endDate, dimensions) {
    return callFunction('export', {
      action: 'exportExcel',
      startDate,
      endDate,
      dimensions
    })
  },

  // 导出为 PDF 报告
  exportToPDF (startDate, endDate, reportType = 'weekly') {
    return callFunction('export', {
      action: 'exportPDF',
      startDate,
      endDate,
      reportType
    })
  },

  // 导出为图片
  exportToImage (chartType, startDate, endDate) {
    return callFunction('export', {
      action: 'exportImage',
      chartType,
      startDate,
      endDate
    })
  },

  // 获取导出历史
  getExportHistory (page = 1, pageSize = 20) {
    return callFunction('export', {
      action: 'getExportHistory',
      page,
      pageSize
    })
  }
}

module.exports = {
  callFunction,
  userAPI,
  planAPI,
  recordAPI,
  statisticsAPI,
  paymentAPI,
  feedbackAPI,
  messageAPI,
  exportAPI
}
