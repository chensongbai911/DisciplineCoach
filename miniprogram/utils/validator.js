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

/**
 * 通用字段验证器
 * @param {string} field 字段名
 * @param {*} value 字段值
 * @param {object} rules 验证规则
 * @returns {object} {valid, message}
 */
function validateField (field, value, rules = {}) {
  // 必填验证
  if (rules.required) {
    if (isEmpty(value)) {
      return {
        valid: false,
        message: rules.requiredMessage || `${rules.label || field}为必填项`
      }
    }
  }

  // 如果值为空且非必填，通过验证
  if (isEmpty(value) && !rules.required) {
    return { valid: true }
  }

  // 类型验证
  if (rules.type) {
    switch (rules.type) {
      case 'number':
        if (isNaN(Number(value))) {
          return { valid: false, message: `${rules.label || field}必须是数字` }
        }
        break
      case 'integer':
        if (!Number.isInteger(Number(value))) {
          return { valid: false, message: `${rules.label || field}必须是整数` }
        }
        break
      case 'phone':
        if (!isValidPhone(value)) {
          return { valid: false, message: '请输入正确的手机号' }
        }
        break
      case 'email':
        if (!isValidEmail(value)) {
          return { valid: false, message: '请输入正确的邮箱' }
        }
        break
    }
  }

  // 长度验证
  if (rules.minLength && String(value).length < rules.minLength) {
    return {
      valid: false,
      message: `${rules.label || field}至少${rules.minLength}个字符`
    }
  }

  if (rules.maxLength && String(value).length > rules.maxLength) {
    return {
      valid: false,
      message: `${rules.label || field}不能超过${rules.maxLength}个字符`
    }
  }

  // 数值范围验证
  if (rules.min !== undefined) {
    const num = Number(value)
    if (num < rules.min) {
      return {
        valid: false,
        message: `${rules.label || field}不能小于${rules.min}`
      }
    }
  }

  if (rules.max !== undefined) {
    const num = Number(value)
    if (num > rules.max) {
      return {
        valid: false,
        message: `${rules.label || field}不能大于${rules.max}`
      }
    }
  }

  // 正则验证
  if (rules.pattern) {
    const regex = new RegExp(rules.pattern)
    if (!regex.test(value)) {
      return {
        valid: false,
        message: rules.patternMessage || `${rules.label || field}格式不正确`
      }
    }
  }

  // 自定义验证函数
  if (rules.validator && typeof rules.validator === 'function') {
    const result = rules.validator(value)
    if (result !== true) {
      return {
        valid: false,
        message: typeof result === 'string' ? result : `${rules.label || field}验证失败`
      }
    }
  }

  return { valid: true }
}

/**
 * 批量验证多个字段
 * @param {object} data 数据对象
 * @param {object} rulesMap 规则映射 {field: rules}
 * @returns {object} {valid, errors}
 */
function validateForm (data, rulesMap) {
  const errors = {}
  let isValid = true

  for (const field in rulesMap) {
    const value = data[field]
    const rules = rulesMap[field]
    const result = validateField(field, value, rules)

    if (!result.valid) {
      errors[field] = result.message
      isValid = false
    }
  }

  return { valid: isValid, errors }
}

module.exports = {
  isEmpty,
  isValidPhone,
  isValidEmail,
  isInRange,
  isPositiveInteger,
  validateField,
  validateForm,
  validatePlanData,
  validateRecordData,
  validateFeedback
}
