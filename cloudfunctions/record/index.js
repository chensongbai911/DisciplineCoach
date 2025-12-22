// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 打卡记录云函数
 * 处理打卡记录的CRUD及统计功能
 */
exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()

  try {
    switch (action) {
      case 'create':
        return await createRecord(event, wxContext)
      case 'update':
        return await updateRecord(event, wxContext)
      case 'delete':
        return await deleteRecord(event, wxContext)
      case 'getTodayRecords':
        return await getTodayRecords(event, wxContext)
      case 'getByDate':
        return await getRecordsByDate(event, wxContext)
      case 'getByRange':
        return await getRecordsByRange(event, wxContext)
      case 'calculateStreak':
        return await calculateStreak(event, wxContext)
      default:
        return {
          success: false,
          errMsg: `未知的操作类型: ${action}`
        }
    }
  } catch (err) {
    console.error('[云函数][record] 调用失败', err)
    return {
      success: false,
      errMsg: err.message || '操作失败'
    }
  }
}

/**
 * 创建打卡记录
 */
async function createRecord (event, wxContext) {
  const { planId, date, actualValue, remark } = event
  const openid = wxContext.OPENID

  if (!planId) {
    return {
      success: false,
      errMsg: '缺少计划ID'
    }
  }

  try {
    // 获取计划信息
    const planRes = await db.collection('plans').where({
      _id: planId,
      _openid: openid
    }).get()

    if (planRes.data.length === 0) {
      return {
        success: false,
        errMsg: '计划不存在或无权访问'
      }
    }

    const plan = planRes.data[0]
    const now = new Date()

    // ✅ 支持自定义日期，默认今天
    const recordDate = date || formatDate(now)

    // 检查该日期是否已打卡
    const existRes = await db.collection('records').where({
      _openid: openid,
      planId: planId,
      date: recordDate
    }).get()

    if (existRes.data.length > 0) {
      return {
        success: false,
        errMsg: `${recordDate} 已打卡，请勿重复提交`
      }
    }

    // 判断是否完成
    let isCompleted = false
    if (plan.targetType === 'boolean') {
      isCompleted = actualValue === true || actualValue === 'true'
    } else if (plan.targetType === 'duration' || plan.targetType === 'count') {
      isCompleted = parseFloat(actualValue) >= parseFloat(plan.targetValue)
    } else if (plan.targetType === 'time') {
      isCompleted = true // 时间类型打卡即完成
    }

    // 创建记录
    const newRecord = {
      _openid: openid,
      planId: planId,
      planTitle: plan.title,
      category: plan.category,
      targetType: plan.targetType,
      targetValue: plan.targetValue,
      targetUnit: plan.targetUnit,
      actualValue: actualValue,
      isCompleted: isCompleted,
      remark: remark || '',
      date: recordDate,
      createTime: now,
      updateTime: now
    }

    const addRes = await db.collection('records').add({
      data: newRecord
    })

    // 更新计划统计
    await updatePlanStats(planId, openid)

    // 更新用户统计
    await updateUserStats(openid)

    return {
      success: true,
      data: {
        _id: addRes._id,
        ...newRecord
      },
      message: `${recordDate} 打卡成功`
    }
  } catch (err) {
    console.error('[createRecord] 创建记录失败', err)
    throw new Error('创建记录失败')
  }
}

/**
 * 更新打卡记录
 */
async function updateRecord (event, wxContext) {
  const { recordId, actualValue, remark } = event
  const openid = wxContext.OPENID

  if (!recordId) {
    return {
      success: false,
      errMsg: '缺少记录ID'
    }
  }

  try {
    // 获取原记录
    const recordRes = await db.collection('records').where({
      _id: recordId,
      _openid: openid
    }).get()

    if (recordRes.data.length === 0) {
      return {
        success: false,
        errMsg: '记录不存在或无权操作'
      }
    }

    const record = recordRes.data[0]

    // 构建更新数据
    const updateData = {}
    if (actualValue !== undefined) {
      updateData.actualValue = actualValue

      // 重新判断是否完成
      if (record.targetType === 'boolean') {
        updateData.isCompleted = actualValue === true || actualValue === 'true'
      } else if (record.targetType === 'duration' || record.targetType === 'count') {
        updateData.isCompleted = parseFloat(actualValue) >= parseFloat(record.targetValue)
      } else if (record.targetType === 'time') {
        updateData.isCompleted = true
      }
    }
    if (remark !== undefined) updateData.remark = remark

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        errMsg: '没有需要更新的数据'
      }
    }

    updateData.updateTime = new Date()

    const res = await db.collection('records').doc(recordId).update({
      data: updateData
    })

    // 如果完成状态改变，更新统计
    if (updateData.isCompleted !== undefined) {
      await updatePlanStats(record.planId, openid)
      await updateUserStats(openid)
    }

    return {
      success: true,
      data: updateData
    }
  } catch (err) {
    console.error('[updateRecord] 更新记录失败', err)
    throw new Error('更新记录失败')
  }
}

/**
 * 删除打卡记录
 */
async function deleteRecord (event, wxContext) {
  const { recordId } = event
  const openid = wxContext.OPENID

  if (!recordId) {
    return {
      success: false,
      errMsg: '缺少记录ID'
    }
  }

  try {
    // 获取记录信息
    const recordRes = await db.collection('records').where({
      _id: recordId,
      _openid: openid
    }).get()

    if (recordRes.data.length === 0) {
      return {
        success: false,
        errMsg: '记录不存在或无权操作'
      }
    }

    const record = recordRes.data[0]

    // 删除记录
    await db.collection('records').doc(recordId).remove()

    // 更新统计
    await updatePlanStats(record.planId, openid)
    await updateUserStats(openid)

    return {
      success: true
    }
  } catch (err) {
    console.error('[deleteRecord] 删除记录失败', err)
    throw new Error('删除记录失败')
  }
}

/**
 * 获取今日记录
 */
async function getTodayRecords (event, wxContext) {
  const openid = wxContext.OPENID
  const today = formatDate(new Date())

  try {
    const res = await db.collection('records').where({
      _openid: openid,
      date: today
    }).get()

    return {
      success: true,
      data: res.data
    }
  } catch (err) {
    console.error('[getTodayRecords] 获取今日记录失败', err)
    throw new Error('获取今日记录失败')
  }
}

/**
 * 获取指定日期的记录
 */
async function getRecordsByDate (event, wxContext) {
  const { date } = event
  const openid = wxContext.OPENID

  if (!date) {
    return {
      success: false,
      errMsg: '缺少日期参数'
    }
  }

  try {
    const res = await db.collection('records').where({
      _openid: openid,
      date: date
    }).get()

    return {
      success: true,
      data: res.data
    }
  } catch (err) {
    console.error('[getRecordsByDate] 获取记录失败', err)
    throw new Error('获取记录失败')
  }
}

/**
 * 获取日期范围内的记录
 */
async function getRecordsByRange (event, wxContext) {
  const { startDate, endDate } = event
  const openid = wxContext.OPENID

  if (!startDate || !endDate) {
    return {
      success: false,
      errMsg: '缺少日期参数'
    }
  }

  try {
    const res = await db.collection('records').where({
      _openid: openid,
      date: _.gte(startDate).and(_.lte(endDate))
    }).orderBy('date', 'desc').get()

    return {
      success: true,
      data: res.data
    }
  } catch (err) {
    console.error('[getRecordsByRange] 获取记录失败', err)
    throw new Error('获取记录失败')
  }
}

/**
 * 计算连续打卡天数
 */
async function calculateStreak (event, wxContext) {
  const { planId } = event
  const openid = wxContext.OPENID

  try {
    // 构建查询条件
    const whereCondition = {
      _openid: openid,
      isCompleted: true
    }

    // 如果提供了 planId,则只查询该计划的记录
    if (planId) {
      whereCondition.planId = planId
    }

    // 获取所有已完成的记录,按日期降序
    const res = await db.collection('records').where(whereCondition).orderBy('date', 'desc').get()

    const records = res.data

    if (records.length === 0) {
      return {
        success: true,
        data: {
          currentStreak: 0,
          maxStreak: 0
        }
      }
    }

    let currentStreak = 0
    let maxStreak = 0
    let tempStreak = 1

    const today = formatDate(new Date())
    const yesterday = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000))

    // 计算当前连续天数
    if (records[0].date === today || records[0].date === yesterday) {
      currentStreak = 1

      for (let i = 1; i < records.length; i++) {
        const prevDate = new Date(records[i - 1].date)
        const currDate = new Date(records[i].date)
        const diffDays = Math.floor((prevDate - currDate) / (24 * 60 * 60 * 1000))

        if (diffDays === 1) {
          currentStreak++
        } else {
          break
        }
      }
    }

    // 计算最大连续天数
    for (let i = 1; i < records.length; i++) {
      const prevDate = new Date(records[i - 1].date)
      const currDate = new Date(records[i].date)
      const diffDays = Math.floor((prevDate - currDate) / (24 * 60 * 60 * 1000))

      if (diffDays === 1) {
        tempStreak++
        maxStreak = Math.max(maxStreak, tempStreak)
      } else {
        tempStreak = 1
      }
    }

    maxStreak = Math.max(maxStreak, tempStreak, currentStreak)

    return {
      success: true,
      data: {
        currentStreak,
        maxStreak
      }
    }
  } catch (err) {
    console.error('[calculateStreak] 计算连续天数失败', err)
    throw new Error('计算连续天数失败')
  }
}

/**
 * 更新计划统计
 */
async function updatePlanStats (planId, openid) {
  try {
    // 获取该计划的所有记录
    const recordRes = await db.collection('records').where({
      _openid: openid,
      planId: planId
    }).get()

    const records = recordRes.data
    const totalDays = records.length
    const completedDays = records.filter(r => r.isCompleted).length
    const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

    // 计算连续天数
    const streakRes = await calculateStreak({ planId }, { OPENID: openid })
    const { currentStreak = 0, maxStreak = 0 } = streakRes.data || {}

    // 更新计划统计
    await db.collection('plans').doc(planId).update({
      data: {
        'stats.totalDays': totalDays,
        'stats.completedDays': completedDays,
        'stats.completionRate': completionRate,
        'stats.currentStreak': currentStreak,
        'stats.maxStreak': maxStreak
      }
    })
  } catch (err) {
    console.error('[updatePlanStats] 更新计划统计失败', err)
  }
}

/**
 * 更新用户统计
 */
async function updateUserStats (openid) {
  try {
    // 获取用户所有记录
    const recordRes = await db.collection('records').where({
      _openid: openid
    }).get()

    const records = recordRes.data

    // 计算打卡天数（去重日期）
    const uniqueDates = [...new Set(records.map(r => r.date))]
    const totalDays = uniqueDates.length

    // 计算完成率
    const completedRecords = records.filter(r => r.isCompleted).length
    const completionRate = records.length > 0 ? Math.round((completedRecords / records.length) * 100) : 0

    // 计算当前连续天数
    let currentStreak = 0
    if (uniqueDates.length > 0) {
      uniqueDates.sort((a, b) => new Date(b) - new Date(a))
      const today = formatDate(new Date())
      const yesterday = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000))

      if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
        currentStreak = 1

        for (let i = 1; i < uniqueDates.length; i++) {
          const prevDate = new Date(uniqueDates[i - 1])
          const currDate = new Date(uniqueDates[i])
          const diffDays = Math.floor((prevDate - currDate) / (24 * 60 * 60 * 1000))

          if (diffDays === 1) {
            currentStreak++
          } else {
            break
          }
        }
      }
    }

    // 计算最大连续天数（简化版，实际应该更精确）
    let maxStreak = currentStreak

    // 更新用户统计
    await db.collection('users').where({
      _openid: openid
    }).update({
      data: {
        'stats.totalDays': totalDays,
        'stats.currentStreak': currentStreak,
        'stats.maxStreak': maxStreak,
        'stats.completionRate': completionRate
      }
    })
  } catch (err) {
    console.error('[updateUserStats] 更新用户统计失败', err)
  }
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate (date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
