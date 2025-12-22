// pages/user/achievements/index.js
// 成就墙展示页面

const { statisticsAPI } = require('../../../utils/api');
const vibrate = require('../../../utils/vibrate');

Page({
  data: {
    // 成就列表
    achievements: [],
    // 统计数据
    stats: {
      total: 0,          // 总成就数
      unlocked: 0,       // 已解锁数
      progress: 0        // 完成进度
    },
    // 当前选中的成就
    selectedAchievement: null,
    // 显示海报
    showPoster: false,
    // 用户信息
    userInfo: {},
    // 加载状态
    loading: true
  },

  onLoad () {
    this.loadAchievements();
    this.loadUserInfo();
  },

  onShow () {
    // 从其他页面返回时刷新
    this.loadAchievements();
  },

  /**
   * 加载成就数据
   */
  async loadAchievements () {
    try {
      this.setData({ loading: true });

      const achievements = await statisticsAPI.getBadges();

      // 计算统计数据
      const total = achievements.length;
      const unlocked = achievements.filter(a => a.unlocked).length;
      const progress = total > 0 ? Math.round((unlocked / total) * 100) : 0;

      this.setData({
        achievements,
        stats: { total, unlocked, progress },
        loading: false
      });

    } catch (error) {
      console.error('加载成就失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  /**
   * 加载用户信息
   */
  loadUserInfo () {
    const app = getApp();
    const userInfo = app.globalData.userInfo || {};
    this.setData({ userInfo });
  },

  /**
   * 点击成就卡片
   */
  handleAchievementTap (e) {
    const { achievement } = e.currentTarget.dataset;

    if (!achievement.unlocked) {
      // 未解锁的成就显示提示
      vibrate.light();
      wx.showModal({
        title: achievement.name,
        content: `解锁条件：${achievement.condition || achievement.description}`,
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }

    // 已解锁的成就显示详情
    vibrate.light();
    this.setData({ selectedAchievement: achievement });
  },

  /**
   * 分享成就
   */
  handleShare () {
    const { selectedAchievement } = this.data;

    if (!selectedAchievement) return;

    vibrate.light();

    // 显示分享海报
    this.setData({
      showPoster: true,
      selectedAchievement: null
    });
  },

  /**
   * 关闭成就详情
   */
  handleCloseDetail () {
    this.setData({ selectedAchievement: null });
  },

  /**
   * 关闭海报
   */
  handleClosePoster () {
    this.setData({ showPoster: false });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh () {
    this.loadAchievements().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 分享
   */
  onShareAppMessage () {
    const { stats } = this.data;
    return {
      title: `我已解锁${stats.unlocked}个成就，快来挑战吧！`,
      path: '/pages/index/index'
    };
  }
});
