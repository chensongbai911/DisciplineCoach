// pages/plan/index.js
// 计划总览页 - 管理五大维度的计划配置

const { planAPI } = require('../../utils/api');
const { showToast, showLoading, hideLoading, showModal } = require('../../utils/common');
const vibrate = require('../../utils/vibrate');

Page({
  data: {
    // 五大维度配置
    dimensions: [
      {
        id: 1,
        category: 'exercise',
        categoryName: '运动',
        name: '运动健身',
        description: '保持身体健康，提升活力',
        icon: '🏃',
        color: '#FF6B6B',
        enabled: false,
        tasks: []
      },
      {
        id: 2,
        category: 'diet',
        categoryName: '饮食',
        name: '健康饮食',
        description: '合理膳食，营养均衡',
        icon: '🥗',
        color: '#4ECDC4',
        enabled: false,
        tasks: []
      },
      {
        id: 3,
        category: 'sleep',
        categoryName: '睡眠',
        name: '规律作息',
        description: '早睡早起，精力充沛',
        icon: '😴',
        color: '#9B59B6',
        enabled: false,
        tasks: []
      },
      {
        id: 4,
        category: 'reading',
        categoryName: '阅读',
        name: '阅读学习',
        description: '拓宽视野，丰富内心',
        icon: '📚',
        color: '#F39C12',
        enabled: false,
        tasks: []
      },
      {
        id: 5,
        category: 'study',
        categoryName: '学习',
        name: '技能提升',
        description: '持续学习，不断进步',
        icon: '💻',
        color: '#3498DB',
        enabled: false,
        tasks: []
      }
    ],
    enabledCount: 0,
    totalTasks: 0,
    showGuide: true
  },

  onLoad (options) {
    this.loadPlans();
    this.loadDimensionSettings();
    this.checkGuideStatus();
  },

  onShow () {
    // 从详情页返回时刷新数据
    this.loadPlans();
    this.loadDimensionSettings();
  },

  /**
   * 加载维度开启状态
   */
  loadDimensionSettings () {
    const settings = wx.getStorageSync('dimensionSettings') || {};
    const dimensions = this.data.dimensions.map(dim => ({
      ...dim,
      enabled: settings[dim.category] !== false // 默认可以开启
    }));
    this.setData({ dimensions });
  },

  /**
   * 保存维度开启状态
   */
  saveDimensionSettings () {
    const settings = {};
    this.data.dimensions.forEach(dim => {
      settings[dim.category] = dim.enabled;
    });
    wx.setStorageSync('dimensionSettings', settings);
  },

  /**
   * 加载计划数据
   */
  async loadPlans () {
    try {
      showLoading('加载中');
      const plans = await planAPI.list({ status: 'active' });
      this.processPlans(plans);
    } catch (error) {
      console.error('加载计划失败:', error);
      showToast('加载失败，请重试');
    } finally {
      hideLoading();
    }
  },

  /**
   * 处理计划数据
   */
  processPlans (plans) {
    const dimensions = this.data.dimensions.map(dim => {
      const categoryPlans = plans.filter(p => p.category === dim.category);
      return {
        ...dim,
        // enabled 状态不从任务数量判断，而是从本地存储读取
        tasks: categoryPlans.map(plan => ({
          id: plan._id,
          title: plan.title,
          targetDesc: this.formatTarget(plan)
        }))
      };
    });

    const enabledCount = dimensions.filter(d => d.enabled).length;
    const totalTasks = dimensions.reduce((sum, d) => sum + d.tasks.length, 0);

    this.setData({
      dimensions,
      enabledCount,
      totalTasks
    });
  },

  /**
   * 格式化目标描述
   */
  formatTarget (plan) {
    const { type, target } = plan;

    switch (type) {
      case 'duration':
        return `${target.value}${target.unit === 'minute' ? '分钟' : '小时'}`;
      case 'count':
        return `${target.value}${target.unit}`;
      case 'boolean':
        return '完成即可';
      case 'time':
        return `${target.startTime} - ${target.endTime}`;
      default:
        return '';
    }
  },

  /**
   * 检查新手引导状态
   */
  checkGuideStatus () {
    const hasShownGuide = wx.getStorageSync('hasShownPlanGuide');
    this.setData({
      showGuide: !hasShownGuide
    });
  },

  /**
   * 关闭新手引导
   */
  closeGuide () {
    this.setData({ showGuide: false });
    wx.setStorageSync('hasShownPlanGuide', true);
  },

  /**
   * 处理维度卡片点击
   */
  handleDimensionClick (e) {
    const { category } = e.currentTarget.dataset;
    const dimension = this.data.dimensions.find(d => d.category === category);
    vibrate.light();

    if (dimension.enabled) {
      // 已开启，进入管理页
      this.navigateToDetail(category);
    } else {
      // 未开启，提示先开启
      showModal({
        title: '提示',
        content: `请先打开右侧开关启用${dimension.name}`,
        showCancel: false
      });
    }
  },

  /**
   * 处理开关切换
   */
  async handleToggle (e) {
    const { category } = e.currentTarget.dataset;
    const { value } = e.detail;
    const dimension = this.data.dimensions.find(d => d.category === category);

    if (value) {
      // 开启维度
      const dimensions = this.data.dimensions.map(d =>
        d.category === category ? { ...d, enabled: true } : d
      );
      const enabledCount = dimensions.filter(d => d.enabled).length;

      this.setData({
        dimensions,
        enabledCount
      });
      this.saveDimensionSettings();

      vibrate.success();
      showToast(`已开启${dimension.name}，快去添加任务吧~`, 'success');
    } else {
      // 关闭维度
      if (dimension.tasks.length > 0) {
        // 有任务，需要确认
        showModal({
          title: '确认关闭',
          content: `关闭后将删除${dimension.name}下的所有任务（${dimension.tasks.length}个），是否继续？`,
          confirmColor: '#FF6B6B',
          success: async (res) => {
            if (res.confirm) {
              await this.disableDimension(category);
            } else {
              // 用户取消，保持开关状态不变
              this.loadPlans();
            }
          }
        });
      } else {
        // 没有任务，直接关闭
        const dimensions = this.data.dimensions.map(d =>
          d.category === category ? { ...d, enabled: false } : d
        );
        const enabledCount = dimensions.filter(d => d.enabled).length;

        this.setData({
          dimensions,
          enabledCount
        });
        this.saveDimensionSettings();

        vibrate.light();
        showToast(`已关闭${dimension.name}`);
      }
    }
  },

  /**
   * 阻止开关点击事件冒泡
   */
  handleSwitchTap (e) {
    // 阻止冒泡，避免触发卡片点击
  },

  /**
   * 关闭维度
   */
  async disableDimension (category) {
    try {
      showLoading('处理中');
      const dimension = this.data.dimensions.find(d => d.category === category);

      // 删除该维度下的所有计划
      for (const task of dimension.tasks) {
        await planAPI.delete(task.id);
      }

      // 更新状态
      const dimensions = this.data.dimensions.map(d =>
        d.category === category ? { ...d, enabled: false, tasks: [] } : d
      );
      const enabledCount = dimensions.filter(d => d.enabled).length;
      const totalTasks = dimensions.reduce((sum, d) => sum + d.tasks.length, 0);

      this.setData({
        dimensions,
        enabledCount,
        totalTasks
      });
      this.saveDimensionSettings();

      vibrate.light();
      showToast('已关闭');
    } catch (error) {
      console.error('关闭维度失败:', error);
      showToast('操作失败，请重试');
      // 恢复数据
      this.loadPlans();
    } finally {
      hideLoading();
    }
  },

  /**
   * 处理添加任务
   */
  handleAddTask (e) {
    const { category } = e.currentTarget.dataset;
    this.navigateToDetail(category, 'add');
  },

  /**
   * 处理编辑任务
   */
  handleEditTasks (e) {
    const { category } = e.currentTarget.dataset;
    this.navigateToDetail(category);
  },

  /**
   * 跳转到详情页
   */
  navigateToDetail (category, action = 'list') {
    wx.navigateTo({
      url: `/pages/plan/plan-detail?category=${category}&action=${action}`
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh () {
    this.loadPlans().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
