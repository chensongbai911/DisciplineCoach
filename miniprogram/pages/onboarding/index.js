// pages/onboarding/index.js
const { planAPI } = require('../../utils/api');
const { showToast, showLoading, hideLoading } = require('../../utils/common');

Page({
  data: {
    currentStep: 0,
    dimensions: [
      {
        id: 1,
        category: 'exercise',
        name: '运动健身',
        description: '保持身体健康，提升活力',
        icon: '🏃',
        color: '#FF6B6B',
        selected: true,
        defaultPlan: '每天运动30分钟'
      },
      {
        id: 2,
        category: 'diet',
        name: '健康饮食',
        description: '合理膳食，营养均衡',
        icon: '🥗',
        color: '#38B2AC',
        selected: true,
        defaultPlan: '每天喝水8杯'
      },
      {
        id: 3,
        category: 'sleep',
        name: '规律作息',
        description: '早睡早起，精力充沛',
        icon: '😴',
        color: '#9F7AEA',
        selected: false,
        defaultPlan: '23:00-07:00 睡眠'
      },
      {
        id: 4,
        category: 'reading',
        name: '阅读学习',
        description: '拓宽视野，丰富内心',
        icon: '📚',
        color: '#F6AD55',
        selected: false,
        defaultPlan: '每天阅读30分钟'
      },
      {
        id: 5,
        category: 'study',
        name: '技能提升',
        description: '持续学习，不断进步',
        icon: '💻',
        color: '#4299E1',
        selected: false,
        defaultPlan: '每天学习1小时'
      }
    ]
  },

  onLoad (options) {
    // 检查是否已完成引导
    const hasCompletedOnboarding = wx.getStorageSync('hasCompletedOnboarding');
    if (hasCompletedOnboarding) {
      // 已完成引导，跳转到首页
      wx.reLaunch({
        url: '/pages/index/index'
      });
    }
  },

  /**
   * 计算选中的维度数量
   */
  get selectedCount () {
    return this.data.dimensions.filter(d => d.selected).length;
  },

  /**
   * 获取选中的维度
   */
  get selectedDimensions () {
    return this.data.dimensions.filter(d => d.selected);
  },

  /**
   * 切换维度选择
   */
  toggleDimension (e) {
    const { id } = e.currentTarget.dataset;
    const dimensions = this.data.dimensions.map(dim => {
      if (dim.id === id) {
        return { ...dim, selected: !dim.selected };
      }
      return dim;
    });

    this.setData({ dimensions });
  },

  /**
   * 下一步
   */
  async nextStep () {
    const { currentStep } = this.data;

    if (currentStep === 0) {
      // 欢迎页 -> 选择维度
      this.setData({ currentStep: 1 });
    } else if (currentStep === 1) {
      // 选择维度 -> 创建计划
      const selectedCount = this.data.dimensions.filter(d => d.selected).length;
      if (selectedCount === 0) {
        showToast('请至少选择一个维度');
        return;
      }
      this.setData({ currentStep: 2 });
    } else if (currentStep === 2) {
      // 创建默认计划并完成引导
      await this.createDefaultPlans();
    }
  },

  /**
   * 上一步
   */
  prevStep () {
    const { currentStep } = this.data;
    if (currentStep > 0) {
      this.setData({ currentStep: currentStep - 1 });
    }
  },

  /**
   * 创建默认计划
   */
  async createDefaultPlans () {
    const selectedDimensions = this.data.dimensions.filter(d => d.selected);

    if (selectedDimensions.length === 0) {
      showToast('请至少选择一个维度');
      return;
    }

    try {
      showLoading('正在创建计划...');

      // 为每个选中的维度创建默认计划
      const promises = selectedDimensions.map(dim => {
        const planData = this.getDefaultPlanData(dim);
        return planAPI.create(planData);
      });

      await Promise.all(promises);

      // 保存维度启用状态（使用英文 category 作为 key）
      const dimensionSettings = {};
      selectedDimensions.forEach(dim => {
        dimensionSettings[dim.category] = true;
      });
      wx.setStorageSync('dimensionSettings', dimensionSettings);

      // 标记引导完成
      wx.setStorageSync('hasCompletedOnboarding', true);

      hideLoading();
      showToast('计划创建成功！', 'success');

      // 跳转到首页
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/index/index'
        });
      }, 1500);

    } catch (error) {
      console.error('创建默认计划失败:', error);
      hideLoading();
      showToast('创建失败，请重试');
    }
  },

  /**
   * 获取默认计划数据
   */
  getDefaultPlanData (dimension) {
    const defaultPlans = {
      'exercise': {
        title: '每日运动',
        category: 'exercise',
        targetType: 'duration',
        targetValue: 30,
        targetUnit: 'minute'
      },
      'diet': {
        title: '每日饮水',
        category: 'diet',
        targetType: 'count',
        targetValue: 8,
        targetUnit: '杯'
      },
      'sleep': {
        title: '规律睡眠',
        category: 'sleep',
        targetType: 'time',
        targetValue: '23:00-07:00',
        targetUnit: ''
      },
      'reading': {
        title: '每日阅读',
        category: 'reading',
        targetType: 'duration',
        targetValue: 30,
        targetUnit: 'minute'
      },
      'study': {
        title: '每日学习',
        category: 'study',
        targetType: 'duration',
        targetValue: 60,
        targetUnit: 'minute'
      }
    };

    const plan = defaultPlans[dimension.category];

    // 返回云函数期望的参数结构
    return {
      title: plan.title,
      category: plan.category,
      targetType: plan.targetType,
      targetValue: plan.targetValue,
      targetUnit: plan.targetUnit,
      reminderTime: '', // 不启用提醒
      days: [1, 2, 3, 4, 5, 6, 0] // 每天（0代表周日）
    };
  },

  /**
   * 跳过引导
   */
  skipOnboarding () {
    wx.showModal({
      title: '确认跳过',
      content: '跳过引导将直接进入应用，你可以稍后在"我的计划"中手动创建任务',
      confirmText: '确认跳过',
      cancelText: '继续引导',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('hasCompletedOnboarding', true);
          wx.reLaunch({
            url: '/pages/index/index'
          });
        }
      }
    });
  }
});
