// pages/report/preview.js
// 报告预览页面 - 显示周报告/月报告

const app = getApp();
const { showToast, showLoading, hideLoading } = require('../../utils/common');

Page({
  data: {
    reportData: null,
    reportType: '',
    title: '',
    dateRange: '',
    summary: {},
    charts: [],
    achievements: []
  },

  onLoad (options) {
    try {
      if (options.data) {
        const reportData = JSON.parse(decodeURIComponent(options.data));
        this.setData({
          reportData,
          reportType: reportData.type || 'weekly',
          title: reportData.title || '打卡报告',
          dateRange: reportData.dateRange || '',
          summary: reportData.summary || {},
          charts: reportData.charts || [],
          achievements: reportData.achievements || []
        });
      }
    } catch (error) {
      console.error('解析报告数据失败:', error);
      showToast('报告数据错误');
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 保存为图片
   */
  handleSaveImage () {
    showToast('功能开发中');
    // TODO: 实现Canvas绘制并保存
  },

  /**
   * 分享报告
   */
  handleShare () {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  /**
   * 分享给朋友
   */
  onShareAppMessage () {
    return {
      title: `我的${this.data.title} - ${this.data.dateRange}`,
      path: '/pages/index/index',
      imageUrl: '/assets/images/share-report.png'
    };
  }
});
