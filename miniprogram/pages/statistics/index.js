// pages/statistics/index.js
// 数据统计页 - 展示用户的完成数据和趋势分析

const { statisticsAPI } = require('../../utils/api');
const { showToast, showLoading, hideLoading } = require('../../utils/common');
const { formatDate, getRecentDays } = require('../../utils/date');
const vibrate = require('../../utils/vibrate');

// 维度配置
const DIMENSIONS = {
  'exercise': { name: '运动健身', icon: '🏃', color: '#FF6B6B' },
  'diet': { name: '健康饮食', icon: '🥗', color: '#4ECDC4' },
  'sleep': { name: '规律作息', icon: '😴', color: '#9B59B6' },
  'reading': { name: '阅读学习', icon: '📚', color: '#F39C12' },
  'study': { name: '技能提升', icon: '💻', color: '#3498DB' }
};

// 成就徽章配置
const BADGE_CONFIG = [
  { id: 1, name: '初心', icon: '🌱', requirement: '完成第1次打卡', description: '万事开头难，你已经迈出了第一步！' },
  { id: 2, name: '坚持', icon: '💪', requirement: '连续打卡7天', description: '七天养成一个习惯，你做到了！' },
  { id: 3, name: '恒心', icon: '🔥', requirement: '连续打卡30天', description: '一个月的坚持，你的毅力令人钦佩！' },
  { id: 4, name: '百日', icon: '🏆', requirement: '连续打卡100天', description: '百日筑基，你已经成为自律达人！' },
  { id: 5, name: '全面', icon: '🌟', requirement: '开启全部5个维度', description: '全方位提升自己，你真棒！' },
  { id: 6, name: '完美', icon: '💎', requirement: '单日完成率100%', description: '完美的一天，你做到了！' }
];

Page({
  data: {
    timeRange: 'week', // week | month | year

    // 核心数据
    totalDays: 0,
    completionRate: 0,
    currentStreak: 0,
    bestStreak: 0,

    // 趋势数据
    trendData: [],

    // 维度数据
    dimensionData: [],
    dimensionStats: [],

    // 成就徽章
    badges: [],
    unlockedBadges: 0,
    totalBadges: BADGE_CONFIG.length,
    showBadgeDetail: false,
    selectedBadge: {},

    // 分享海报
    showSharePoster: false,
    shareData: null
  },

  onLoad () {
    this.loadStatistics();
  },

  onShow () {
    // 从其他页面返回时刷新数据
    this.loadStatistics();
  },

  /**
   * 加载统计数据
   */
  async loadStatistics () {
    try {
      showLoading('加载中');

      const { timeRange } = this.data;
      const dateRange = this.getDateRange(timeRange);

      console.log('[统计页] 加载数据，日期范围:', dateRange);

      // 并行加载各类数据
      const [overviewData, trendData, dimensionData, badgeData] = await Promise.all([
        statisticsAPI.getOverview(dateRange).catch(e => {
          console.error('加载概览数据失败:', e);
          return { totalDays: 0, completionRate: 0, currentStreak: 0, bestStreak: 0 };
        }),
        statisticsAPI.getTrend(dateRange).catch(e => {
          console.error('加载趋势数据失败:', e);
          return [];
        }),
        statisticsAPI.getDimensionStats(dateRange).catch(e => {
          console.error('加载维度数据失败:', e);
          return [];
        }),
        statisticsAPI.getBadges().catch(e => {
          console.error('加载徽章数据失败:', e);
          return [];
        })
      ]);

      console.log('[统计页] 概览数据:', overviewData);
      console.log('[统计页] 趋势数据:', trendData);
      console.log('[统计页] 维度数据:', dimensionData);

      // 格式化图表数据
      const trendChartData = this.formatTrendChartData(trendData || []);
      const dimensionChartData = this.formatDimensionChartData(dimensionData || []);

      this.setData({
        totalDays: overviewData.totalDays || 0,
        completionRate: overviewData.completionRate || 0,
        currentStreak: overviewData.currentStreak || 0,
        bestStreak: overviewData.bestStreak || overviewData.maxStreak || 0,
        trendData: trendData || [],
        trendChartData: trendChartData,
        dimensionData: dimensionData || [],
        dimensionChartData: dimensionChartData
      });

      this.processDimensionStats(dimensionData);
      this.processBadges(badgeData);

    } catch (error) {
      console.error('加载统计数据失败:', error);
      showToast('加载失败，请重试');
    } finally {
      hideLoading();
    }
  },

  /**
   * 获取日期范围
   */
  getDateRange (range) {
    // 检查会员限制
    const app = getApp();
    const memberStatus = app.checkMemberStatus();
    const isMember = memberStatus.isVip;

    const today = new Date();
    let startDate, endDate = formatDate(today);

    switch (range) {
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = formatDate(weekAgo);
        break;
      case 'month':
        // 非会员最多查看7天
        if (!isMember) {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate = formatDate(weekAgo);
        } else {
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          startDate = formatDate(monthAgo);
        }
        break;
      case 'year':
        // 非会员最多查看7天
        if (!isMember) {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate = formatDate(weekAgo);
        } else {
          const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
          startDate = formatDate(yearAgo);
        }
        break;
    }

    return { startDate, endDate };
  },



  /**
   * 处理维度统计数据
   */
  processDimensionStats (dimensionData) {
    // 适配云函数返回的字段名
    const stats = dimensionData.map(d => {
      const config = DIMENSIONS[d.category];
      const completed = d.completed || d.completedTasks || 0;
      const total = d.total || d.totalTasks || 0;

      return {
        category: d.category,
        name: config?.name || d.name || d.category,
        icon: config?.icon || '📝',
        color: config?.color || '#999999',
        completedTasks: completed,
        totalTasks: total,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        streak: d.streak || 0,
        totalDays: d.totalDays || 0
      };
    });

    this.setData({ dimensionStats: stats });
  },

  /**
   * 处理徽章数据
   */
  processBadges (badgeData) {
    const badges = BADGE_CONFIG.map(badge => {
      const unlocked = badgeData.find(b => b.badgeId === badge.id);
      return {
        ...badge,
        unlocked: !!unlocked,
        unlockedDate: unlocked ? formatDate(new Date(unlocked.unlockedAt)) : ''
      };
    });

    const unlockedCount = badges.filter(b => b.unlocked).length;

    this.setData({
      badges,
      unlockedBadges: unlockedCount
    });
  },

  /**
   * 格式化趋势图数据
   */
  formatTrendChartData (trendData) {
    if (!trendData || trendData.length === 0) return [];

    return trendData.map(item => ({
      label: this.formatDateLabel(item.date),
      value: Math.round(item.rate || 0)
    }));
  },

  /**
   * 格式化维度对比图数据
   */
  formatDimensionChartData (dimensionData) {
    if (!dimensionData || dimensionData.length === 0) return [];

    return dimensionData.map(item => {
      const config = DIMENSIONS[item.category];
      const completed = item.completed || item.completedTasks || 0;
      const total = item.total || item.totalTasks || 0;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        label: config?.name || item.category,
        value: rate
      };
    });
  },

  /**
   * 格式化日期标签
   */
  formatDateLabel (dateStr) {
    if (!dateStr) return '';

    // 格式: 2024-01-15 -> 01/15
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}`;
    }
    return dateStr;
  },

  /**
   * 切换时间范围
   */
  handleTimeRangeChange (e) {
    const { range } = e.currentTarget.dataset;
    vibrate.light();

    // 检查会员限制
    if (range !== 'week') {
      const app = getApp();
      const memberStatus = app.checkMemberStatus();

      if (!memberStatus.isVip) {
        wx.showModal({
          title: '会员专属',
          content: '普通用户仅支持查看7天数据，升级会员可查看90天完整统计',
          confirmText: '升级会员',
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({ url: '/pages/vip/index' });
            }
          }
        });
        return;
      }
    }

    this.setData({ timeRange: range });
    this.loadStatistics();
  },

  /**
   * 查看徽章详情
   */
  handleBadgeTap (e) {
    const { badge } = e.currentTarget.dataset;
    this.setData({
      showBadgeDetail: true,
      selectedBadge: badge
    });
  },

  /**
   * 关闭徽章详情
   */
  closeBadgeDetail () {
    this.setData({ showBadgeDetail: false });
  },

  /**
   * 跳转到历史记录页
   */
  navigateToHistory () {
    wx.navigateTo({
      url: '/pages/record/history'
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh () {
    this.loadStatistics().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 分享战绩
   */
  handleShare () {
    vibrate.light();

    const { currentStreak, completionRate, totalDays } = this.data;
    const app = getApp();
    const userInfo = app.globalData.userInfo || {};

    this.setData({
      showSharePoster: true,
      shareData: {
        userName: userInfo.nickName || '自律达人',
        avatarUrl: userInfo.avatarUrl || '',
        streakDays: currentStreak,
        totalDays,
        completionRate: Math.round(completionRate),
        startDate: `坚持了${totalDays}天`
      }
    });
  },

  /**
   * 关闭分享海报
   */
  closeSharePoster () {
    vibrate.light();
    this.setData({
      showSharePoster: false,
      shareData: null
    });
  },

  /**
   * 分享海报保存回调
   */
  onSharePosterSave (e) {
    console.log('海报已保存:', e.detail);
  },

  /**
   * 分享海报分享回调
   */
  onSharePosterShare (e) {
    console.log('海报已分享:', e.detail);
  }
});
