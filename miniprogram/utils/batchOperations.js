// utils/batchOperations.js
// 批量操作工具函数

const { recordAPI, planAPI } = require('./api');
const { getToday } = require('./date');
const vibrate = require('./vibrate');

/**
 * 批量打卡
 * @param {Array} tasks 任务列表
 * @param {Object} options 配置选项
 * @returns {Promise<Object>} 结果统计
 */
async function batchCheckin (tasks, options = {}) {
  const {
    remark = '批量打卡',
    onProgress = null, // 进度回调
    showLoading = true
  } = options;

  if (showLoading) {
    wx.showLoading({ title: '批量打卡中...' });
  }

  const results = {
    total: tasks.length,
    success: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];

    try {
      await recordAPI.create({
        planId: task.id || task._id,
        date: getToday(),
        actualValue: task.type === 'boolean' ? 1 : (task.targetValue || 1),
        remark
      });

      results.success++;

      // 调用进度回调
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: tasks.length,
          task,
          success: true
        });
      }

    } catch (error) {
      console.error(`任务 ${task.title} 打卡失败:`, error);
      results.failed++;
      results.errors.push({
        task,
        error: error.message || '未知错误'
      });

      // 调用进度回调
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: tasks.length,
          task,
          success: false,
          error
        });
      }
    }
  }

  if (showLoading) {
    wx.hideLoading();
  }

  // 震动反馈
  if (results.success > 0) {
    vibrate.success();
  } else {
    vibrate.error();
  }

  return results;
}

/**
 * 批量删除计划
 * @param {Array} planIds 计划ID列表
 * @param {Object} options 配置选项
 * @returns {Promise<Object>} 结果统计
 */
async function batchDeletePlans (planIds, options = {}) {
  const {
    onProgress = null,
    showLoading = true
  } = options;

  if (showLoading) {
    wx.showLoading({ title: '删除中...' });
  }

  const results = {
    total: planIds.length,
    success: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < planIds.length; i++) {
    const planId = planIds[i];

    try {
      await planAPI.delete(planId);
      results.success++;

      if (onProgress) {
        onProgress({
          current: i + 1,
          total: planIds.length,
          planId,
          success: true
        });
      }

    } catch (error) {
      console.error(`删除计划 ${planId} 失败:`, error);
      results.failed++;
      results.errors.push({
        planId,
        error: error.message || '未知错误'
      });

      if (onProgress) {
        onProgress({
          current: i + 1,
          total: planIds.length,
          planId,
          success: false,
          error
        });
      }
    }
  }

  if (showLoading) {
    wx.hideLoading();
  }

  // 震动反馈
  if (results.success > 0) {
    vibrate.medium();
  } else {
    vibrate.error();
  }

  return results;
}

/**
 * 批量更新计划状态
 * @param {Array} planIds 计划ID列表
 * @param {string} status 目标状态 'active' | 'paused' | 'completed'
 * @param {Object} options 配置选项
 * @returns {Promise<Object>} 结果统计
 */
async function batchUpdatePlanStatus (planIds, status, options = {}) {
  const {
    onProgress = null,
    showLoading = true
  } = options;

  if (showLoading) {
    wx.showLoading({ title: '更新中...' });
  }

  const results = {
    total: planIds.length,
    success: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < planIds.length; i++) {
    const planId = planIds[i];

    try {
      await planAPI.update(planId, { status });
      results.success++;

      if (onProgress) {
        onProgress({
          current: i + 1,
          total: planIds.length,
          planId,
          success: true
        });
      }

    } catch (error) {
      console.error(`更新计划 ${planId} 失败:`, error);
      results.failed++;
      results.errors.push({
        planId,
        error: error.message || '未知错误'
      });

      if (onProgress) {
        onProgress({
          current: i + 1,
          total: planIds.length,
          planId,
          success: false,
          error
        });
      }
    }
  }

  if (showLoading) {
    wx.hideLoading();
  }

  vibrate.medium();

  return results;
}

/**
 * 显示批量操作结果
 * @param {Object} results 操作结果
 * @param {string} actionName 操作名称
 */
function showBatchResults (results, actionName = '操作') {
  const { total, success, failed } = results;

  let title = '';
  let icon = 'success';

  if (failed === 0) {
    title = `${actionName}成功 ${success} 个`;
  } else if (success === 0) {
    title = `${actionName}全部失败`;
    icon = 'none';
  } else {
    title = `成功 ${success} 个，失败 ${failed} 个`;
    icon = 'none';
  }

  wx.showToast({
    title,
    icon,
    duration: 2000
  });
}

module.exports = {
  batchCheckin,
  batchDeletePlans,
  batchUpdatePlanStatus,
  showBatchResults
};
