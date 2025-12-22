// pages/plan/plan-detail.js
// 计划详情页 - 配置某个维度的具体任务

const { planAPI } = require('../../utils/api');
const { showToast, showLoading, hideLoading, showModal } = require('../../utils/common');
const { validatePlanData } = require('../../utils/validator');

// 维度配置
const DIMENSIONS = {
  'exercise': { name: '运动健身', icon: '🏃', color: '#FF6B6B', description: '保持身体健康，提升活力' },
  'diet': { name: '健康饮食', icon: '🥗', color: '#4ECDC4', description: '合理膳食，营养均衡' },
  'sleep': { name: '规律作息', icon: '😴', color: '#9B59B6', description: '早睡早起，精力充沛' },
  'reading': { name: '阅读学习', icon: '📚', color: '#F39C12', description: '拓宽视野，丰富内心' },
  'study': { name: '技能提升', icon: '💻', color: '#3498DB', description: '持续学习，不断进步' }
};

Page({
  data: {
    category: '',
    dimension: {},
    tasks: [],

    // 表单相关
    showTaskForm: false,
    formMode: 'add', // add | edit
    editingTaskId: null,
    formData: {
      title: '',
      type: 'duration', // duration | count | boolean | time
      target: {
        value: '',
        unit: 'minute',
        startTime: '',
        endTime: ''
      },
      reminder: {
        enabled: false,
        time: '09:00'
      },
      description: ''
    },

    // 选项数据
    durationUnits: [
      { value: 'minute', label: '分钟' },
      { value: 'hour', label: '小时' }
    ],
    durationUnitIndex: 0,

    // 会员弹窗
    showMemberModal: false,
    memberBenefits: []
  },

  onLoad (options) {
    const { category, action } = options;
    this.setData({
      category,
      dimension: DIMENSIONS[category] || {}
    });

    this.loadTasks();

    // 如果是添加模式，直接打开表单
    if (action === 'add') {
      this.handleAddTask();
    }
  },

  /**
   * 加载任务列表
   */
  async loadTasks () {
    try {
      showLoading('加载中');
      // category 已经是英文格式，直接使用
      const categoryCode = this.data.category;

      const tasks = await planAPI.list({
        category: categoryCode,
        status: 'active'
      });

      // 将云函数返回数据转换为本地表单/展示结构
      const processedTasks = tasks.map(task => {
        // 还原目标结构
        let target = {
          value: task.targetValue ?? '',
          unit: task.targetUnit || 'minute',
          startTime: '',
          endTime: ''
        };

        if (task.targetType === 'time' && typeof task.targetValue === 'string' && task.targetValue.includes('-')) {
          const [startTime = '', endTime = ''] = task.targetValue.split('-');
          target = { ...target, startTime, endTime };
        }

        // 还原提醒
        const reminder = task.reminderTime
          ? { enabled: true, time: task.reminderTime }
          : { enabled: false, time: '09:00' };

        const localTask = {
          ...task,
          type: task.targetType,
          target,
          reminder,
        };

        return {
          ...localTask,
          targetDesc: this.formatTargetDesc(localTask)
        };
      });

      this.setData({ tasks: processedTasks });
    } catch (error) {
      console.error('加载任务失败:', error);
      showToast('加载失败，请重试');
    } finally {
      hideLoading();
    }
  },

  /**
   * 格式化目标描述
   */
  formatTargetDesc (task) {
    const { type, target } = task;

    switch (type) {
      case 'duration':
        return `${target.value}${target.unit === 'minute' ? '分钟' : '小时'}`;
      case 'count':
        return `${target.value}${target.unit}`;
      case 'boolean':
        return '完成即可';
      case 'time':
        return `${target.startTime || ''} - ${target.endTime || ''}`;
      default:
        return '';
    }
  },

  /**
   * 添加任务
   */
  handleAddTask () {
    // 检查会员限制
    const app = getApp();
    const memberStatus = app.checkMemberStatus();
    const isMember = memberStatus.isVip;

    const currentTaskCount = this.data.tasks.length;
    const maxTasks = isMember ? 5 : 1;

    if (currentTaskCount >= maxTasks) {
      // 显示会员权益对比弹窗
      this.setData({
        showMemberModal: true,
        memberBenefits: [
          {
            feature: '每维度任务数',
            free: '1个',
            vip: '5个',
            freeClass: 'limited',
            vipClass: 'unlimited'
          },
          {
            feature: '统计数据查看',
            free: '7天',
            vip: '90天',
            freeClass: 'limited',
            vipClass: 'unlimited'
          },
          {
            feature: '数据导出',
            free: '❌',
            vip: '✅',
            freeClass: 'limited',
            vipClass: 'unlimited'
          },
          {
            feature: '专属徽章',
            free: '❌',
            vip: '✅',
            freeClass: 'limited',
            vipClass: 'unlimited'
          }
        ]
      });
      return;
    }

    this.setData({
      showTaskForm: true,
      formMode: 'add',
      editingTaskId: null,
      formData: {
        title: '',
        type: 'duration',
        target: {
          value: '',
          unit: 'minute',
          startTime: '',
          endTime: ''
        },
        reminder: {
          enabled: false,
          time: '09:00'
        },
        description: ''
      },
      durationUnitIndex: 0
    });
  },

  /**
   * 关闭会员弹窗
   */
  closeMemberModal () {
    this.setData({ showMemberModal: false });
  },

  /**
   * 跳转到会员页面
   */
  goToVip () {
    wx.navigateTo({ url: '/pages/vip/index' });
  },

  /**
   * 编辑任务
   */
  handleEditTask (e) {
    const { id } = e.currentTarget.dataset;
    const task = this.data.tasks.find(t => t._id === id);

    if (!task) return;

    // 设置时长单位索引
    const durationUnitIndex = this.data.durationUnits.findIndex(
      u => u.value === task.target.unit
    );

    this.setData({
      showTaskForm: true,
      formMode: 'edit',
      editingTaskId: id,
      formData: {
        title: task.title,
        type: task.type,
        target: { ...task.target },
        reminder: task.reminder || { enabled: false, time: '09:00' },
        description: task.description || ''
      },
      durationUnitIndex: durationUnitIndex >= 0 ? durationUnitIndex : 0
    });
  },

  /**
   * 删除任务
   */
  async handleDeleteTask (e) {
    const { id } = e.currentTarget.dataset;
    const task = this.data.tasks.find(t => t._id === id);

    const res = await showModal({
      title: '确认删除',
      content: `确定要删除任务"${task.title}"吗？`,
      confirmColor: '#FF6B6B'
    });

    if (res.confirm) {
      try {
        showLoading('删除中');
        await planAPI.delete(id);
        showToast('删除成功', 'success');
        this.loadTasks();
      } catch (error) {
        console.error('删除任务失败:', error);
        showToast('删除失败，请重试');
      } finally {
        hideLoading();
      }
    }
  },

  /**
   * 阻止事件冒泡
   */
  handleActionTap () {
    // 阻止冒泡，避免触发编辑
  },

  /**
   * 关闭表单
   */
  closeTaskForm () {
    this.setData({ showTaskForm: false });
  },

  /**
   * 表单输入处理
   */
  handleTitleInput (e) {
    this.setData({
      'formData.title': e.detail.value
    });
  },

  handleTypeChange (e) {
    const { type } = e.currentTarget.dataset;
    this.setData({
      'formData.type': type,
      'formData.target': {
        value: '',
        unit: type === 'duration' ? 'minute' : '',
        startTime: '',
        endTime: ''
      }
    });
  },

  handleTargetValueInput (e) {
    this.setData({
      'formData.target.value': e.detail.value
    });
  },

  handleTargetUnitInput (e) {
    this.setData({
      'formData.target.unit': e.detail.value
    });
  },

  handleDurationUnitChange (e) {
    const index = e.detail.value;
    this.setData({
      durationUnitIndex: index,
      'formData.target.unit': this.data.durationUnits[index].value
    });
  },

  handleStartTimeChange (e) {
    this.setData({
      'formData.target.startTime': e.detail.value
    });
  },

  handleEndTimeChange (e) {
    this.setData({
      'formData.target.endTime': e.detail.value
    });
  },

  handleReminderToggle (e) {
    const enabled = e.detail.value;

    // 如果开启提醒，请求订阅消息权限
    if (enabled) {
      wx.requestSubscribeMessage({
        tmplIds: ['YOUR_TEMPLATE_ID'], // TODO: 在微信公众平台申请订阅消息模板后替换此ID
        success: (res) => {
          console.log('订阅消息授权成功', res);
          // 检查是否授权成功
          if (res['YOUR_TEMPLATE_ID'] === 'accept') {
            this.setData({
              'formData.reminder.enabled': true
            });
            wx.showToast({
              title: '已开启提醒',
              icon: 'success'
            });
          } else {
            wx.showModal({
              title: '提示',
              content: '需要授权订阅消息才能开启提醒功能',
              showCancel: false
            });
          }
        },
        fail: (err) => {
          console.error('订阅消息授权失败', err);
          wx.showModal({
            title: '提示',
            content: '订阅消息授权失败，无法开启提醒功能',
            showCancel: false
          });
        }
      });
    } else {
      this.setData({
        'formData.reminder.enabled': false
      });
    }
  },

  handleReminderTimeChange (e) {
    this.setData({
      'formData.reminder.time': e.detail.value
    });
  },

  handleDescriptionInput (e) {
    this.setData({
      'formData.description': e.detail.value
    });
  },

  /**
   * 提交表单
   */
  async handleSubmitTask () {
    console.log('[handleSubmitTask] 开始提交');
    const { formData, formMode, editingTaskId, category } = this.data;
    console.log('[handleSubmitTask] formData:', formData);
    console.log('[handleSubmitTask] category:', category);

    // 数据验证
    const validation = validatePlanData({
      ...formData,
      category
    });

    console.log('[handleSubmitTask] 验证结果:', validation);

    if (!validation.valid) {
      showToast(validation.message);
      return;
    }

    try {
      showLoading(formMode === 'add' ? '添加中' : '保存中');

      // category 已经是英文格式，直接使用
      const payload = {
        category: category, // 已经是 exercise/diet/sleep/reading/study
        title: formData.title,
        targetType: formData.type,
        targetValue: formData.target?.value || null,
        targetUnit: formData.target?.unit || '',
        reminderTime: formData.reminder.enabled ? formData.reminder.time : '',
        days: [1, 2, 3, 4, 5, 6, 0] // 默认每天
      };

      // 时间类型特殊处理：存储开始结束时间拼接，便于后台校验
      if (formData.type === 'time') {
        payload.targetValue = `${formData.target.startTime}-${formData.target.endTime}`;
      }

      if (formMode === 'add') {
        await planAPI.create(payload);
        showToast('添加成功', 'success');
      } else {
        await planAPI.update(editingTaskId, payload);
        showToast('保存成功', 'success');
      }

      this.closeTaskForm();
      this.loadTasks();
    } catch (error) {
      console.error('保存任务失败:', error);
      showToast('操作失败，请重试');
    } finally {
      hideLoading();
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh () {
    this.loadTasks().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
