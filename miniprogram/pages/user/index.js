// pages/user/index.js
// 用户中心页 - 个人信息和设置

const app = getApp();
const { userAPI, statisticsAPI } = require('../../utils/api');
const { showToast, showLoading, hideLoading, copyToClipboard } = require('../../utils/common');
const { getStorage, setStorage } = require('../../utils/storage');

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
    version: '1.0.0',
    showContactModal: false
  },

  onLoad () {
    this.loadUserData();
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

      // 加载提醒设置
      const reminderEnabled = getStorage('reminderEnabled');
      if (reminderEnabled !== null) {
        this.setData({ reminderEnabled });
      }

    } catch (error) {
      console.error('加载用户数据失败:', error);
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

    try {
      if (value) {
        // 请求通知权限
        const setting = await wx.getSetting();

        if (!setting.authSetting['scope.subscribeMessage']) {
          // 请求订阅消息权限
          wx.requestSubscribeMessage({
            tmplIds: ['your_template_id'], // 替换为实际的模板ID
            success: (res) => {
              this.setData({ reminderEnabled: true });
              setStorage('reminderEnabled', true);
              showToast('提醒已开启', 'success');
            },
            fail: () => {
              this.setData({ reminderEnabled: false });
              showToast('请在设置中允许通知权限');
            }
          });
        } else {
          this.setData({ reminderEnabled: true });
          setStorage('reminderEnabled', true);
          showToast('提醒已开启', 'success');
        }
      } else {
        this.setData({ reminderEnabled: false });
        setStorage('reminderEnabled', false);
        showToast('提醒已关闭');
      }

      // 同步到服务器
      await userAPI.updateSettings({
        reminderEnabled: value
      });

    } catch (error) {
      console.error('更新提醒设置失败:', error);
      // 恢复原状态
      this.setData({ reminderEnabled: !value });
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
   * 分享
   */
  onShareAppMessage () {
    return {
      title: '自律教练 - 让自律成为习惯',
      path: '/pages/index/index'
    };
  }
});
