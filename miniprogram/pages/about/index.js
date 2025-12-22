// pages/about/index.js
// 关于我们页面

const { copyToClipboard } = require('../../utils/common');

// 功能列表
const FEATURES = [
  { id: 1, icon: '📝', name: '多维度计划', description: '支持运动、饮食、睡眠、阅读、学习五大维度' },
  { id: 2, icon: '✅', name: '灵活打卡', description: '多种打卡类型，适应不同需求' },
  { id: 3, icon: '📊', name: '数据分析', description: '可视化数据统计，了解自己的进步' },
  { id: 4, icon: '🏆', name: '成就系统', description: '解锁成就徽章，见证成长历程' },
  { id: 5, icon: '🔔', name: '智能提醒', description: '定时提醒打卡，不错过每一天' },
  { id: 6, icon: '☁️', name: '云端同步', description: '数据云端保存，换设备也能继续' }
];

Page({
  data: {
    version: '1.0.0',
    features: FEATURES
  },

  /**
   * 复制微信号
   */
  copyWechat () {
    copyToClipboard('discipline_coach');
  },

  /**
   * 复制邮箱
   */
  copyEmail () {
    copyToClipboard('service@discipline.com');
  },

  /**
   * 查看协议
   */
  viewAgreement (e) {
    const { type } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/about/agreement?type=${type}`
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
