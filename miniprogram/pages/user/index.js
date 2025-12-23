// pages/user/index.js
// 用户中心页 - 个人信息和设置

const app = getApp();
const { userAPI, statisticsAPI, exportAPI, recordAPI } = require('../../utils/api');
const { showToast, showLoading, hideLoading, copyToClipboard } = require('../../utils/common');
const { getStorage, setStorage, CacheManager } = require('../../utils/storage');
const reminder = require('../../utils/reminder');
const vibrate = require('../../utils/vibrate');
const theme = require('../../utils/theme');

Page({
  data: {
    userInfo: {},
    totalDays: 0,
    streakDays: 0,
    memberStatus: {
      isVip: false,
      expireDate: ''
    },
    achievementCount: 0,
    reminderEnabled: true,
    weeklySummaryEnabled: false,
    streakWarningEnabled: false,
    reminderTime: '21:00',
    version: '1.0.0',
    showContactModal: false,
    showThemeModal: false,
    themePreference: 'auto',
    themeText: '跟随系统'
  },

  onLoad () {
    this.loadUserData();
    this.loadThemeSettings();
  },

  onShow () {
    // 从其他页面返回时刷新数据
    this.loadUserData();
    this.checkMemberStatus();
  },

  /**
   * 加载用户数据
   */
  async loadUserData () {
    try {
      // 获取缓存的用户信息
      const cachedUserInfo = app.globalData.userInfo || getStorage('userInfo');

      if (cachedUserInfo) {
        this.setData({ userInfo: cachedUserInfo });
      }

      // 并行加载统计数据
      const [overview, badges] = await Promise.all([
        statisticsAPI.getOverview(),
        statisticsAPI.getBadges()
      ]);

      this.setData({
        totalDays: overview.totalDays || 0,
        streakDays: overview.currentStreak || 0,
        achievementCount: badges.filter(b => b.unlocked).length || 0
      });

      // 加载提醒设置（本地 + 云端）
      const localSettings = reminder.getReminderSettings();
      let reminderEnabled = !!localSettings.enabled;
      let reminderTime = localSettings.time || '21:00';
      let weeklySummaryEnabled = false;
      let streakWarningEnabled = false;

      try {
        const cloudRes = await wx.cloud.callFunction({ name: 'user', data: { action: 'getUserInfo' } });
        if (cloudRes?.result?.success) {
          const settings = cloudRes.result.data.settings || {};
          if (typeof settings.dailyReminder === 'boolean') reminderEnabled = settings.dailyReminder;
          if (typeof settings.reminderTime === 'string') reminderTime = settings.reminderTime;
          if (typeof settings.weeklySummary === 'boolean') weeklySummaryEnabled = settings.weeklySummary;
          if (typeof settings.streakWarning === 'boolean') streakWarningEnabled = settings.streakWarning;
        }
      } catch (e) {
        console.warn('加载云端提醒设置失败', e);
      }

      this.setData({ reminderEnabled, reminderTime, weeklySummaryEnabled, streakWarningEnabled });

    } catch (error) {
      console.error('加载用户数据失败:', error);
    }
  },

  /**
   * 切换周总结订阅
   */
  async handleWeeklySummaryToggle (e) {
    const { value } = e.detail;
    vibrate.light();

    try {
      if (value) {
        const result = await reminder.requestSubscribe(['WEEKLY_SUMMARY']);
        if (result.success && result.authorized?.WEEKLY_SUMMARY) {
          await wx.cloud.callFunction({ name: 'user', data: { action: 'updateSettings', weeklySummary: true } });
          this.setData({ weeklySummaryEnabled: true });
          showToast('周总结订阅已开启', 'success');
        } else {
          this.setData({ weeklySummaryEnabled: false });
          showToast('未授权订阅', 'none');
        }
      } else {
        await wx.cloud.callFunction({ name: 'user', data: { action: 'updateSettings', weeklySummary: false } });
        this.setData({ weeklySummaryEnabled: false });
        showToast('周总结订阅已关闭');
      }
    } catch (err) {
      console.error('更新周总结订阅失败:', err);
      this.setData({ weeklySummaryEnabled: !value });
    }
  },

  /**
   * 测试发送周总结
   */
  async handleSendWeeklySummaryTest () {
    vibrate.light();
    try {
      const res = await wx.cloud.callFunction({ name: 'message', data: { action: 'sendWeeklySummary' } });
      if (res?.result?.success) {
        showToast('已发送周总结', 'success');
      } else {
        showToast(res?.result?.errMsg || '发送失败');
      }
    } catch (e) {
      console.warn('云函数调用失败', e);
      showToast('云函数调用失败');
    }
  },

  /**
   * 切换连续打卡警告订阅
   */
  async handleStreakWarningToggle (e) {
    const { value } = e.detail;
    vibrate.light();

    try {
      if (value) {
        const result = await reminder.requestSubscribe(['STREAK_WARNING']);
        if (result.success && result.authorized?.STREAK_WARNING) {
          await wx.cloud.callFunction({ name: 'user', data: { action: 'updateSettings', streakWarning: true } });
          this.setData({ streakWarningEnabled: true });
          showToast('连续打卡警告已开启', 'success');
        } else {
          this.setData({ streakWarningEnabled: false });
          showToast('未授权订阅', 'none');
        }
      } else {
        await wx.cloud.callFunction({ name: 'user', data: { action: 'updateSettings', streakWarning: false } });
        this.setData({ streakWarningEnabled: false });
        showToast('连续打卡警告已关闭');
      }
    } catch (err) {
      console.error('更新连续打卡警告订阅失败:', err);
      this.setData({ streakWarningEnabled: !value });
    }
  },

  /**
   * 检查会员状态
   */
  async checkMemberStatus () {
    try {
      const memberStatus = await app.checkMemberStatus();
      this.setData({ memberStatus });
    } catch (error) {
      console.error('检查会员状态失败:', error);
    }
  },

  /**
   * 页面跳转
   */
  navigateTo (e) {
    const { url } = e.currentTarget.dataset;
    wx.navigateTo({ url });
  },

  /**
   * 跳转到会员中心
   */
  navigateToVip () {
    wx.navigateTo({
      url: '/pages/vip/index'
    });
  },

  /**
   * 处理提醒设置
   */
  handleReminder () {
    // 点击整行时不做处理，由开关本身控制
  },

  /**
   * 切换提醒开关
   */
  async handleReminderToggle (e) {
    const { value } = e.detail;
    vibrate.light();

    try {
      if (value) {
        // 推荐提醒时间（近30天）
        let suggestTime = '21:00';
        try {
          const { getToday, getDateByOffset } = require('../../utils/date');
          const since = getDateByOffset(getToday(), -30);
          const rangeRes = await recordAPI.getByRange(since, getToday());
          suggestTime = reminder.analyzeReminderTime(rangeRes || []);
        } catch (_) { }

        // 请求订阅打卡提醒
        const result = await reminder.requestSubscribe(['CHECKIN_REMINDER']);
        if (result.success && result.authorized?.CHECKIN_REMINDER) {
          // 云端保存
          await wx.cloud.callFunction({
            name: 'user',
            data: { action: 'updateSettings', dailyReminder: true, reminderTime: suggestTime }
          });

          // 本地保存
          setStorage('reminderEnabled', true);
          reminder.saveReminderSettings({ enabled: true, time: suggestTime });

          this.setData({ reminderEnabled: true, reminderTime: suggestTime });
          showToast('提醒已开启', 'success');
        } else {
          this.setData({ reminderEnabled: false });
          showToast('未授权订阅', 'none');
        }
      } else {
        // 关闭提醒
        await wx.cloud.callFunction({ name: 'user', data: { action: 'updateSettings', dailyReminder: false } });
        setStorage('reminderEnabled', false);
        reminder.saveReminderSettings({ enabled: false });
        this.setData({ reminderEnabled: false });
        showToast('提醒已关闭');
      }
    } catch (error) {
      console.error('更新提醒设置失败:', error);
      // 恢复原状态
      this.setData({ reminderEnabled: !value });
    }
  },

  /**
   * 修改提醒时间
   */
  async handleReminderTimeChange (e) {
    const time = e.detail.value; // HH:mm
    vibrate.light();

    try {
      // 云端保存
      await wx.cloud.callFunction({ name: 'user', data: { action: 'updateSettings', reminderTime: time } });

      // 本地保存
      const current = reminder.getReminderSettings();
      reminder.saveReminderSettings({ ...current, time });

      this.setData({ reminderTime: time });
      showToast('提醒时间已更新', 'success');
    } catch (err) {
      console.error('更新提醒时间失败:', err);
      showToast('更新失败，请重试');
    }
  },

  /**
   * 测试发送提醒
   */
  async handleSendReminderTest () {
    vibrate.light();
    try {
      const res = await wx.cloud.callFunction({ name: 'message', data: { action: 'sendDailyReminder' } });
      if (res?.result?.success) {
        showToast('已发送提醒', 'success');
      } else {
        showToast(res?.result?.errMsg || '发送失败');
      }
    } catch (e) {
      console.warn('云函数调用失败', e);
      showToast('云函数调用失败');
    }
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation () {
    // 阻止开关点击冒泡到menu-item
  },

  /**
   * 显示联系方式
   */
  handleContactUs () {
    this.setData({ showContactModal: true });
  },

  /**
   * 关闭联系方式弹窗
   */
  closeContactModal () {
    this.setData({ showContactModal: false });
  },

  /**
   * 复制微信号
   */
  handleCopyWechat () {
    copyToClipboard('discipline_coach');
  },

  /**
   * 复制邮箱
   */
  handleCopyEmail () {
    copyToClipboard('service@discipline.com');
  },

  /**
   * 清理缓存
   */
  handleClearCache () {
    vibrate.light();

    wx.showModal({
      title: '清理缓存',
      content: '确定要清除所有缓存数据吗？这不会影响您的打卡记录。',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          try {
            const info = CacheManager.getInfo();
            CacheManager.clearAll();

            // 同时清除 app.js 中的缓存
            const app = getApp();
            app.clearCache();

            showToast(`已清理 ${info.count} 项缓存`, 'success');
            vibrate.success();
          } catch (err) {
            console.error('清理缓存失败:', err);
            showToast('清理失败');
          }
        }
      }
    });
  },

  /**
   * 数据导出
   */
  handleExport () {
    const { memberStatus } = this.data;

    // 检查会员权限
    if (!memberStatus.isVip) {
      wx.showModal({
        title: '会员功能',
        content: '数据导出为会员专享功能，开通会员后即可使用',
        confirmText: '去开通',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/vip/index'
            });
          }
        }
      });
      return;
    }

    // 显示导出选项
    wx.showActionSheet({
      itemList: ['导出Excel数据', '生成周报告', '生成月报告'],
      success: (res) => {
        const tapIndex = res.tapIndex;
        if (tapIndex === 0) {
          this.exportExcel();
        } else if (tapIndex === 1) {
          this.exportReport('weekly');
        } else if (tapIndex === 2) {
          this.exportReport('monthly');
        }
      }
    });
  },

  /**
   * 导出 Excel
   */
  async exportExcel () {
    try {
      // 选择日期范围
      const dates = await this.selectDateRange();
      if (!dates) return;

      showLoading('正在导出...');

      const result = await exportAPI.exportToExcel(
        dates.startDate,
        dates.endDate,
        []
      );

      hideLoading();

      if (result && result.excelData) {
        // 将数据转换为Excel格式并下载
        this.downloadExcelData(result.excelData, `打卡记录_${dates.startDate}_${dates.endDate}.xlsx`);

        showToast('导出成功');
      } else {
        showToast('导出失败，请重试');
      }

    } catch (error) {
      hideLoading();
      console.error('导出Excel失败:', error);
      showToast(error.message || '导出失败');
    }
  },

  /**
   * 导出报告
   */
  async exportReport (reportType) {
    try {
      // 计算日期范围
      const dates = this.calculateReportDateRange(reportType);

      showLoading('正在生成报告...');

      const result = await exportAPI.exportToPDF(
        dates.startDate,
        dates.endDate,
        reportType
      );

      hideLoading();

      if (result && result.reportData) {
        // 跳转到报告预览页
        wx.navigateTo({
          url: `/pages/report/preview?data=${encodeURIComponent(JSON.stringify(result.reportData))}`
        });
      } else {
        showToast('生成失败，请重试');
      }

    } catch (error) {
      hideLoading();
      console.error('生成报告失败:', error);
      showToast(error.message || '生成失败');
    }
  },

  /**
   * 选择日期范围
   */
  selectDateRange () {
    return new Promise((resolve) => {
      wx.showActionSheet({
        itemList: ['最近7天', '最近30天', '最近90天', '自定义'],
        success: (res) => {
          const today = new Date();
          let startDate, endDate = this.formatDate(today);

          if (res.tapIndex === 0) {
            // 最近7天
            startDate = this.formatDate(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000));
          } else if (res.tapIndex === 1) {
            // 最近30天
            startDate = this.formatDate(new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000));
          } else if (res.tapIndex === 2) {
            // 最近90天
            startDate = this.formatDate(new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000));
          } else {
            // 自定义（简化处理，默认最近30天）
            showToast('暂不支持自定义范围');
            startDate = this.formatDate(new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000));
          }

          resolve({ startDate, endDate });
        },
        fail: () => resolve(null)
      });
    });
  },

  /**
   * 计算报告日期范围
   */
  calculateReportDateRange (reportType) {
    const today = new Date();
    const endDate = this.formatDate(today);
    let startDate;

    if (reportType === 'weekly') {
      // 最近7天
      startDate = this.formatDate(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000));
    } else {
      // 最近30天
      startDate = this.formatDate(new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000));
    }

    return { startDate, endDate };
  },

  /**
   * 格式化日期
   */
  formatDate (date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 下载Excel数据（生成CSV格式）
   */
  downloadExcelData (data, filename) {
    if (!data || data.length === 0) {
      showToast('暂无数据');
      return;
    }

    // 转换为CSV格式
    const headers = Object.keys(data[0]);
    let csvContent = headers.join(',') + '\n';

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        // 处理包含逗号的字段
        return value.toString().includes(',') ? `"${value}"` : value;
      });
      csvContent += values.join(',') + '\n';
    });

    // 使用文件系统管理器保存文件
    const fs = wx.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/${filename}`;

    fs.writeFile({
      filePath,
      data: csvContent,
      encoding: 'utf8',
      success: () => {
        // 打开文档查看器
        wx.openDocument({
          filePath,
          fileType: 'xlsx',
          showMenu: true,
          success: () => {
            console.log('文件打开成功');
          },
          fail: (err) => {
            console.error('打开文件失败:', err);
            // 提供分享选项
            wx.showModal({
              title: '提示',
              content: '文件已保存，是否分享？',
              confirmText: '分享',
              success: (res) => {
                if (res.confirm) {
                  wx.shareFileMessage({
                    filePath,
                    success: () => showToast('分享成功'),
                    fail: () => showToast('分享失败')
                  });
                }
              }
            });
          }
        });
      },
      fail: (err) => {
        console.error('保存文件失败:', err);
        showToast('保存失败');
      }
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh () {
    Promise.all([
      this.loadUserData(),
      this.checkMemberStatus()
    ]).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 加载主题设置
   */
  loadThemeSettings () {
    const preference = theme.getUserPreference();
    const themeTextMap = {
      auto: '跟随系统',
      light: '亮色模式',
      dark: '深色模式'
    };

    this.setData({
      themePreference: preference,
      themeText: themeTextMap[preference] || '跟随系统'
    });
  },

  /**
   * 打开主题选择弹窗
   */
  handleThemeChange () {
    vibrate.light();
    this.setData({ showThemeModal: true });
  },

  /**
   * 关闭主题选择弹窗
   */
  closeThemeModal () {
    this.setData({ showThemeModal: false });
  },

  /**
   * 选择主题
   */
  selectTheme (e) {
    const { theme: selectedTheme } = e.currentTarget.dataset;
    vibrate.light();

    // 设置主题
    theme.setTheme(selectedTheme);

    // 更新显示
    this.loadThemeSettings();

    // 关闭弹窗
    this.closeThemeModal();

    // 显示提示
    const themeTextMap = {
      auto: '跟随系统',
      light: '亮色模式',
      dark: '深色模式'
    };
    showToast(`已切换到${themeTextMap[selectedTheme]}`);

    // 通知其他页面刷新（如果需要）
    // 使用 getCurrentPages() 可以获取页面栈并通知刷新
  },

  /**
   * 分享
   */
  onShareAppMessage () {
    return {
      title: '自律教练 - 让自律成为习惯',
      path: '/pages/index/index'
    };
  }
});
