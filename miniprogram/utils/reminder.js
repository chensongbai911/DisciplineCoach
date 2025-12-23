/**
 * 智能提醒工具类
 * 用于管理订阅消息、提醒设置和智能推荐
 */

// 引入订阅消息配置
const subscriptionConfig = require('../config/subscription.js');
const { TEMPLATE_IDS, ENABLE_SUBSCRIPTION, checkSubscriptionAvailable, getConfiguredTemplateIds } = subscriptionConfig;

// 提醒类型枚举
const REMINDER_TYPES = {
  DAILY_CHECKIN: 'daily_checkin',       // 每日打卡提醒
  STREAK_BREAK: 'streak_break',         // 连续中断警告
  WEEKLY_REPORT: 'weekly_report',       // 周报
  MONTHLY_REPORT: 'monthly_report',     // 月报
  ACHIEVEMENT: 'achievement'            // 成就解锁
};

// 默认提醒时间配置
const DEFAULT_REMINDER_TIME = {
  morning: '09:00',    // 早晨
  noon: '12:00',       // 中午
  afternoon: '15:00',  // 下午
  evening: '18:00',    // 傍晚
  night: '21:00'       // 晚上
};

/**
 * 请求订阅消息权限
 * @param {Array<string>} types - 提醒类型数组
 * @returns {Promise<Object>} 授权结果
 */
function requestSubscribe (types = ['CHECKIN_REMINDER']) {
  return new Promise((resolve, reject) => {
    // 检查订阅消息功能是否可用
    const availability = checkSubscriptionAvailable();

    if (!availability.available) {
      console.log(`[订阅消息] 功能不可用: ${availability.message}`);
      // 返回模拟成功,避免阻塞业务流程
      resolve({
        success: true,
        disabled: true,
        reason: availability.reason,
        message: availability.message
      });
      return;
    }

    // 获取已配置的模板ID
    const tmplIds = getConfiguredTemplateIds(types);

    if (tmplIds.length === 0) {
      console.warn('[订阅消息] 请求的模板ID均未配置');
      resolve({
        success: true,
        disabled: true,
        reason: 'no_valid_template',
        message: '请求的模板ID均未配置'
      });
      return;
    }

    console.log('[订阅消息] 请求授权:', tmplIds);

    wx.requestSubscribeMessage({
      tmplIds,
      success: (res) => {
        console.log('订阅消息授权结果:', res);
        const result = {
          success: true,
          authorized: {},
          rejected: {}
        };

        // 解析每个模板的授权状态
        tmplIds.forEach((id, index) => {
          const type = types[index];
          const status = res[id];

          if (status === 'accept') {
            result.authorized[type] = true;
          } else {
            result.rejected[type] = status || 'unknown';
          }
        });

        resolve(result);
      },
      fail: (err) => {
        console.error('订阅消息授权失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 检查提醒权限状态
 * @returns {Promise<boolean>}
 */
function checkReminderPermission () {
  return new Promise((resolve) => {
    wx.getSetting({
      withSubscriptions: true,
      success: (res) => {
        const hasPermission = res.subscriptionsSetting?.mainSwitch || false;
        resolve(hasPermission);
      },
      fail: () => {
        resolve(false);
      }
    });
  });
}

/**
 * 分析用户打卡习惯，智能推荐提醒时间
 * @param {Array} records - 打卡记录数组
 * @returns {string} 推荐的提醒时间 (HH:mm)
 */
function analyzeReminderTime (records = []) {
  if (!records || records.length === 0) {
    // 无记录，返回默认晚间时间
    return DEFAULT_REMINDER_TIME.evening;
  }

  // 提取所有打卡时间的小时数
  const hours = records.map(record => {
    const date = new Date(record.createdAt || record.checkInTime);
    return date.getHours();
  }).filter(h => h >= 0 && h < 24);

  if (hours.length === 0) {
    return DEFAULT_REMINDER_TIME.evening;
  }

  // 统计每个小时的打卡次数
  const hourCounts = {};
  hours.forEach(h => {
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });

  // 找出最常打卡的小时
  let maxCount = 0;
  let mostCommonHour = 18; // 默认18点

  Object.entries(hourCounts).forEach(([hour, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonHour = parseInt(hour);
    }
  });

  // 提前1小时提醒
  const reminderHour = mostCommonHour > 0 ? mostCommonHour - 1 : 18;
  return `${String(reminderHour).padStart(2, '0')}:00`;
}

/**
 * 获取推荐的提醒时段
 * @param {Array} records - 打卡记录
 * @returns {string} 时段名称
 */
function getRecommendedPeriod (records = []) {
  const time = analyzeReminderTime(records);
  const hour = parseInt(time.split(':')[0]);

  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 14) return 'noon';
  if (hour >= 14 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

/**
 * 保存提醒设置
 * @param {Object} settings - 提醒设置
 */
function saveReminderSettings (settings) {
  try {
    wx.setStorageSync('reminderSettings', {
      ...settings,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('保存提醒设置失败:', error);
    return false;
  }
}

/**
 * 获取提醒设置
 * @returns {Object} 提醒设置
 */
function getReminderSettings () {
  try {
    const settings = wx.getStorageSync('reminderSettings');
    return settings || {
      enabled: false,
      time: DEFAULT_REMINDER_TIME.evening,
      period: 'evening',
      types: {
        dailyCheckin: true,
        streakWarning: true,
        weeklyReport: false,
        monthlyReport: false
      }
    };
  } catch (error) {
    console.error('获取提醒设置失败:', error);
    return null;
  }
}

/**
 * 格式化提醒时间显示
 * @param {string} time - HH:mm 格式的时间
 * @returns {string} 格式化后的时间
 */
function formatReminderTime (time) {
  if (!time) return '未设置';

  const [hour, minute] = time.split(':').map(Number);
  const period = hour < 12 ? '上午' : (hour < 18 ? '下午' : '晚上');
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);

  return `${period} ${displayHour}:${String(minute).padStart(2, '0')}`;
}

/**
 * 计算下次提醒时间
 * @param {string} reminderTime - HH:mm 格式
 * @returns {Date} 下次提醒时间
 */
function getNextReminderTime (reminderTime) {
  const now = new Date();
  const [hour, minute] = reminderTime.split(':').map(Number);

  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);

  // 如果今天的提醒时间已过，设置为明天
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

/**
 * 判断是否需要提醒
 * @param {Object} lastCheckin - 最后一次打卡记录
 * @returns {boolean}
 */
function shouldRemind (lastCheckin) {
  if (!lastCheckin) return true;

  const now = new Date();
  const lastTime = new Date(lastCheckin.createdAt || lastCheckin.checkInTime);
  const diffHours = (now - lastTime) / (1000 * 60 * 60);

  // 超过20小时未打卡，需要提醒
  return diffHours >= 20;
}

/**
 * 生成提醒文案
 * @param {string} type - 提醒类型
 * @param {Object} data - 数据
 * @returns {Object} 提醒文案
 */
function generateReminderContent (type, data = {}) {
  const templates = {
    [REMINDER_TYPES.DAILY_CHECKIN]: {
      title: '打卡提醒',
      content: `${data.userName || '同学'}，今天还没有打卡哦~`,
      tips: [
        '坚持就是胜利！',
        '每天进步一点点',
        '别忘了今天的目标哦',
        '自律给你自由！'
      ]
    },
    [REMINDER_TYPES.STREAK_BREAK]: {
      title: '连续打卡即将中断',
      content: `您已连续打卡 ${data.streakDays || 0} 天，快来继续保持吧！`,
      tips: [
        '不要放弃，坚持下去！',
        '你的努力不会白费',
        '再坚持一下就好'
      ]
    },
    [REMINDER_TYPES.WEEKLY_REPORT]: {
      title: '本周数据报告',
      content: `本周完成 ${data.weeklyCount || 0} 次打卡，完成率 ${data.weeklyRate || 0}%`,
      tips: [
        '保持良好习惯！',
        '继续加油！'
      ]
    }
  };

  const template = templates[type] || templates[REMINDER_TYPES.DAILY_CHECKIN];
  const tip = template.tips[Math.floor(Math.random() * template.tips.length)];

  return {
    title: template.title,
    content: template.content,
    tip
  };
}

module.exports = {
  TEMPLATE_IDS,
  REMINDER_TYPES,
  DEFAULT_REMINDER_TIME,
  requestSubscribe,
  checkReminderPermission,
  analyzeReminderTime,
  getRecommendedPeriod,
  saveReminderSettings,
  getReminderSettings,
  formatReminderTime,
  getNextReminderTime,
  shouldRemind,
  generateReminderContent
};
