// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 计划管理云函数
 * 处理任务计划的所有CRUD操作
 */
exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()

  try {
    switch (action) {
      case 'create':
        return await createPlan(event, wxContext)
      case 'update':
        return await updatePlan(event, wxContext)
      case 'delete':
        return await deletePlan(event, wxContext)
      case 'list':
        return await listPlans(event, wxContext)
      case 'detail':
        return await getPlanDetail(event, wxContext)
      case 'toggle':
        return await togglePlan(event, wxContext)
      case 'batchUpdate':
        return await batchUpdatePlans(event, wxContext)
      default:
        return {
          success: false,
          errMsg: `未知的操作类型: ${action}`
        }
    }
  } catch (err) {
    console.error('[云函数][plan] 调用失败', err)
    return {
      success: false,
      errMsg: err.message || '操作失败'
    }
  }
}

/**
 * 创建计划
 */
async function createPlan (event, wxContext) {
  const { title, category, targetType, targetValue, targetUnit, reminderTime, days } = event
  const openid = wxContext.OPENID

  // 参数验证
  if (!title || !category || !targetType) {
    return {
      success: false,
      errMsg: '缺少必要参数'
    }
  }

  // 验证分类
  const validCategories = ['exercise', 'diet', 'sleep', 'reading', 'study']
  if (!validCategories.includes(category)) {
    return {
      success: false,
      errMsg: '无效的分类'
    }
  }

  // 验证目标类型
  const validTargetTypes = ['duration', 'count', 'boolean', 'time']
  if (!validTargetTypes.includes(targetType)) {
    return {
      success: false,
      errMsg: '无效的目标类型'
    }
  }

  try {
    const now = new Date()

    const newPlan = {
      _openid: openid,
      title,
      category,
      targetType,
      targetValue: targetValue || null,
      targetUnit: targetUnit || '',
      reminderTime: reminderTime || '',
      days: days || [1, 2, 3, 4, 5, 6, 0], // 默认每天
      isEnabled: true,
      status: 'active',
      createTime: now,
      updateTime: now,
      stats: {
        totalDays: 0,
        completedDays: 0,
        currentStreak: 0,
        maxStreak: 0,
        completionRate: 0
      }
    }

    const res = await db.collection('plans').add({
      data: newPlan
    })

    return {
      success: true,
      data: {
        _id: res._id,
        ...newPlan
      }
    }
  } catch (err) {
    console.error('[createPlan] 创建计划失败', err)
    throw new Error('创建计划失败')
  }
}

/**
 * 更新计划
 */
async function updatePlan (event, wxContext) {
  const { planId, title, targetType, targetValue, targetUnit, reminderTime, days } = event
  const openid = wxContext.OPENID

  if (!planId) {
    return {
      success: false,
      errMsg: '缺少计划ID'
    }
  }

  try {
    // 构建更新数据
    const updateData = {}
    if (title !== undefined) updateData.title = title
    if (targetType !== undefined) updateData.targetType = targetType
    if (targetValue !== undefined) updateData.targetValue = targetValue
    if (targetUnit !== undefined) updateData.targetUnit = targetUnit
    if (reminderTime !== undefined) updateData.reminderTime = reminderTime
    if (days !== undefined) updateData.days = days

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        errMsg: '没有需要更新的数据'
      }
    }

    updateData.updateTime = new Date()

    const res = await db.collection('plans').doc(planId).update({
      data: updateData
    })

    if (res.stats.updated === 0) {
      return {
        success: false,
        errMsg: '计划不存在或无权操作'
      }
    }

    return {
      success: true,
      data: updateData
    }
  } catch (err) {
    console.error('[updatePlan] 更新计划失败', err)
    throw new Error('更新计划失败')
  }
}

/**
 * 删除计划
 */
async function deletePlan (event, wxContext) {
  const { planId } = event
  const openid = wxContext.OPENID

  if (!planId) {
    return {
      success: false,
      errMsg: '缺少计划ID'
    }
  }

  try {
    // 软删除：更新状态为deleted
    const res = await db.collection('plans').where({
      _id: planId,
      _openid: openid
    }).update({
      data: {
        status: 'deleted',
        deleteTime: new Date()
      }
    })

    if (res.stats.updated === 0) {
      return {
        success: false,
        errMsg: '计划不存在或无权操作'
      }
    }

    return {
      success: true
    }
  } catch (err) {
    console.error('[deletePlan] 删除计划失败', err)
    throw new Error('删除计划失败')
  }
}

/**
 * 获取计划列表
 */
async function listPlans (event, wxContext) {
  const { category, status = 'active' } = event.params || {}
  const openid = wxContext.OPENID

  try {
    // 构建查询条件
    const where = {
      _openid: openid,
      status: status
    }

    if (category) {
      where.category = category
    }

    const res = await db.collection('plans')
      .where(where)
      .orderBy('createTime', 'desc')
      .get()

    return {
      success: true,
      data: res.data
    }
  } catch (err) {
    console.error('[listPlans] 获取计划列表失败', err)
    throw new Error('获取计划列表失败')
  }
}

/**
 * 获取计划详情
 */
async function getPlanDetail (event, wxContext) {
  const { planId } = event
  const openid = wxContext.OPENID

  if (!planId) {
    return {
      success: false,
      errMsg: '缺少计划ID'
    }
  }

  try {
    const res = await db.collection('plans').where({
      _id: planId,
      _openid: openid
    }).get()

    if (res.data.length === 0) {
      return {
        success: false,
        errMsg: '计划不存在或无权访问'
      }
    }

    return {
      success: true,
      data: res.data[0]
    }
  } catch (err) {
    console.error('[getPlanDetail] 获取计划详情失败', err)
    throw new Error('获取计划详情失败')
  }
}

/**
 * 启用/禁用计划
 */
async function togglePlan (event, wxContext) {
  const { planId, isEnabled } = event
  const openid = wxContext.OPENID

  if (!planId || isEnabled === undefined) {
    return {
      success: false,
      errMsg: '缺少必要参数'
    }
  }

  try {
    const res = await db.collection('plans').where({
      _id: planId,
      _openid: openid
    }).update({
      data: {
        isEnabled: isEnabled,
        updateTime: new Date()
      }
    })

    if (res.stats.updated === 0) {
      return {
        success: false,
        errMsg: '计划不存在或无权操作'
      }
    }

    return {
      success: true,
      data: { isEnabled }
    }
  } catch (err) {
    console.error('[togglePlan] 切换计划状态失败', err)
    throw new Error('切换计划状态失败')
  }
}

/**
 * 批量更新计划
 */
async function batchUpdatePlans (event, wxContext) {
  const { plans } = event
  const openid = wxContext.OPENID

  if (!plans || !Array.isArray(plans) || plans.length === 0) {
    return {
      success: false,
      errMsg: '缺少计划数据'
    }
  }

  try {
    const updateTime = new Date()
    const updatePromises = plans.map(plan => {
      if (!plan._id) return Promise.resolve(null)

      const updateData = { updateTime }
      if (plan.isEnabled !== undefined) updateData.isEnabled = plan.isEnabled
      if (plan.order !== undefined) updateData.order = plan.order

      return db.collection('plans').where({
        _id: plan._id,
        _openid: openid
      }).update({
        data: updateData
      })
    })

    const results = await Promise.all(updatePromises)
    const successCount = results.filter(r => r && r.stats.updated > 0).length

    return {
      success: true,
      data: {
        total: plans.length,
        success: successCount,
        failed: plans.length - successCount
      }
    }
  } catch (err) {
    console.error('[batchUpdatePlans] 批量更新计划失败', err)
    throw new Error('批量更新计划失败')
  }
}
