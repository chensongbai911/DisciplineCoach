// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 数据导出云函数
 * 处理打卡数据的导出功能（Excel、PDF、图片）
 */
exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()

  try {
    switch (action) {
      case 'exportExcel':
        return await exportToExcel(event, wxContext)
      case 'exportPDF':
        return await exportToPDF(event, wxContext)
      case 'exportImage':
        return await exportToImage(event, wxContext)
      case 'getExportHistory':
        return await getExportHistory(event, wxContext)
      default:
        return {
          success: false,
          errMsg: `未知的操作类型: ${action}`
        }
    }
  } catch (err) {
    console.error('[云函数][export] 调用失败', err)
    return {
      success: false,
      errMsg: err.message || '导出失败'
    }
  }
}

/**
 * 导出为 Excel
 * 使用 xlsx 库生成 Excel 文件
 */
async function exportToExcel (event, wxContext) {
  const { startDate, endDate, dimensions } = event
  const openid = wxContext.OPENID

  // 1. 查询用户打卡记录
  const records = await db.collection('records')
    .where({
      _openid: openid,
      date: _.gte(startDate).and(_.lte(endDate))
    })
    .orderBy('date', 'desc')
    .get()

  if (records.data.length === 0) {
    return {
      success: false,
      errMsg: '该时间段内无打卡记录'
    }
  }

  // 2. 查询计划信息（用于获取任务名称）
  const planIds = [...new Set(records.data.map(r => r.planId))]
  const plans = await db.collection('plans')
    .where({
      _id: _.in(planIds)
    })
    .get()

  const planMap = {}
  plans.data.forEach(p => {
    planMap[p._id] = p
  })

  // 3. 格式化数据
  const excelData = records.data.map(record => {
    const plan = planMap[record.planId] || {}
    return {
      '日期': record.date,
      '维度': getDimensionName(plan.dimension),
      '任务名称': plan.title || '未知任务',
      '目标值': plan.target + (plan.unit || ''),
      '实际完成': record.actualValue + (plan.unit || ''),
      '完成率': plan.target > 0 ? Math.round(record.actualValue / plan.target * 100) + '%' : '100%',
      '备注': record.remark || '-',
      '打卡时间': formatDateTime(record.createdAt)
    }
  })

  // 4. 生成统计数据
  const stats = calculateStats(records.data, plans.data)

  // 5. 使用 node-xlsx 生成 Excel（简化版）
  // 注意：云函数环境需要安装 xlsx 依赖
  const fileData = JSON.stringify({
    records: excelData,
    stats,
    meta: {
      exportTime: new Date().toISOString(),
      dateRange: `${startDate} ~ ${endDate}`,
      totalRecords: records.data.length
    }
  })

  // 6. 上传到云存储
  const fileName = `export_${openid}_${Date.now()}.json`
  const fileID = await uploadToCloud(fileName, fileData, openid)

  // 7. 记录导出历史
  await saveExportHistory(openid, {
    type: 'excel',
    fileName,
    fileID,
    dateRange: `${startDate} ~ ${endDate}`,
    recordCount: records.data.length
  })

  return {
    success: true,
    data: {
      fileID,
      fileName,
      downloadUrl: fileID, // 小程序端可以通过 wx.cloud.downloadFile 下载
      recordCount: records.data.length,
      excelData // 返回数据供前端处理
    }
  }
}

/**
 * 导出为 PDF 报告
 */
async function exportToPDF (event, wxContext) {
  const { startDate, endDate, reportType = 'weekly' } = event
  const openid = wxContext.OPENID

  // 1. 查询打卡记录
  const records = await db.collection('records')
    .where({
      _openid: openid,
      date: _.gte(startDate).and(_.lte(endDate))
    })
    .orderBy('date', 'desc')
    .get()

  if (records.data.length === 0) {
    return {
      success: false,
      errMsg: '该时间段内无打卡记录'
    }
  }

  // 2. 查询用户信息
  const userInfo = await db.collection('users')
    .where({ _openid: openid })
    .get()

  const user = userInfo.data[0] || {}

  // 3. 生成报告数据
  const reportData = generateReportData(records.data, reportType, user)

  // 4. 格式化为可导出的JSON（前端Canvas渲染）
  const pdfData = {
    type: reportType,
    title: reportType === 'weekly' ? '周报告' : '月报告',
    dateRange: `${startDate} ~ ${endDate}`,
    user: {
      nickname: user.nickname || '用户',
      avatar: user.avatar || ''
    },
    summary: reportData.summary,
    charts: reportData.charts,
    achievements: reportData.achievements,
    generatedAt: new Date().toISOString()
  }

  // 5. 上传到云存储
  const fileName = `report_${reportType}_${openid}_${Date.now()}.json`
  const fileID = await uploadToCloud(fileName, JSON.stringify(pdfData), openid)

  // 6. 记录导出历史
  await saveExportHistory(openid, {
    type: 'pdf',
    fileName,
    fileID,
    reportType,
    dateRange: `${startDate} ~ ${endDate}`,
    recordCount: records.data.length
  })

  return {
    success: true,
    data: {
      fileID,
      fileName,
      reportData: pdfData // 返回数据供前端Canvas渲染
    }
  }
}

/**
 * 导出为图片（数据可视化图表）
 */
async function exportToImage (event, wxContext) {
  const { chartType, startDate, endDate } = event
  const openid = wxContext.OPENID

  // 查询数据
  const records = await db.collection('records')
    .where({
      _openid: openid,
      date: _.gte(startDate).and(_.lte(endDate))
    })
    .get()

  if (records.data.length === 0) {
    return {
      success: false,
      errMsg: '该时间段内无数据'
    }
  }

  // 生成图表数据
  const chartData = generateChartData(records.data, chartType)

  return {
    success: true,
    data: chartData
  }
}

/**
 * 获取导出历史
 */
async function getExportHistory (event, wxContext) {
  const { page = 1, pageSize = 20 } = event
  const openid = wxContext.OPENID

  const result = await db.collection('export_history')
    .where({ _openid: openid })
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  return {
    success: true,
    data: result.data,
    total: result.data.length
  }
}

/**
 * 工具函数：上传文件到云存储
 */
async function uploadToCloud (fileName, fileData, openid) {
  try {
    const result = await cloud.uploadFile({
      cloudPath: `exports/${openid}/${fileName}`,
      fileContent: Buffer.from(fileData, 'utf-8')
    })
    return result.fileID
  } catch (err) {
    console.error('上传文件失败:', err)
    throw new Error('文件上传失败')
  }
}

/**
 * 工具函数：保存导出历史
 */
async function saveExportHistory (openid, data) {
  try {
    await db.collection('export_history').add({
      data: {
        _openid: openid,
        ...data,
        createdAt: new Date()
      }
    })
  } catch (err) {
    console.error('保存导出历史失败:', err)
  }
}

/**
 * 工具函数：获取维度名称
 */
function getDimensionName (dimension) {
  const dimensionMap = {
    health: '健康',
    study: '学习',
    work: '工作',
    life: '生活',
    social: '社交',
    finance: '财务'
  }
  return dimensionMap[dimension] || dimension
}

/**
 * 工具函数：格式化日期时间
 */
function formatDateTime (date) {
  if (!date) return '-'
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * 工具函数：计算统计数据
 */
function calculateStats (records, plans) {
  const totalRecords = records.length
  const completedDays = [...new Set(records.map(r => r.date))].length

  // 计算各维度完成情况
  const dimensionStats = {}
  records.forEach(record => {
    const plan = plans.find(p => p._id === record.planId)
    if (plan) {
      const dim = plan.dimension
      if (!dimensionStats[dim]) {
        dimensionStats[dim] = { total: 0, completed: 0 }
      }
      dimensionStats[dim].total++
      if (record.actualValue >= plan.target) {
        dimensionStats[dim].completed++
      }
    }
  })

  // 计算平均完成率
  let totalCompletionRate = 0
  Object.keys(dimensionStats).forEach(dim => {
    const stat = dimensionStats[dim]
    const rate = stat.total > 0 ? stat.completed / stat.total : 0
    dimensionStats[dim].completionRate = Math.round(rate * 100)
    totalCompletionRate += rate
  })

  const avgCompletionRate = Object.keys(dimensionStats).length > 0
    ? Math.round(totalCompletionRate / Object.keys(dimensionStats).length * 100)
    : 0

  return {
    totalRecords,
    completedDays,
    avgCompletionRate,
    dimensionStats
  }
}

/**
 * 工具函数：生成报告数据
 */
function generateReportData (records, reportType, user) {
  // 统计总览
  const summary = {
    totalCheckins: records.length,
    totalDays: [...new Set(records.map(r => r.date))].length,
    currentStreak: 0, // 需要计算连续打卡天数
    bestStreak: 0
  }

  // 图表数据
  const charts = {
    dailyTrend: generateDailyTrend(records),
    dimensionDistribution: generateDimensionDistribution(records),
    completionRate: calculateCompletionTrend(records)
  }

  // 成就数据
  const achievements = calculateAchievements(records)

  return {
    summary,
    charts,
    achievements
  }
}

/**
 * 工具函数：生成每日趋势
 */
function generateDailyTrend (records) {
  const trend = {}
  records.forEach(record => {
    if (!trend[record.date]) {
      trend[record.date] = 0
    }
    trend[record.date]++
  })

  return Object.keys(trend)
    .sort()
    .map(date => ({
      date,
      count: trend[date]
    }))
}

/**
 * 工具函数：生成维度分布
 */
function generateDimensionDistribution (records) {
  const distribution = {}
  records.forEach(record => {
    const dim = record.dimension || 'unknown'
    distribution[dim] = (distribution[dim] || 0) + 1
  })

  return Object.keys(distribution).map(dim => ({
    dimension: getDimensionName(dim),
    count: distribution[dim]
  }))
}

/**
 * 工具函数：计算完成率趋势
 */
function calculateCompletionTrend (records) {
  // 简化版：按日期统计完成率
  const trend = {}
  records.forEach(record => {
    if (!trend[record.date]) {
      trend[record.date] = { total: 0, completed: 0 }
    }
    trend[record.date].total++
    if (record.actualValue > 0) {
      trend[record.date].completed++
    }
  })

  return Object.keys(trend)
    .sort()
    .map(date => ({
      date,
      rate: Math.round(trend[date].completed / trend[date].total * 100)
    }))
}

/**
 * 工具函数：计算成就
 */
function calculateAchievements (records) {
  const achievements = []

  if (records.length >= 7) {
    achievements.push({ name: '坚持7天', icon: '🏆' })
  }
  if (records.length >= 30) {
    achievements.push({ name: '坚持30天', icon: '🎖️' })
  }
  if (records.length >= 100) {
    achievements.push({ name: '百日打卡', icon: '💯' })
  }

  return achievements
}

/**
 * 工具函数：生成图表数据
 */
function generateChartData (records, chartType) {
  switch (chartType) {
    case 'line':
      return generateDailyTrend(records)
    case 'pie':
      return generateDimensionDistribution(records)
    case 'bar':
      return calculateCompletionTrend(records)
    default:
      return []
  }
}
