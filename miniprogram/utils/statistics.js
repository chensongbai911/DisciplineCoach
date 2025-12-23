/**
 * statistics.js - 数据统计和分析工具
 * 提供完成率、趋势分析、维度对比等统计功能
 */

/**
 * 计算完成率
 * @param {number} completed - 已完成数
 * @param {number} total - 总数
 * @returns {number} 完成率百分比 (0-100)
 */
function calculateCompletionRate (completed, total) {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

/**
 * 计算连续天数
 * @param {Array<{date: string, completed: boolean}>} records - 记录数组
 * @returns {number} 连续天数
 */
function calculateStreak (records = []) {
  if (records.length === 0) return 0

  let streak = 0
  const today = new Date()

  // 按日期倒序排列
  const sortedRecords = records.sort((a, b) => {
    return new Date(b.date) - new Date(a.date)
  })

  for (const record of sortedRecords) {
    const recordDate = new Date(record.date)
    const expectedDate = new Date(today)
    expectedDate.setDate(expectedDate.getDate() - streak)

    // 检查日期是否连续
    if (recordDate.toDateString() === expectedDate.toDateString() && record.completed) {
      streak++
    } else {
      break
    }
  }

  return streak
}

/**
 * 生成趋势数据
 * @param {Array<{date: string, completed: number, total: number}>} dailyStats - 日统计数据
 * @param {number} days - 生成天数，默认30天
 * @returns {Array} 趋势数据
 */
function generateTrendData (dailyStats = [], days = 30) {
  const trendData = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const stat = dailyStats.find(s => s.date === dateStr)
    const rate = stat ? calculateCompletionRate(stat.completed, stat.total) : 0

    trendData.push({
      date: formatDateForChart(date),
      rate: rate
    })
  }

  return trendData
}

/**
 * 生成维度对比数据
 * @param {Array<{name: string, completed: number, total: number}>} dimensionStats - 维度统计
 * @returns {Array} 维度对比数据
 */
function generateDimensionChartData (dimensionStats = []) {
  return dimensionStats.map(dim => ({
    name: dim.name,
    value: calculateCompletionRate(dim.completed, dim.total),
    completed: dim.completed,
    total: dim.total
  }))
}

/**
 * 生成完成率环形图数据
 * @param {number} rate - 完成率 (0-100)
 * @returns {Array}
 */
function generateRateChartData (rate) {
  return [
    { value: rate, name: '已完成' },
    { value: 100 - rate, name: '未完成' }
  ]
}

/**
 * 计算周统计
 * @param {Array<{date: string, completed: number, total: number}>} dailyStats - 日统计
 * @returns {object}
 */
function calculateWeeklyStats (dailyStats = []) {
  const today = new Date()
  const weekStats = {
    week: [],
    totalCompleted: 0,
    totalTasks: 0,
    avgRate: 0
  }

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const stat = dailyStats.find(s => s.date === dateStr) || { completed: 0, total: 0 }
    weekStats.week.push({
      date: formatDateForChart(date),
      ...stat,
      rate: calculateCompletionRate(stat.completed, stat.total)
    })

    weekStats.totalCompleted += stat.completed
    weekStats.totalTasks += stat.total
  }

  weekStats.avgRate = calculateCompletionRate(weekStats.totalCompleted, weekStats.totalTasks)

  return weekStats
}

/**
 * 计算月统计
 * @param {Array<{date: string, completed: number, total: number}>} dailyStats - 日统计
 * @returns {object}
 */
function calculateMonthlyStats (dailyStats = []) {
  const today = new Date()
  const monthStats = {
    days: [],
    totalCompleted: 0,
    totalTasks: 0,
    avgRate: 0,
    bestDay: null,
    worstDay: null
  }

  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()

  for (let i = daysInMonth - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth(), i + 1)
    const dateStr = date.toISOString().split('T')[0]

    const stat = dailyStats.find(s => s.date === dateStr) || { completed: 0, total: 0 }
    const rate = calculateCompletionRate(stat.completed, stat.total)

    const dayData = {
      date: dateStr,
      ...stat,
      rate
    }

    monthStats.days.push(dayData)
    monthStats.totalCompleted += stat.completed
    monthStats.totalTasks += stat.total

    // 记录最佳和最差的一天
    if (!monthStats.bestDay || rate > monthStats.bestDay.rate) {
      monthStats.bestDay = dayData
    }
    if (!monthStats.worstDay || rate < monthStats.worstDay.rate) {
      monthStats.worstDay = dayData
    }
  }

  monthStats.avgRate = calculateCompletionRate(monthStats.totalCompleted, monthStats.totalTasks)

  return monthStats
}

/**
 * 生成成就徽章数据
 * @param {object} userStats - 用户统计数据
 * @returns {Array} 成就徽章列表
 */
function generateAchievements (userStats = {}) {
  const achievements = [
    {
      id: 1,
      name: '初心',
      icon: '🌱',
      requirement: '完成第1次打卡',
      unlocked: userStats.totalDays >= 1
    },
    {
      id: 2,
      name: '坚持',
      icon: '💪',
      requirement: '连续打卡7天',
      unlocked: userStats.currentStreak >= 7
    },
    {
      id: 3,
      name: '恒心',
      icon: '🔥',
      requirement: '连续打卡30天',
      unlocked: userStats.currentStreak >= 30
    },
    {
      id: 4,
      name: '百日',
      icon: '🏆',
      requirement: '连续打卡100天',
      unlocked: userStats.currentStreak >= 100
    },
    {
      id: 5,
      name: '完美',
      icon: '💎',
      requirement: '单日完成率100%',
      unlocked: userStats.bestDayRate === 100
    },
    {
      id: 6,
      name: '全能',
      icon: '🌟',
      requirement: '开启全部5个维度',
      unlocked: (userStats.activeDimensions || 0) >= 5
    }
  ]

  return achievements
}

/**
 * 计算用户等级
 * @param {number} totalDays - 总打卡天数
 * @returns {object} 等级信息
 */
function calculateUserLevel (totalDays = 0) {
  const levels = [
    { level: 1, name: '初学者', minDays: 0, maxDays: 7 },
    { level: 2, name: '追梦者', minDays: 8, maxDays: 30 },
    { level: 3, name: '行动者', minDays: 31, maxDays: 100 },
    { level: 4, name: '坚持者', minDays: 101, maxDays: 365 },
    { level: 5, name: '自律大师', minDays: 366, maxDays: Infinity }
  ]

  const currentLevel = levels.find(l => totalDays >= l.minDays && totalDays <= l.maxDays)
  const nextLevel = levels.find(l => l.level === (currentLevel.level + 1))

  const progressPercent = nextLevel
    ? Math.round(((totalDays - currentLevel.minDays) / (nextLevel.minDays - currentLevel.minDays)) * 100)
    : 100

  return {
    level: currentLevel.level,
    name: currentLevel.name,
    icon: this.getLevelIcon(currentLevel.level),
    progress: {
      current: totalDays,
      next: nextLevel?.minDays || totalDays,
      percent: Math.min(progressPercent, 100)
    }
  }
}

/**
 * 获取等级图标
 * @param {number} level - 等级
 * @returns {string}
 */
function getLevelIcon (level) {
  const icons = ['👶', '🚴', '🏃', '💪', '👑']
  return icons[level - 1] || '👶'
}

/**
 * 格式化图表日期
 * @param {Date} date - 日期对象
 * @returns {string} 格式化的日期字符串
 */
function formatDateForChart (date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

/**
 * 计算排名（相对于设定的目标）
 * @param {number} rate - 完成率
 * @param {number} streak - 连续天数
 * @returns {object} 排名信息
 */
function calculateRanking (rate, streak) {
  let score = 0
  let rank = '新手'

  score += rate * 2  // 完成率权重
  score += streak * 3  // 连续天数权重

  if (score >= 500) {
    rank = '传奇'
  } else if (score >= 300) {
    rank = '钻石'
  } else if (score >= 150) {
    rank = '白金'
  } else if (score >= 50) {
    rank = '黄金'
  } else if (score >= 10) {
    rank = '白银'
  } else {
    rank = '青铜'
  }

  return {
    score,
    rank,
    icon: this.getRankIcon(rank)
  }
}

/**
 * 获取排名图标
 * @param {string} rank - 排名
 * @returns {string}
 */
function getRankIcon (rank) {
  const icons = {
    '新手': '🌱',
    '青铜': '🥉',
    '白银': '🥈',
    '黄金': '🥇',
    '白金': '💎',
    '钻石': '👑',
    '传奇': '🌟'
  }
  return icons[rank] || '🌱'
}

module.exports = {
  calculateCompletionRate,
  calculateStreak,
  generateTrendData,
  generateDimensionChartData,
  generateRateChartData,
  calculateWeeklyStats,
  calculateMonthlyStats,
  generateAchievements,
  calculateUserLevel,
  calculateRanking,
  formatDateForChart
}
