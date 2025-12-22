const reminder = require('../../utils/reminder');
const { showToast, showModal } = require('../../utils/common');
const vibrate = require('../../utils/vibrate');

Component({
  properties: {
    visible: { type: Boolean, value: false },
    userRecords: { type: Array, value: [] }
  },
  data: {
    settings: null,
    recommendedTime: '',
    recommendedPeriod: '',
    nextReminderTime: '',
    timeOptions: [
      { value: '09:00', label: '早晨 9:00' },
      { value: '12:00', label: '中午 12:00' },
      { value: '15:00', label: '下午 3:00' },
      { value: '18:00', label: '傍晚 6:00' },
      { value: '21:00', label: '晚上 9:00' }
    ]
  },
  lifetimes: {
    attached () {
      this.loadSettings();
    }
  },
  observers: {
    'userRecords': function (records) {
      if (records && records.length > 0) {
        this.analyzeAndRecommend(records);
      }
    }
  },
  methods: {
    loadSettings () {
      const settings = reminder.getReminderSettings();
      const nextTime = settings.time ? reminder.formatReminderTime(settings.time) : '未设置';

      this.setData({
        settings,
        nextReminderTime: nextTime
      });
    },

    analyzeAndRecommend (records) {
      const recommendedTime = reminder.analyzeReminderTime(records);
      const recommendedPeriod = reminder.getRecommendedPeriod(records);

      this.setData({
        recommendedTime,
        recommendedPeriod
      });
    },

    async handleEnableChange (e) {
      const enabled = e.detail.value;
      vibrate.light();

      if (enabled) {
        // 开启提醒，请求订阅权限
        try {
          const result = await reminder.requestSubscribe(['CHECKIN_REMINDER']);

          if (Object.keys(result.authorized).length > 0) {
            this.updateSettings({ enabled: true });
            vibrate.success();
            showToast('提醒已开启', 'success');
          } else {
            this.setData({ 'settings.enabled': false });
            showModal({
              title: '需要授权',
              content: '请允许接收订阅消息才能使用提醒功能',
              showCancel: false
            });
          }
        } catch (error) {
          console.error('请求订阅失败:', error);
          this.setData({ 'settings.enabled': false });
          showToast('请求授权失败');
        }
      } else {
        // 关闭提醒
        this.updateSettings({ enabled: false });
        vibrate.light();
        showToast('提醒已关闭');
      }
    },

    handleTimeChange (e) {
      const time = e.detail.value;
      vibrate.light();

      this.updateSettings({ time });
      const formatted = reminder.formatReminderTime(time);
      this.setData({ nextReminderTime: formatted });
      showToast('提醒时间已更新', 'success');
    },

    handleTypeChange (e) {
      const { type } = e.currentTarget.dataset;
      const value = e.detail.value;
      vibrate.light();

      const types = { ...this.data.settings.types, [type]: value };
      this.updateSettings({ types });
    },

    applyRecommendedTime () {
      vibrate.medium();

      if (!this.data.recommendedTime) {
        showToast('暂无推荐时间');
        return;
      }

      this.updateSettings({
        time: this.data.recommendedTime,
        period: this.data.recommendedPeriod
      });

      const formatted = reminder.formatReminderTime(this.data.recommendedTime);
      this.setData({ nextReminderTime: formatted });
      showToast('已应用智能推荐', 'success');
    },

    updateSettings (updates) {
      const settings = { ...this.data.settings, ...updates };
      reminder.saveReminderSettings(settings);
      this.setData({ settings });
      this.triggerEvent('change', { settings });
    },

    handleClose () {
      vibrate.light();
      this.triggerEvent('close');
    },

    openSystemSettings () {
      vibrate.light();
      wx.openSetting({
        success: () => {
          showToast('请在设置中允许通知');
        }
      });
    }
  }
});
