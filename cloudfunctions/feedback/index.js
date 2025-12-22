// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 反馈管理云函数
 * 处理用户反馈的提交、查询和管理
 */
exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()

  try {
    switch (action) {
      case 'submit':
        return await submitFeedback(event, wxContext)
      case 'list':
        return await getFeedbackList(event, wxContext)
      case 'detail':
        return await getFeedbackDetail(event, wxContext)
      case 'reply':
        return await replyFeedback(event, wxContext)
      case 'updateStatus':
        return await updateFeedbackStatus(event, wxContext)
      default:
        return {
          success: false,
          errMsg: `未知的操作类型: ${action}`
        }
    }
  } catch (err) {
    console.error('[云函数][feedback] 调用失败', err)
    return {
      success: false,
      errMsg: err.message || '操作失败'
    }
  }
}

/**
 * 提交反馈
 */
async function submitFeedback (event, wxContext) {
  const { type, content, contactInfo, images } = event.feedbackData || {}
  const openid = wxContext.OPENID

  // 参数验证
  if (!type || !content) {
    return {
      success: false,
      errMsg: '缺少必要参数'
    }
  }

  // 验证反馈类型
  const validTypes = ['bug', 'feature', 'improvement', 'other']
  if (!validTypes.includes(type)) {
    return {
      success: false,
      errMsg: '无效的反馈类型'
    }
  }

  // 验证内容长度
  if (content.length < 5 || content.length > 500) {
    return {
      success: false,
      errMsg: '反馈内容长度应在5-500字之间'
    }
  }

  try {
    const now = new Date()

    // 获取用户信息
    const userRes = await db.collection('users').where({
      _openid: openid
    }).get()

    const user = userRes.data[0] || {}

    // 创建反馈记录
    const newFeedback = {
      _openid: openid,
      userNickName: user.nickName || '用户',
      userAvatarUrl: user.avatarUrl || '',
      type: type,
      content: content,
      contactInfo: contactInfo || '',
      images: images || [],
      status: 'pending', // pending, processing, replied, closed
      reply: '',
      replyTime: null,
      createTime: now,
      updateTime: now
    }

    const res = await db.collection('feedbacks').add({
      data: newFeedback
    })

    return {
      success: true,
      data: {
        _id: res._id,
        ...newFeedback
      }
    }
  } catch (err) {
    console.error('[submitFeedback] 提交反馈失败', err)
    throw new Error('提交反馈失败')
  }
}

/**
 * 获取反馈列表
 */
async function getFeedbackList (event, wxContext) {
  const { status, page = 1, pageSize = 20 } = event
  const openid = wxContext.OPENID

  try {
    // 构建查询条件
    const where = { _openid: openid }
    if (status) {
      where.status = status
    }

    // 查询总数
    const countRes = await db.collection('feedbacks').where(where).count()
    const total = countRes.total

    // 查询列表
    const res = await db.collection('feedbacks')
      .where(where)
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      success: true,
      data: {
        list: res.data,
        total: total,
        page: page,
        pageSize: pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  } catch (err) {
    console.error('[getFeedbackList] 获取反馈列表失败', err)
    throw new Error('获取反馈列表失败')
  }
}

/**
 * 获取反馈详情
 */
async function getFeedbackDetail (event, wxContext) {
  const { feedbackId } = event
  const openid = wxContext.OPENID

  if (!feedbackId) {
    return {
      success: false,
      errMsg: '缺少反馈ID'
    }
  }

  try {
    const res = await db.collection('feedbacks').where({
      _id: feedbackId,
      _openid: openid
    }).get()

    if (res.data.length === 0) {
      return {
        success: false,
        errMsg: '反馈不存在或无权访问'
      }
    }

    return {
      success: true,
      data: res.data[0]
    }
  } catch (err) {
    console.error('[getFeedbackDetail] 获取反馈详情失败', err)
    throw new Error('获取反馈详情失败')
  }
}

/**
 * 回复反馈（管理员功能）
 */
async function replyFeedback (event, wxContext) {
  const { feedbackId, replyContent } = event

  if (!feedbackId || !replyContent) {
    return {
      success: false,
      errMsg: '缺少必要参数'
    }
  }

  try {
    const now = new Date()

    // 更新反馈记录
    const res = await db.collection('feedbacks').doc(feedbackId).update({
      data: {
        reply: replyContent,
        replyTime: now,
        status: 'replied',
        updateTime: now
      }
    })

    if (res.stats.updated === 0) {
      return {
        success: false,
        errMsg: '反馈不存在'
      }
    }

    // 获取反馈信息用于发送通知
    const feedbackRes = await db.collection('feedbacks').doc(feedbackId).get()
    const feedback = feedbackRes.data

    // 发送订阅消息通知用户
    try {
      await cloud.openapi.subscribeMessage.send({
        touser: feedback._openid,
        page: 'pages/feedback/index',
        data: {
          thing1: { value: getFeedbackTypeName(feedback.type) },
          thing2: { value: replyContent.substring(0, 20) },
          date3: { value: formatDateTime(now) }
        },
        templateId: 'FEEDBACK_REPLY_TEMPLATE_ID', // 需要在小程序后台配置
        miniprogramState: 'formal'
      })
    } catch (notifyErr) {
      console.error('[replyFeedback] 发送通知失败', notifyErr)
      // 通知失败不影响回复成功
    }

    return {
      success: true,
      data: {
        reply: replyContent,
        replyTime: now
      }
    }
  } catch (err) {
    console.error('[replyFeedback] 回复反馈失败', err)
    throw new Error('回复反馈失败')
  }
}

/**
 * 更新反馈状态（管理员功能）
 */
async function updateFeedbackStatus (event, wxContext) {
  const { feedbackId, status } = event

  if (!feedbackId || !status) {
    return {
      success: false,
      errMsg: '缺少必要参数'
    }
  }

  // 验证状态值
  const validStatuses = ['pending', 'processing', 'replied', 'closed']
  if (!validStatuses.includes(status)) {
    return {
      success: false,
      errMsg: '无效的状态值'
    }
  }

  try {
    const res = await db.collection('feedbacks').doc(feedbackId).update({
      data: {
        status: status,
        updateTime: new Date()
      }
    })

    if (res.stats.updated === 0) {
      return {
        success: false,
        errMsg: '反馈不存在'
      }
    }

    return {
      success: true,
      data: { status }
    }
  } catch (err) {
    console.error('[updateFeedbackStatus] 更新状态失败', err)
    throw new Error('更新状态失败')
  }
}

/**
 * 获取反馈类型名称
 */
function getFeedbackTypeName (type) {
  const typeMap = {
    bug: '问题反馈',
    feature: '功能建议',
    improvement: '体验优化',
    other: '其他反馈'
  }
  return typeMap[type] || '用户反馈'
}

/**
 * 获取反馈状态名称
 */
function getFeedbackStatusName (status) {
  const statusMap = {
    pending: '待处理',
    processing: '处理中',
    replied: '已回复',
    closed: '已关闭'
  }
  return statusMap[status] || status
}

/**
 * 格式化日期时间
 */
function formatDateTime (date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}
