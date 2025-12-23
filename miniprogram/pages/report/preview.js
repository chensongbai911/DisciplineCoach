// pages/report/preview.js
// 报告预览页面 - 显示周报告/月报告

const app = getApp();
const { showToast, showLoading, hideLoading } = require('../../utils/common');
const { generateReportPoster, saveImageToAlbum } = require('../../utils/poster');

Page({
  data: {
    reportData: null,
    reportType: '',
    title: '',
    dateRange: '',
    summary: {},
    charts: [],
    achievements: [],
    posterPath: '' // 生成的海报路径
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
  async handleSaveImage () {
    showLoading('生成海报中...');

    try {
      // 生成海报
      const posterPath = await generateReportPoster({
        title: this.data.title,
        dateRange: this.data.dateRange,
        summary: this.data.summary,
        reportType: this.data.reportType
      }, this);

      this.setData({ posterPath });
      hideLoading();

      // 保存到相册
      showLoading('保存中...');
      await saveImageToAlbum(posterPath);
      hideLoading();

      wx.showModal({
        title: '保存成功',
        content: '海报已保存到相册,快去分享吧!',
        showCancel: false
      });

    } catch (error) {
      hideLoading();
      console.error('保存图片失败:', error);

      if (error.errMsg && error.errMsg.includes('auth deny')) {
        wx.showModal({
          title: '需要相册权限',
          content: '请在设置中开启相册权限',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting();
            }
          }
        });
      } else {
        showToast(error.message || '保存失败,请重试');
      }
    }
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
