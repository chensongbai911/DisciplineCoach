// pages/record/day-detail.js
// 某日打卡详情页

const { recordAPI, planAPI } = require('../../utils/api');
const { showToast, showLoading, hideLoading, showModal } = require('../../utils/common');
const { formatDate, formatDateChinese, getWeekday } = require('../../utils/date');

// 维度配置
const DIMENSIONS = {
  '运动': { name: '运动健身', icon: '🏃', color: '#FF6B6B' },
  '饮食': { name: '健康饮食', icon: '🥗', color: '#4ECDC4' },
  '睡眠': { name: '规律作息', icon: '😴', color: '#9B59B6' },
  '阅读': { name: '阅读学习', icon: '📚', color: '#F39C12' },
  '学习': { name: '技能提升', icon: '💻', color: '#3498DB' }
};

Page({
  data: {
    date: '',
    dateDisplay: '',
    weekday: '',

    dimensions: [],
    totalCount: 0,
    completedCount: 0,
    completionRate: 0,
    progressColor: '#07C160',
    evaluation: '',

    showEditModal: false,
    editData: {
      recordId: '',
      actualValue: '',
      remark: ''
    }
  },

  onLoad (options) {
    const { date } = options;
    const targetDate = date || formatDate(new Date());

    this.setData({
      date: targetDate,
      dateDisplay: formatDateChinese(targetDate),
      weekday: getWeekday(targetDate)
    });

    this.loadData();
  },

  /**
   * 加载数据
   */
  async loadData () {
    try {
      showLoading('加载中');

      const [plans, records] = await Promise.all([
        planAPI.list({ status: 'active' }),
        recordAPI.getByDate(this.data.date)
      ]);

      this.processData(plans, records);

    } catch (error) {
      console.error('加载数据失败:', error);
      showToast('加载失败，请重试');
    } finally {
      hideLoading();
    }
  },

  /**
   * 处理数据
   */
  processData (plans, records) {
    // 记录映射
    const recordMap = {};
    records.forEach(record => {
      recordMap[record.plan_id] = record;
    });

    // 按维度分组
    const dimensionMap = {};
    Object.keys(DIMENSIONS).forEach(category => {
      dimensionMap[category] = {
        ...DIMENSIONS[category],
        category,
        records: [],
        totalCount: 0,
        completedCount: 0
      };
    });

    let totalCount = 0;
    let completedCount = 0;

    plans.forEach(plan => {
      const record = recordMap[plan._id];
      const completed = !!record;

      const recordItem = {
        id: record ? record._id : null,
        planId: plan._id,
        title: plan.title,
        targetText: this.getTargetText(plan),
        actualText: record ? this.getActualText(record, plan) : '',
        completed,
        remark: record ? record.remark : '',
        record
      };

      if (dimensionMap[plan.category]) {
        dimensionMap[plan.category].records.push(recordItem);
        dimensionMap[plan.category].totalCount++;
        totalCount++;

        if (completed) {
          dimensionMap[plan.category].completedCount++;
          completedCount++;
        }
      }
    });

    // 转换为数组并过滤空维度
    const dimensions = Object.values(dimensionMap)
      .filter(dim => dim.totalCount > 0);

    // 计算完成率
    const completionRate = totalCount > 0
      ? Math.round((completedCount / totalCount) * 100)
      : 0;

    // 进度条颜色
    let progressColor = '#07C160';
    if (completionRate < 50) {
      progressColor = '#FF6B6B';
    } else if (completionRate < 80) {
      progressColor = '#F39C12';
    }

    // 评价
    let evaluation = '继续努力';
    if (completionRate === 100) {
      evaluation = '完美';
    } else if (completionRate >= 80) {
      evaluation = '优秀';
    } else if (completionRate >= 60) {
      evaluation = '良好';
    }

    this.setData({
      dimensions,
      totalCount,
      completedCount,
      completionRate,
      progressColor,
      evaluation
    });
  },

  /**
   * 获取目标文本
   */
  getTargetText (plan) {
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
   * 获取实际完成文本
   */
  getActualText (record, plan) {
    if (plan.type === 'boolean') {
      return '已完成';
    }

    const unit = plan.type === 'duration'
      ? (plan.target.unit === 'minute' ? '分钟' : '小时')
      : plan.target.unit;

    return `${record.actual_value}${unit}`;
  },

  /**
   * 编辑打卡
   */
  handleEdit (e) {
    const { record } = e.currentTarget.dataset;

    this.setData({
      showEditModal: true,
      editData: {
        recordId: record.id,
        actualValue: record.record.actual_value,
        remark: record.remark || ''
      }
    });
  },

  /**
   * 删除打卡
   */
  async handleDelete (e) {
    const { id } = e.currentTarget.dataset;

    const res = await showModal({
      title: '确认删除',
      content: '确定要删除这条打卡记录吗？',
      confirmColor: '#FF6B6B'
    });

    if (res.confirm) {
      try {
        showLoading('删除中');
        await recordAPI.delete(id);
        showToast('删除成功', 'success');
        this.loadData();
      } catch (error) {
        console.error('删除失败:', error);
        showToast('删除失败，请重试');
      } finally {
        hideLoading();
      }
    }
  },

  /**
   * 关闭编辑弹窗
   */
  closeEditModal () {
    this.setData({ showEditModal: false });
  },

  /**
   * 输入实际值
   */
  onActualValueInput (e) {
    this.setData({
      'editData.actualValue': e.detail.value
    });
  },

  /**
   * 输入备注
   */
  onRemarkInput (e) {
    this.setData({
      'editData.remark': e.detail.value
    });
  },

  /**
   * 确认编辑
   */
  async confirmEdit () {
    const { editData } = this.data;

    if (!editData.actualValue) {
      showToast('请输入实际完成值');
      return;
    }

    try {
      showLoading('保存中');

      await recordAPI.update(editData.recordId, {
        actual_value: Number(editData.actualValue),
        remark: editData.remark
      });

      showToast('保存成功', 'success');
      this.closeEditModal();
      this.loadData();

    } catch (error) {
      console.error('保存失败:', error);
      showToast('保存失败，请重试');
    } finally {
      hideLoading();
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh () {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
