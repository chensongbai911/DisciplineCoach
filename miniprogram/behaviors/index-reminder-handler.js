/**
 * 提醒设置 Behavior
 * 负责订阅消息、提醒管理
 */

const reminder = require('../utils/reminder.js')

module.exports = Behavior({
  data: {
    // 提醒设置
    reminderSettings: {
      enabled: false,
      time: '21:00',
      period: 'night'
    },
    reminderPermission: false
  },

  methods: {
    /**
     * 加载提醒设置
     */
    async loadReminderSettings () {
      try {
        const settings = await reminder.getReminderSettings();  // 修复：getSettings → getReminderSettings
        this.setData({
          reminderSettings: settings || {
            enabled: false,
            time: '21:00',
            period: 'night'
          }
        });

        // 检查订阅消息权限
        wx.getSetting({
          withSubscriptions: true,
          success: (res) => {
            const subscribed = res.subscriptionsSetting?.mainSwitch || false;
            this.setData({
              reminderPermission: subscribed
            });
          }
        });
      } catch (e) {
        console.error('加载提醒设置失败:', e);
      }
    },

    /**
     * 请求订阅消息
     */
    async requestDailyReminderSubscription () {
      try {
        const result = await reminder.requestPermission();

        if (result.success) {
          // 启用提醒
          await reminder.enable();

          // 更新状态
          this.setData({
            reminderPermission: true,
            'reminderSettings.enabled': true
          });

          wx.showToast({
            title: '提醒已开启',
            icon: 'success',
            duration: 2000
          });
        } else {
          wx.showToast({
            title: result.message || '订阅失败',
            icon: 'none',
            duration: 2000
          });
        }
      } catch (e) {
        console.error('请求订阅失败:', e);
        wx.showToast({
          title: '操作失败',
          icon: 'error',
          duration: 2000
        });
      }
    },

    /**
     * 停用提醒
     */
    async disableDailyReminder () {
      try {
        await reminder.disable();

        this.setData({
          'reminderSettings.enabled': false
        });

        wx.showToast({
          title: '提醒已停用',
          icon: 'success',
          duration: 2000
        });
      } catch (e) {
        console.error('停用提醒失败:', e);
      }
    },

    /**
     * 发送测试提醒
     */
    async sendReminderTest () {
      try {
        wx.showLoading({ title: '发送中...' });

        await reminder.sendTestMessage();

        wx.hideLoading();
        wx.showToast({
          title: '测试消息已发送',
          icon: 'success',
          duration: 2000
        });
      } catch (e) {
        wx.hideLoading();
        console.error('发送测试提醒失败:', e);
        wx.showToast({
          title: '发送失败',
          icon: 'error',
          duration: 2000
        });
      }
    }
  }
})
