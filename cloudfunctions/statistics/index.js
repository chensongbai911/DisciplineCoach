// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 数据统计云函数
 * 提供各类数据分析和统计功能
 */
exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()

  try {
    switch (action) {
      case 'getOverview':
        return await getOverview(event, wxContext)
      case 'getDimensionStats':
        return await getDimensionStats(event, wxContext)
      case 'getTrend':
        return await getTrend(event, wxContext)
      case 'getBadges':
        return await getBadges(event, wxContext)
      case 'getHeatmap':
        return await getHeatmap(event, wxContext)
      case 'exportData':
        return await exportData(event, wxContext)
      default:
        return {
          success: false,
          errMsg: `未知的操作类型: ${action}`
        }
    }
  } catch (err) {
    console.error('[云函数][statistics] 调用失败', err)
    return {
      success: false,
      errMsg: err.message || '操作失败'
    }
  }
}

/**
 * 获取总览数据
 */
async function getOverview (event, wxContext) {
  const { startDate, endDate } = event.dateRange || {}
  const openid = wxContext.OPENID

  try {
    // 构建查询条件
    const where = { _openid: openid }
    if (startDate && endDate) {
      where.date = _.gte(startDate).and(_.lte(endDate))
    }

    // 获取记录
    const recordRes = await db.collection('records').where(where).get()
    const records = recordRes.data

    // 计算统计数据
    const totalRecords = records.length
    const completedRecords = records.filter(r => r.isCompleted).length
    const completionRate = totalRecords > 0 ? Math.round((completedRecords / totalRecords) * 100) : 0

    // 计算打卡天数（去重日期）
    const uniqueDates = [...new Set(records.map(r => r.date))]
    const totalDays = uniqueDates.length

    // 获取用户统计
    const userRes = await db.collection('users').where({
      _openid: openid
    }).get()

    const userStats = userRes.data[0]?.stats || {
      currentStreak: 0,
      maxStreak: 0
    }

    return {
      success: true,
      data: {
        totalDays,
        totalRecords,
        completedRecords,
        completionRate,
        currentStreak: userStats.currentStreak,
        maxStreak: userStats.maxStreak
      }
    }
  } catch (err) {
    console.error('[getOverview] 获取总览数据失败', err)
    throw new Error('获取总览数据失败')
  }
}

/**
 * 获取维度统计
 */
async function getDimensionStats (event, wxContext) {
  const { startDate, endDate } = event.dateRange || {}
  const openid = wxContext.OPENID

  try {
    // 构建查询条件
    const where = { _openid: openid }
    if (startDate && endDate) {
      where.date = _.gte(startDate).and(_.lte(endDate))
    }

    // 获取记录
    const recordRes = await db.collection('records').where(where).get()
    const records = recordRes.data

    // 按维度分组统计
    const dimensions = ['exercise', 'diet', 'sleep', 'reading', 'study']
    const dimensionStats = {}

    dimensions.forEach(dim => {
      const dimRecords = records.filter(r => r.category === dim)
      const total = dimRecords.length
      const completed = dimRecords.filter(r => r.isCompleted).length
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0

      dimensionStats[dim] = {
        name: getDimensionName(dim),
        category: dim,
        total,
        completed,
        rate
      }
    })

    return {
      success: true,
      data: Object.values(dimensionStats)
    }
  } catch (err) {
    console.error('[getDimensionStats] 获取维度统计失败', err)
    throw new Error('获取维度统计失败')
  }
}

/**
 * 获取趋势数据
 */
async function getTrend (event, wxContext) {
  const { startDate, endDate } = event.dateRange || {}
  const openid = wxContext.OPENID

  try {
    // 如果没有指定日期范围，默认最近30天
    const end = endDate || formatDate(new Date())
    const start = startDate || formatDate(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000))

    // 获取记录
    const recordRes = await db.collection('records').where({
      _openid: openid,
      date: _.gte(start).and(_.lte(end))
    }).get()

    const records = recordRes.data

    // 生成日期数组
    const dates = []
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()
    for (let time = startTime; time <= endTime; time += 24 * 60 * 60 * 1000) {
      dates.push(formatDate(new Date(time)))
    }

    // 按日期分组统计
    const trendData = dates.map(date => {
      const dayRecords = records.filter(r => r.date === date)
      const total = dayRecords.length
      const completed = dayRecords.filter(r => r.isCompleted).length
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0

      return {
        date,
        total,
        completed,
        rate
      }
    })

    return {
      success: true,
      data: trendData
    }
  } catch (err) {
    console.error('[getTrend] 获取趋势数据失败', err)
    throw new Error('获取趋势数据失败')
  }
}

/**
 * 获取成就徽章
 */
async function getBadges (event, wxContext) {
  const openid = wxContext.OPENID

  try {
    // 获取用户统计
    const userRes = await db.collection('users').where({
      _openid: openid
    }).get()

    if (userRes.data.length === 0) {
      return {
        success: true,
        data: []
      }
    }

    const userStats = userRes.data[0].stats
    const badges = []

    // 连续打卡徽章
    if (userStats.currentStreak >= 7) {
      badges.push({
        id: 'streak_7',
        name: '坚持一周',
        description: '连续打卡7天',
        icon: 'streak',
        color: '#4CAF50',
        unlocked: true,
        unlockTime: new Date()
      })
    }

    if (userStats.currentStreak >= 30) {
      badges.push({
        id: 'streak_30',
        name: '坚持一月',
        description: '连续打卡30天',
        icon: 'streak',
        color: '#FF9800',
        unlocked: true,
        unlockTime: new Date()
      })
    }

    if (userStats.currentStreak >= 100) {
      badges.push({
        id: 'streak_100',
        name: '百日坚持',
        description: '连续打卡100天',
        icon: 'streak',
        color: '#F44336',
        unlocked: true,
        unlockTime: new Date()
      })
    }

    // 总天数徽章
    if (userStats.totalDays >= 10) {
      badges.push({
        id: 'total_10',
        name: '初出茅庐',
        description: '累计打卡10天',
        icon: 'total',
        color: '#2196F3',
        unlocked: true,
        unlockTime: new Date()
      })
    }

    if (userStats.totalDays >= 50) {
      badges.push({
        id: 'total_50',
        name: '小有成就',
        description: '累计打卡50天',
        icon: 'total',
        color: '#9C27B0',
        unlocked: true,
        unlockTime: new Date()
      })
    }

    if (userStats.totalDays >= 365) {
      badges.push({
        id: 'total_365',
        name: '年度达人',
        description: '累计打卡365天',
        icon: 'total',
        color: '#FF5722',
        unlocked: true,
        unlockTime: new Date()
      })
    }

    // 完成率徽章
    if (userStats.completionRate >= 80 && userStats.totalDays >= 30) {
      badges.push({
        id: 'rate_80',
        name: '优秀学员',
        description: '完成率达到80%',
        icon: 'rate',
        color: '#00BCD4',
        unlocked: true,
        unlockTime: new Date()
      })
    }

    if (userStats.completionRate >= 95 && userStats.totalDays >= 30) {
      badges.push({
        id: 'rate_95',
        name: '完美主义者',
        description: '完成率达到95%',
        icon: 'rate',
        color: '#E91E63',
        unlocked: true,
        unlockTime: new Date()
      })
    }

    // 获取维度特殊徽章
    const recordRes = await db.collection('records').where({
      _openid: openid,
      isCompleted: true
    }).get()

    const records = recordRes.data
    const dimensions = ['exercise', 'diet', 'sleep', 'reading', 'study']

    dimensions.forEach(dim => {
      const dimRecords = records.filter(r => r.category === dim)
      if (dimRecords.length >= 30) {
        badges.push({
          id: `${dim}_30`,
          name: `${getDimensionName(dim)}达人`,
          description: `${getDimensionName(dim)}打卡30天`,
          icon: dim,
          color: getDimensionColor(dim),
          unlocked: true,
          unlockTime: new Date()
        })
      }
    })

    return {
      success: true,
      data: badges
    }
  } catch (err) {
    console.error('[getBadges] 获取徽章失败', err)
    throw new Error('获取徽章失败')
  }
}

/**
 * 获取热力图数据
 */
async function getHeatmap (event, wxContext) {
  const { year = new Date().getFullYear() } = event
  const openid = wxContext.OPENID

  try {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    // 获取全年记录
    const recordRes = await db.collection('records').where({
      _openid: openid,
      date: _.gte(startDate).and(_.lte(endDate))
    }).get()

    const records = recordRes.data

    // 按日期统计完成数量
    const heatmapData = {}
    records.forEach(record => {
      if (!heatmapData[record.date]) {
        heatmapData[record.date] = {
          date: record.date,
          total: 0,
          completed: 0
        }
      }
      heatmapData[record.date].total++
      if (record.isCompleted) {
        heatmapData[record.date].completed++
      }
    })

    // 转换为数组并计算等级
    const result = Object.values(heatmapData).map(item => ({
      ...item,
      level: getHeatmapLevel(item.completed)
    }))

    return {
      success: true,
      data: result
    }
  } catch (err) {
    console.error('[getHeatmap] 获取热力图数据失败', err)
    throw new Error('获取热力图数据失败')
  }
}

/**
 * 导出数据
 */
async function exportData (event, wxContext) {
  const { startDate, endDate, format = 'json' } = event
  const openid = wxContext.OPENID

  try {
    // 构建查询条件
    const where = { _openid: openid }
    if (startDate && endDate) {
      where.date = _.gte(startDate).and(_.lte(endDate))
    }

    // 获取记录
    const recordRes = await db.collection('records').where(where)
      .orderBy('date', 'desc')
      .get()

    // 获取计划信息
    const planRes = await db.collection('plans').where({
      _openid: openid
    }).get()

    const plans = planRes.data
    const planMap = {}
    plans.forEach(plan => {
      planMap[plan._id] = plan
    })

    // 组合数据
    const exportRecords = recordRes.data.map(record => ({
      日期: record.date,
      维度: getDimensionName(record.category),
      任务名称: record.planTitle,
      目标: getTargetText(record),
      实际: getActualText(record),
      是否完成: record.isCompleted ? '是' : '否',
      备注: record.remark || ''
    }))

    return {
      success: true,
      data: {
        records: exportRecords,
        summary: {
          总记录数: exportRecords.length,
          完成数: exportRecords.filter(r => r.是否完成 === '是').length,
          完成率: exportRecords.length > 0
            ? Math.round((exportRecords.filter(r => r.是否完成 === '是').length / exportRecords.length) * 100) + '%'
            : '0%'
        }
      }
    }
  } catch (err) {
    console.error('[exportData] 导出数据失败', err)
    throw new Error('导出数据失败')
  }
}

/**
 * 获取维度名称
 */
function getDimensionName (category) {
  const nameMap = {
    exercise: '运动健身',
    diet: '健康饮食',
    sleep: '作息睡眠',
    reading: '阅读',
    study: '学习'
  }
  return nameMap[category] || category
}

/**
 * 获取维度颜色
 */
function getDimensionColor (category) {
  const colorMap = {
    exercise: '#4CAF50',
    diet: '#FF9800',
    sleep: '#2196F3',
    reading: '#9C27B0',
    study: '#F44336'
  }
  return colorMap[category] || '#999'
}

/**
 * 获取目标文本
 */
function getTargetText (record) {
  if (record.targetType === 'duration') {
    return `${record.targetValue}${record.targetUnit || '分钟'}`
  } else if (record.targetType === 'count') {
    return `${record.targetValue}${record.targetUnit || '次'}`
  } else if (record.targetType === 'boolean') {
    return '完成'
  } else if (record.targetType === 'time') {
    return record.targetValue
  }
  return '-'
}

/**
 * 获取实际文本
 */
function getActualText (record) {
  if (record.targetType === 'duration') {
    return `${record.actualValue}${record.targetUnit || '分钟'}`
  } else if (record.targetType === 'count') {
    return `${record.actualValue}${record.targetUnit || '次'}`
  } else if (record.targetType === 'boolean') {
    return record.actualValue ? '已完成' : '未完成'
  } else if (record.targetType === 'time') {
    return record.actualValue
  }
  return '-'
}

/**
 * 获取热力图等级
 */
function getHeatmapLevel (completed) {
  if (completed === 0) return 0
  if (completed <= 2) return 1
  if (completed <= 4) return 2
  if (completed <= 6) return 3
  return 4
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
