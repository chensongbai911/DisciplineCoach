/**
 * 震动反馈工具类
 * 提供统一的震动反馈接口
 */

const vibrate = {
  /**
   * 轻微震动 - 用于普通按钮点击
   */
  light () {
    try {
      wx.vibrateShort({ type: 'light' });
    } catch (e) {
      console.warn('[震动] 轻微震动失败:', e);
    }
  },

  /**
   * 中等震动 - 用于重要操作确认
   */
  medium () {
    try {
      wx.vibrateShort({ type: 'medium' });
    } catch (e) {
      console.warn('[震动] 中等震动失败:', e);
    }
  },

  /**
   * 强烈震动 - 用于错误警告
   */
  heavy () {
    try {
      wx.vibrateShort({ type: 'heavy' });
    } catch (e) {
      console.warn('[震动] 强烈震动失败:', e);
    }
  },

  /**
   * 成功反馈 - 双次中等震动
   */
  success () {
    try {
      wx.vibrateShort({ type: 'medium' });
      setTimeout(() => {
        wx.vibrateShort({ type: 'light' });
      }, 100);
    } catch (e) {
      console.warn('[震动] 成功反馈失败:', e);
    }
  },

  /**
   * 警告反馈 - 双次强烈震动
   */
  warning () {
    try {
      wx.vibrateShort({ type: 'heavy' });
      setTimeout(() => {
        wx.vibrateShort({ type: 'heavy' });
      }, 150);
    } catch (e) {
      console.warn('[震动] 警告反馈失败:', e);
    }
  },

  /**
   * 错误反馈 - 三次短促震动
   */
  error () {
    try {
      wx.vibrateShort({ type: 'heavy' });
      setTimeout(() => wx.vibrateShort({ type: 'medium' }), 100);
      setTimeout(() => wx.vibrateShort({ type: 'heavy' }), 200);
    } catch (e) {
      console.warn('[震动] 错误反馈失败:', e);
    }
  },

  /**
   * 长震动 - 用于特殊事件（成就解锁等）
   */
  long () {
    try {
      wx.vibrateLong();
    } catch (e) {
      console.warn('[震动] 长震动失败:', e);
    }
  }
};

module.exports = vibrate;
