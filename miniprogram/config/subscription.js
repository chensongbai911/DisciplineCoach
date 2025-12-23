/**
 * 订阅消息模板ID配置
 * 请在微信公众平台申请订阅消息模板后,将模板ID填写到此处
 * 配置指南: /SUBSCRIPTION_MESSAGE_GUIDE.md
 */

// 订阅消息开关 - 如果暂未配置模板ID,可以设为false临时禁用
const ENABLE_SUBSCRIPTION = false;

// 订阅消息模板ID配置
const TEMPLATE_IDS = {
  // 打卡提醒 - 每日定时提醒用户打卡
  CHECKIN_REMINDER: 'YOUR_CHECKIN_REMINDER_TEMPLATE_ID',

  // 连续中断警告 - 用户连续多天未打卡时发送警告
  STREAK_WARNING: 'YOUR_STREAK_WARNING_TEMPLATE_ID',

  // 连续打卡祝贺 - 达成连续打卡里程碑时发送祝贺
  STREAK_CONGRATS: 'YOUR_STREAK_CONGRATS_TEMPLATE_ID',

  // 周总结 - 每周发送打卡数据总结
  WEEKLY_SUMMARY: 'YOUR_WEEKLY_SUMMARY_TEMPLATE_ID',

  // 成就解锁 - 用户解锁成就时发送通知
  ACHIEVEMENT_UNLOCK: 'YOUR_ACHIEVEMENT_UNLOCK_TEMPLATE_ID'
};

/**
 * 检查模板ID是否已配置
 * @param {string} templateKey - 模板键名
 * @returns {boolean} 是否已配置
 */
function isTemplateConfigured (templateKey) {
  const templateId = TEMPLATE_IDS[templateKey];
  return templateId && !templateId.startsWith('YOUR_');
}

/**
 * 获取已配置的模板ID列表
 * @param {Array<string>} templateKeys - 模板键名数组
 * @returns {Array<string>} 已配置的模板ID数组
 */
function getConfiguredTemplateIds (templateKeys) {
  return templateKeys
    .map(key => TEMPLATE_IDS[key])
    .filter(id => id && !id.startsWith('YOUR_'));
}

/**
 * 检查订阅消息功能是否可用
 * @returns {Object} 检查结果
 */
function checkSubscriptionAvailable () {
  if (!ENABLE_SUBSCRIPTION) {
    return {
      available: false,
      reason: 'subscription_disabled',
      message: '订阅消息功能已禁用'
    };
  }

  const configuredCount = Object.keys(TEMPLATE_IDS).filter(key =>
    isTemplateConfigured(key)
  ).length;

  if (configuredCount === 0) {
    return {
      available: false,
      reason: 'no_template_configured',
      message: '未配置订阅消息模板ID'
    };
  }

  return {
    available: true,
    configuredCount,
    totalCount: Object.keys(TEMPLATE_IDS).length
  };
}

module.exports = {
  ENABLE_SUBSCRIPTION,
  TEMPLATE_IDS,
  isTemplateConfigured,
  getConfiguredTemplateIds,
  checkSubscriptionAvailable
};
