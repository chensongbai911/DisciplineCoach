// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 消息通知云函数
 * 处理订阅消息推送和教练消息生成
 */
exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()

  try {
    switch (action) {
      case 'sendDailyReminder':
        return await sendDailyReminder(event, wxContext)
      case 'sendStreakCongrats':
        return await sendStreakCongrats(event, wxContext)
      case 'sendWeeklySummary':
        return await sendWeeklySummary(event, wxContext)
      case 'sendVipExpireNotice':
        return await sendVipExpireNotice(event, wxContext)
      case 'getCoachMessage':
        return await getCoachMessage(event, wxContext)
      case 'batchSendReminder':
        return await batchSendReminder(event, wxContext)
      default:
        return {
          success: false,
          errMsg: `未知的操作类型: ${action}`
        }
    }
  } catch (err) {
    console.error('[云函数][message] 调用失败', err)
    return {
      success: false,
      errMsg: err.message || '操作失败'
    }
  }
}
/**
 * 发送周总结
 */
async function sendWeeklySummary (event, wxContext) {
  const openid = wxContext.OPENID

  try {
    const today = new Date()
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startDate = formatDate(sevenDaysAgo)
    const endDate = formatDate(today)

    // 获取近7天记录
    const recordsRes = await db.collection('records').where({
      _openid: openid,
      date: _.gte(startDate).and(_.lte(endDate))
    }).get()

    const records = recordsRes.data || []
    const total = records.length
    const completed = records.filter(r => r.isCompleted).length
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0

    // 发送订阅消息
    await cloud.openapi.subscribeMessage.send({
      touser: openid,
      page: 'pages/statistics/index',
      data: {
        thing1: { value: '本周总结' },
        thing2: { value: `本周完成${completed}/${total}，完成率${rate}%` },
        time3: { value: formatDateTime(new Date()) }
      },
      templateId: 'WEEKLY_SUMMARY_TEMPLATE_ID',
      miniprogramState: 'formal'
    })

    return {
      success: true,
      data: { total, completed, rate, sentTime: new Date() }
    }
  } catch (err) {
    console.error('[sendWeeklySummary] 发送周总结失败', err)
    return { success: false, errMsg: '发送周总结失败' }
  }
}


/**
 * 发送每日打卡提醒
 */
async function sendDailyReminder (event, wxContext) {
  const openid = wxContext.OPENID

  try {
    // 获取用户设置
    const userRes = await db.collection('users').where({
      _openid: openid
    }).get()

    if (userRes.data.length === 0) {
      return {
        success: false,
        errMsg: '用户不存在'
      }
    }

    const user = userRes.data[0]

    // 检查是否开启提醒
    if (!user.settings.dailyReminder) {
      return {
        success: false,
        errMsg: '未开启每日提醒'
      }
    }

    // 获取今日待完成的计划数
    const today = formatDate(new Date())
    const plansRes = await db.collection('plans').where({
      _openid: openid,
      status: 'active',
      isEnabled: true
    }).get()

    const plans = plansRes.data
    const todayDay = new Date().getDay()
    const todayPlans = plans.filter(plan => plan.days.includes(todayDay))

    // 获取今日已打卡数
    const recordsRes = await db.collection('records').where({
      _openid: openid,
      date: today
    }).get()

    const completedCount = recordsRes.data.filter(r => r.isCompleted).length
    const pendingCount = todayPlans.length - completedCount

    if (pendingCount <= 0) {
      return {
        success: false,
        errMsg: '今日任务已全部完成'
      }
    }

    // 发送订阅消息
    try {
      await cloud.openapi.subscribeMessage.send({
        touser: openid,
        page: 'pages/index/index',
        data: {
          thing1: { value: '每日打卡提醒' },
          thing2: { value: `还有${pendingCount}个任务待完成` },
          time3: { value: formatDateTime(new Date()) }
        },
        templateId: 'DAILY_REMINDER_TEMPLATE_ID', // 需要在小程序后台配置
        miniprogramState: 'formal'
      })

      return {
        success: true,
        data: {
          pendingCount,
          sentTime: new Date()
        }
      }
    } catch (sendErr) {
      console.error('[sendDailyReminder] 发送消息失败', sendErr)
      return {
        success: false,
        errMsg: '发送消息失败: ' + sendErr.errMsg
      }
    }
  } catch (err) {
    console.error('[sendDailyReminder] 发送每日提醒失败', err)
    throw new Error('发送每日提醒失败')
  }
}

/**
 * 发送连续打卡祝贺
 */
async function sendStreakCongrats (event, wxContext) {
  const { streak } = event
  const openid = wxContext.OPENID

  if (!streak) {
    return {
      success: false,
      errMsg: '缺少连续天数参数'
    }
  }

  // 只在特定天数发送祝贺
  const milestones = [7, 14, 21, 30, 50, 100, 365]
  if (!milestones.includes(streak)) {
    return {
      success: false,
      errMsg: '非里程碑天数'
    }
  }

  try {
    const message = getStreakMessage(streak)

    await cloud.openapi.subscribeMessage.send({
      touser: openid,
      page: 'pages/statistics/index',
      data: {
        thing1: { value: '连续打卡达成' },
        number2: { value: streak.toString() },
        thing3: { value: message },
        time4: { value: formatDateTime(new Date()) }
      },
      templateId: 'STREAK_CONGRATS_TEMPLATE_ID', // 需要在小程序后台配置
      miniprogramState: 'formal'
    })

    return {
      success: true,
      data: {
        streak,
        message,
        sentTime: new Date()
      }
    }
  } catch (err) {
    console.error('[sendStreakCongrats] 发送祝贺消息失败', err)
    return {
      success: false,
      errMsg: '发送祝贺消息失败'
    }
  }
}

/**
 * 发送会员到期提醒
 */
async function sendVipExpireNotice (event, wxContext) {
  const openid = wxContext.OPENID

  try {
    // 获取用户会员信息
    const userRes = await db.collection('users').where({
      _openid: openid
    }).get()

    if (userRes.data.length === 0) {
      return {
        success: false,
        errMsg: '用户不存在'
      }
    }

    const user = userRes.data[0]

    if (!user.isVip || !user.vipExpireDate) {
      return {
        success: false,
        errMsg: '非会员用户'
      }
    }

    const expireDate = new Date(user.vipExpireDate)
    const now = new Date()
    const daysLeft = Math.ceil((expireDate - now) / (24 * 60 * 60 * 1000))

    // 只在到期前3天和7天提醒
    if (daysLeft !== 3 && daysLeft !== 7) {
      return {
        success: false,
        errMsg: '非提醒时间点'
      }
    }

    await cloud.openapi.subscribeMessage.send({
      touser: openid,
      page: 'pages/vip/index',
      data: {
        thing1: { value: '会员到期提醒' },
        date2: { value: formatDate(expireDate) },
        thing3: { value: `还剩${daysLeft}天，续费享受更多权益` }
      },
      templateId: 'VIP_EXPIRE_TEMPLATE_ID', // 需要在小程序后台配置
      miniprogramState: 'formal'
    })

    return {
      success: true,
      data: {
        daysLeft,
        expireDate,
        sentTime: now
      }
    }
  } catch (err) {
    console.error('[sendVipExpireNotice] 发送会员到期提醒失败', err)
    return {
      success: false,
      errMsg: '发送会员到期提醒失败'
    }
  }
}

/**
 * 获取教练消息
 * 根据用户状态生成个性化的教练消息
 */
async function getCoachMessage (event, wxContext) {
  const openid = wxContext.OPENID

  try {
    // 获取用户统计数据
    const userRes = await db.collection('users').where({
      _openid: openid
    }).get()

    if (userRes.data.length === 0) {
      return {
        success: false,
        errMsg: '用户不存在'
      }
    }

    const userStats = userRes.data[0].stats

    // 获取今日完成情况
    const today = formatDate(new Date())
    const recordsRes = await db.collection('records').where({
      _openid: openid,
      date: today
    }).get()

    const records = recordsRes.data
    const completedToday = records.filter(r => r.isCompleted).length
    const totalToday = records.length

    // 根据状态生成消息
    let message, avatar, mood

    if (userStats.currentStreak === 0) {
      // 新手或中断
      message = '开始你的自律之旅吧！每一天的坚持都会成为明天的习惯。'
      avatar = 'cheer'
      mood = 'encourage'
    } else if (userStats.currentStreak >= 100) {
      // 长期坚持
      message = `连续${userStats.currentStreak}天！你已经成为自律大师，继续保持这份毅力！`
      avatar = 'happy'
      mood = 'proud'
    } else if (userStats.currentStreak >= 30) {
      // 月度坚持
      message = `已坚持${userStats.currentStreak}天，习惯正在成为你生活的一部分！`
      avatar = 'happy'
      mood = 'proud'
    } else if (userStats.currentStreak >= 7) {
      // 周度坚持
      message = `连续打卡${userStats.currentStreak}天，很棒的开始！坚持就是胜利。`
      avatar = 'cheer'
      mood = 'encourage'
    } else {
      // 初期阶段
      message = `加油！你已经坚持${userStats.currentStreak}天了，继续保持下去！`
      avatar = 'cheer'
      mood = 'encourage'
    }

    // 如果今日任务完成较好，给予特殊鼓励
    if (totalToday > 0 && completedToday === totalToday) {
      message = '太棒了！今日所有任务已完成，你的自律让人钦佩！'
      avatar = 'happy'
      mood = 'praise'
    } else if (totalToday > 0 && completedToday >= totalToday * 0.8) {
      message = '今天表现很好！再完成几个任务就完美了。'
      avatar = 'cheer'
      mood = 'encourage'
    }

    return {
      success: true,
      data: {
        message,
        avatar,
        mood,
        stats: {
          currentStreak: userStats.currentStreak,
          completionRate: userStats.completionRate,
          todayCompleted: completedToday,
          todayTotal: totalToday
        }
      }
    }
  } catch (err) {
    console.error('[getCoachMessage] 获取教练消息失败', err)
    throw new Error('获取教练消息失败')
  }
}

/**
 * 批量发送提醒（定时触发）
 * 用于云函数定时任务
 */
async function batchSendReminder (event, wxContext) {
  try {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`

    // 查询需要发送提醒的用户
    const usersRes = await db.collection('users').where({
      'settings.dailyReminder': true,
      'settings.reminderTime': currentTime
    }).get()

    const users = usersRes.data

    if (users.length === 0) {
      return {
        success: true,
        data: {
          total: 0,
          message: '当前时间无需发送提醒的用户'
        }
      }
    }

    // 批量发送提醒
    const sendPromises = users.map(user => {
      return sendDailyReminder({}, { OPENID: user._openid })
        .then(() => ({ openid: user._openid, success: true }))
        .catch(err => ({ openid: user._openid, success: false, error: err.message }))
    })

    const results = await Promise.all(sendPromises)
    const successCount = results.filter(r => r.success).length
    const failedCount = results.filter(r => !r.success).length

    console.log('[batchSendReminder] 批量发送完成', {
      total: users.length,
      success: successCount,
      failed: failedCount
    })

    return {
      success: true,
      data: {
        total: users.length,
        success: successCount,
        failed: failedCount,
        details: results
      }
    }
  } catch (err) {
    console.error('[batchSendReminder] 批量发送提醒失败', err)
    throw new Error('批量发送提醒失败')
  }
}

/**
 * 获取连续打卡祝贺消息
 */
function getStreakMessage (streak) {
  const messages = {
    7: '坚持一周，习惯养成第一步！',
    14: '两周坚持，你正在变得更好！',
    21: '21天养成习惯，你做到了！',
    30: '连续一个月，自律已成为你的标签！',
    50: '50天坚持不懈，你是榜样！',
    100: '百日坚持，成就非凡自律！',
    365: '365天如一日，你是真正的自律大师！'
  }
  return messages[streak] || `连续打卡${streak}天，继续加油！`
}

/**
 * 格式化日期
 */
function formatDate (date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
