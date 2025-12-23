// index.js - 重构后的精简版本
const app = getApp()

// 导入所有 behavior 模块
const dataLoader = require('../../behaviors/index-data-loader.js')
const dataProcessor = require('../../behaviors/index-data-processor.js')
const checkinHandler = require('../../behaviors/index-checkin-handler.js')
const uiHandler = require('../../behaviors/index-ui-handler.js')
const taskHandler = require('../../behaviors/index-task-handler.js')
const coachHandler = require('../../behaviors/index-coach-handler.js')
const reminderHandler = require('../../behaviors/index-reminder-handler.js')
const networkHandler = require('../../behaviors/index-network-handler.js')

Page({
  // 混入所有 behavior
  behaviors: [
    dataLoader,
    dataProcessor,
    checkinHandler,
    uiHandler,
    taskHandler,
    coachHandler,
    reminderHandler,
    networkHandler
  ],

  data: {
    // 统计数据
    completedTasks: 0,
    totalTasks: 0,
    progressPercent: 0,

    // 任务维度列表
    dimensions: []
  },

  /**
   * 页面加载
   */
  onLoad () {
    // 记录页面开始加载时间
    const loadStartTime = Date.now();
    this.setData({ 'performanceMetrics.loadStartTime': loadStartTime });

    // 初始化
    this.initDateRange()
    this.initPage()
    this.updateNetworkStatus()

    // 智能预加载
    this.preloadDataIfNeeded();

    // 加载数据
    this.loadData()

    // 安全保护：5秒后强制关闭骨架屏
    this.loadingTimeout = setTimeout(() => {
      if (this.data.isLoading) {
        console.warn('[index] 加载超时，强制关闭骨架屏');
        this.setData({ isLoading: false });
        wx.showToast({
          title: '加载超时，请检查网络或云函数部署',
          icon: 'none',
          duration: 3000
        });
      }
    }, 5000);

    // 加载提醒设置
    this.loadReminderSettings()
  },

  /**
   * 页面卸载
   */
  onUnload () {
    // 清理加载超时定时器
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
  },

  /**
   * 页面显示
   */
  onShow () {
    // 检查是否需要刷新数据
    const now = Date.now();
    const shouldRefresh = now - this.data.lastRefreshTime > this.data.cacheTimeout;

    if (shouldRefresh) {
      console.log('[index] 缓存过期，重新加载数据');
      this.loadData();
    } else {
      console.log('[index] 使用缓存数据');
    }
  },

  /**
   * 下拉刷新
   */
  async onPullDownRefresh () {
    console.log('[index] 下拉刷新');
    await this.loadData();
    wx.stopPullDownRefresh();
  },

  /**
   * 分享
   */
  onShareAppMessage () {
    return {
      title: '自律教练 - 让自律成为习惯',
      path: '/pages/index/index',
      imageUrl: '/assets/images/share-cover.png'
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline () {
    return {
      title: '自律教练 - 让自律成为习惯',
      query: '',
      imageUrl: '/assets/images/share-cover.png'
    };
  }
})
