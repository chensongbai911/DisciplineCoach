/**
 * date.js - 日期处理工具函数
 */

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date|string} date - 日期对象或字符串
 * @returns {string}
 */
function formatDate (date) {
  if (typeof date === 'string') {
    date = new Date(date)
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * 格式化日期为 MM月DD日
 * @param {Date|string} date - 日期对象或字符串
 * @returns {string}
 */
function formatDateChinese (date) {
  if (typeof date === 'string') {
    date = new Date(date)
  }

  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${month}月${day}日`
}

/**
 * 获取今天的日期字符串
 * @returns {string} YYYY-MM-DD
 */
function getToday () {
  return formatDate(new Date())
}

/**
 * 获取指定天数前/后的日期
 * @param {number} days - 天数（负数为前，正数为后）
 * @param {Date|string} baseDate - 基准日期，默认今天
 * @returns {string} YYYY-MM-DD
 */
function getDateByOffset (days, baseDate = new Date()) {
  if (typeof baseDate === 'string') {
    baseDate = new Date(baseDate)
  }

  const date = new Date(baseDate)
  date.setDate(date.getDate() + days)

  return formatDate(date)
}

/**
 * 获取最近N天的日期列表
 * @param {number} days - 天数
 * @returns {Array<string>} 日期数组，从今天往前
 */
function getRecentDays (days) {
  const dates = []
  for (let i = 0; i < days; i++) {
    dates.push(getDateByOffset(-i))
  }
  return dates
}

/**
 * 获取星期几
 * @param {Date|string} date - 日期
 * @returns {string} 周一到周日
 */
function getWeekday (date) {
  if (typeof date === 'string') {
    date = new Date(date)
  }

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[date.getDay()]
}

/**
 * 获取星期几的数字 (1-7)
 * @param {Date|string} date - 日期
 * @returns {number} 1=周一, 7=周日
 */
function getWeekdayNumber (date) {
  if (typeof date === 'string') {
    date = new Date(date)
  }

  const day = date.getDay()
  return day === 0 ? 7 : day
}

/**
 * 判断是否是今天
 * @param {Date|string} date - 日期
 * @returns {boolean}
 */
function isToday (date) {
  return formatDate(date) === getToday()
}

/**
 * 判断日期1是否在日期2之前
 * @param {Date|string} date1
 * @param {Date|string} date2
 * @returns {boolean}
 */
function isBefore (date1, date2) {
  if (typeof date1 === 'string') date1 = new Date(date1)
  if (typeof date2 === 'string') date2 = new Date(date2)

  return date1.getTime() < date2.getTime()
}

/**
 * 判断日期1是否在日期2之后
 * @param {Date|string} date1
 * @param {Date|string} date2
 * @returns {boolean}
 */
function isAfter (date1, date2) {
  if (typeof date1 === 'string') date1 = new Date(date1)
  if (typeof date2 === 'string') date2 = new Date(date2)

  return date1.getTime() > date2.getTime()
}

/**
 * 计算两个日期之间的天数差
 * @param {Date|string} date1
 * @param {Date|string} date2
 * @returns {number}
 */
function daysBetween (date1, date2) {
  if (typeof date1 === 'string') date1 = new Date(date1)
  if (typeof date2 === 'string') date2 = new Date(date2)

  const diff = Math.abs(date1.getTime() - date2.getTime())
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/**
 * 格式化时间为 HH:MM
 * @param {Date|string} time - 时间
 * @returns {string}
 */
function formatTime (time) {
  if (typeof time === 'string' && time.includes(':')) {
    return time.substring(0, 5) // 已经是 HH:MM 格式
  }

  if (typeof time === 'string') {
    time = new Date(time)
  }

  const hours = String(time.getHours()).padStart(2, '0')
  const minutes = String(time.getMinutes()).padStart(2, '0')

  return `${hours}:${minutes}`
}

/**
 * 格式化完整日期时间
 * @param {Date|string} datetime - 日期时间
 * @returns {string} YYYY-MM-DD HH:MM:SS
 */
function formatDateTime (datetime) {
  if (typeof datetime === 'string') {
    datetime = new Date(datetime)
  }

  const date = formatDate(datetime)
  const hours = String(datetime.getHours()).padStart(2, '0')
  const minutes = String(datetime.getMinutes()).padStart(2, '0')
  const seconds = String(datetime.getSeconds()).padStart(2, '0')

  return `${date} ${hours}:${minutes}:${seconds}`
}

/**
 * 计算睡眠时长（小时）
 * @param {string} sleepTime - 入睡时间 HH:MM
 * @param {string} wakeTime - 起床时间 HH:MM
 * @returns {number} 睡眠小时数
 */
function calculateSleepHours (sleepTime, wakeTime) {
  const [sleepHour, sleepMinute] = sleepTime.split(':').map(Number)
  const [wakeHour, wakeMinute] = wakeTime.split(':').map(Number)

  let sleepMinutes = sleepHour * 60 + sleepMinute
  let wakeMinutes = wakeHour * 60 + wakeMinute

  // 如果起床时间小于入睡时间，说明跨天了
  if (wakeMinutes < sleepMinutes) {
    wakeMinutes += 24 * 60
  }

  const totalMinutes = wakeMinutes - sleepMinutes
  return (totalMinutes / 60).toFixed(1)
}

/**
 * 获取友好的相对时间描述
 * @param {Date|string} date - 日期
 * @returns {string} 如"今天"、"昨天"、"3天前"
 */
function getRelativeTime (date) {
  const today = getToday()
  const targetDate = formatDate(date)

  if (targetDate === today) {
    return '今天'
  }

  const yesterday = getDateByOffset(-1)
  if (targetDate === yesterday) {
    return '昨天'
  }

  const days = daysBetween(today, targetDate)

  if (days <= 7) {
    return `${days}天前`
  }

  return formatDateChinese(date)
}

module.exports = {
  formatDate,
  formatDateChinese,
  getToday,
  getDateByOffset,
  getRecentDays,
  getWeekday,
  getWeekdayNumber,
  isToday,
  isBefore,
  isAfter,
  daysBetween,
  formatTime,
  formatDateTime,
  calculateSleepHours,
  getRelativeTime
}
