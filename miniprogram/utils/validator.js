/**
 * validator.js - 数据校验工具函数
 */

/**
 * 校验是否为空
 * @param {*} value
 * @returns {boolean}
 */
function isEmpty (value) {
  if (value === null || value === undefined) {
    return true
  }

  if (typeof value === 'string') {
    return value.trim() === ''
  }

  if (Array.isArray(value)) {
    return value.length === 0
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0
  }

  return false
}

/**
 * 校验手机号
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone (phone) {
  const reg = /^1[3-9]\d{9}$/
  return reg.test(phone)
}

/**
 * 校验邮箱
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail (email) {
  const reg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
  return reg.test(email)
}

/**
 * 校验数字范围
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
function isInRange (value, min, max) {
  const num = Number(value)
  if (isNaN(num)) {
    return false
  }
  return num >= min && num <= max
}

/**
 * 校验正整数
 * @param {*} value
 * @returns {boolean}
 */
function isPositiveInteger (value) {
  const num = Number(value)
  return Number.isInteger(num) && num > 0
}

/**
 * 校验计划数据
 * @param {object} planData
 * @returns {object} {valid, error}
 */
function validatePlanData (planData) {
  const { title, category, type, target, targetType } = planData

  // 校验标题
  if (isEmpty(title)) {
    return { valid: false, message: '请输入任务名称' }
  }

  if (title.length > 30) {
    return { valid: false, message: '任务名称不能超过30个字符' }
  }

  // 校验维度
  const validCategories = ['运动', '饮食', '睡眠', '阅读', '学习', 'exercise', 'diet', 'sleep', 'reading', 'study']
  if (!validCategories.includes(category)) {
    return { valid: false, message: '无效的维度' }
  }

  // 统一使用 type 或 targetType
  const taskType = type || targetType

  // 校验目标类型
  const validTypes = ['duration', 'count', 'boolean', 'time']
  if (!validTypes.includes(taskType)) {
    return { valid: false, message: '请选择目标类型' }
  }

  // 校验目标值
  if (taskType === 'duration' || taskType === 'count') {
    const targetValue = target?.value
    if (!targetValue || targetValue <= 0) {
      return { valid: false, message: '请输入有效的目标值' }
    }
  }

  // 校验时间类型
  if (taskType === 'time') {
    const startTime = target?.startTime
    const endTime = target?.endTime
    if (!startTime || !endTime) {
      return { valid: false, message: '请选择开始和结束时间' }
    }
  }

  return { valid: true }
}

/**
 * 校验打卡记录数据
 * @param {object} recordData
 * @returns {object} {valid, error}
 */
function validateRecordData (recordData) {
  const { plan_id, date, actual_value } = recordData

  // 校验计划ID
  if (isEmpty(plan_id)) {
    return { valid: false, error: '缺少计划ID' }
  }

  // 校验日期格式
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { valid: false, error: '日期格式错误' }
  }

  // 校验实际值
  if (actual_value === null || actual_value === undefined) {
    return { valid: false, error: '请输入完成情况' }
  }

  return { valid: true }
}

/**
 * 校验反馈内容
 * @param {string} content
 * @returns {object} {valid, error}
 */
function validateFeedback (content) {
  if (isEmpty(content)) {
    return { valid: false, error: '请输入反馈内容' }
  }

  if (content.length < 5) {
    return { valid: false, error: '反馈内容至少5个字符' }
  }

  if (content.length > 500) {
    return { valid: false, error: '反馈内容不能超过500个字符' }
  }

  return { valid: true }
}

module.exports = {
  isEmpty,
  isValidPhone,
  isValidEmail,
  isInRange,
  isPositiveInteger,
  validatePlanData,
  validateRecordData,
  validateFeedback
}
