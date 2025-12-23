/**
 * 首页打卡操作 Behavior
 * 负责打卡弹窗、快速打卡、批量打卡
 */

const { recordAPI } = require('../utils/api.js')
const { getToday, formatDateDisplay, getDateByOffset } = require('../utils/date.js')
const vibrate = require('../utils/vibrate.js')

module.exports = Behavior({
  data: {
    // 打卡弹窗
    showCheckinModal: false,
    currentTask: null,
    checkinValue: '',
    checkinRemark: '',
    checkinDate: '',
    checkinDateDisplay: '',
    dateRangeStart: '',
    dateRangeEnd: '',
    todayDate: ''
  },

  methods: {
    /**
     * 初始化日期范围
     */
    initDateRange () {
      const today = getToday();
      const yesterday = getDateByOffset(-1);
      const tomorrow = getDateByOffset(1);

      this.setData({
        checkinDate: today,
        checkinDateDisplay: `今天 ${formatDateDisplay(today)}`,
        dateRangeStart: yesterday,
        dateRangeEnd: tomorrow,
        todayDate: today
      });
    },

    /**
     * 打开打卡弹窗
     */
    handleCheckin (e) {
      const { taskId, taskTitle, taskType, taskUnit, taskTargetValue } = e.currentTarget.dataset;

      // 检查网络状态
      if (!this.data.isOnline) {
        wx.showToast({
          title: '当前离线，无法打卡',
          icon: 'none',
          duration: 2000
        });
        return;
      }

      // 轻微震动反馈
      vibrate.light();

      // 设置当前任务
      this.setData({
        showCheckinModal: true,
        currentTask: {
          id: taskId,
          title: taskTitle,
          type: taskType,
          unit: taskUnit || '',
          targetValue: taskTargetValue || 1
        },
        checkinValue: taskType === 'boolean' ? '1' : (taskTargetValue || ''),
        checkinRemark: ''
      });
    },

    /**
     * 关闭打卡弹窗
     */
    closeCheckinModal () {
      vibrate.light();
      this.setData({
        showCheckinModal: false,
        currentTask: null,
        checkinValue: '',
        checkinRemark: ''
      });
    },

    /**
     * 打卡日期变更
     */
    onCheckinDateChange (e) {
      const date = e.detail.value;
      const today = this.data.todayDate;

      let displayText = formatDateDisplay(date);
      if (date === today) {
        displayText = `今天 ${displayText}`;
      } else if (date < today) {
        displayText = `补卡 ${displayText}`;
      } else {
        displayText = `未来 ${displayText}`;
      }

      this.setData({
        checkinDate: date,
        checkinDateDisplay: displayText
      });
    },

    /**
     * 打卡数值输入
     */
    onCheckinValueInput (e) {
      this.setData({
        checkinValue: e.detail.value
      });
    },

    /**
     * 打卡备注输入
     */
    onCheckinRemarkInput (e) {
      this.setData({
        checkinRemark: e.detail.value
      });
    },

    /**
     * 确认打卡
     */
    async confirmCheckin () {
      const { currentTask, checkinValue, checkinRemark, checkinDate } = this.data;

      // 验证输入
      if (!checkinValue || checkinValue.trim() === '') {
        wx.showToast({
          title: '请输入打卡数值',
          icon: 'none',
          duration: 2000
        });
        return;
      }

      const actualValue = Number(checkinValue);
      if (isNaN(actualValue) || actualValue <= 0) {
        wx.showToast({
          title: '请输入有效的数值',
          icon: 'none',
          duration: 2000
        });
        return;
      }

      // 中等震动反馈
      vibrate.medium();

      // 关闭弹窗
      this.closeCheckinModal();

      // 显示加载
      wx.showLoading({ title: '打卡中...' });

      try {
        // 调用API
        await recordAPI.create({
          planId: currentTask.id,
          date: checkinDate,
          actualValue: actualValue,
          remark: checkinRemark || ''
        });

        wx.hideLoading();

        // 乐观更新UI
        this.updateTaskStatusLocally(currentTask.id, {
          completed: true,
          actualValue: actualValue,
          remark: checkinRemark || ''
        });

        // 显示成功动画
        this.showSuccessAnimation();

        // 并发加载连续天数和检查庆祝(不阻塞用户)
        Promise.all([
          this.loadStreakDays().catch(e => console.warn('加载连续天数失败:', e)),
          this.checkAndSendStreakCongrats().catch(e => console.warn('检查连续天数庆祝失败:', e))
        ]).finally(() => {
          // 询问是否分享
          this.askForShare();
        });

      } catch (err) {
        wx.hideLoading();
        console.error('打卡失败:', err);

        wx.showToast({
          title: '打卡失败，请重试',
          icon: 'error',
          duration: 2000
        });
      }
    },

    /**
     * 快速打卡（无弹窗）
     */
    async quickCheckin (taskId, taskTitle, actualValue, remark) {
      vibrate.light();

      // 乐观更新UI
      this.updateTaskStatusLocally(taskId, {
        completed: true,
        actualValue: Number(actualValue),
        remark: remark || ''
      });

      // 显示成功动画
      this.showSuccessAnimation();

      // 异步保存到云端
      try {
        await recordAPI.create({
          planId: taskId,
          date: getToday(),
          actualValue: Number(actualValue),
          remark: remark || ''
        });

        console.log('快速打卡成功');

        // 并发加载连续天数和检查庆祝(不阻塞用户)
        Promise.all([
          this.loadStreakDays().catch(e => console.warn('加载连续天数失败:', e)),
          this.checkAndSendStreakCongrats().catch(e => console.warn('检查连续天数庆祝失败:', e))
        ]).finally(() => {
          // 询问是否分享
          this.askForShare();
        });

      } catch (err) {
        console.error('快速打卡保存失败:', err);
        // 回滚UI
        this.rollbackTaskStatus(taskId);

        wx.showToast({
          title: '打卡保存失败',
          icon: 'error',
          duration: 2000
        });
      }
    },

    /**
     * 批量快速打卡
     */
    async batchQuickCheckin (tasks) {
      const today = getToday();
      const results = [];

      // 遍历任务进行打卡
      for (const task of tasks) {
        try {
          // 乐观更新UI
          this.updateTaskStatusLocally(task.id, {
            completed: true,
            actualValue: task.type === 'boolean' ? 1 : (task.targetValue || 1),
            remark: '快速打卡'
          });

          // 调用API
          await recordAPI.create({
            planId: task.id,
            date: today,
            actualValue: task.type === 'boolean' ? 1 : (task.targetValue || 1),
            remark: '快速打卡'
          });

          results.push({ success: true, taskId: task.id });
        } catch (err) {
          console.error('批量打卡失败:', task.title, err);
          // 回滚UI
          this.rollbackTaskStatus(task.id);
          results.push({ success: false, taskId: task.id });
        }
      }

      // 统计结果
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        // 显示成功动画
        this.showSuccessAnimation();

        // 检查连续天数
        await this.loadStreakDays().catch(e => console.warn('加载连续天数失败:', e));
        await this.checkAndSendStreakCongrats().catch(e => console.warn('检查连续天数庆祝失败:', e));
      }

      // 显示结果
      if (failCount === 0) {
        wx.showToast({
          title: `成功打卡 ${successCount} 个任务`,
          icon: 'success',
          duration: 2000
        });
      } else {
        wx.showToast({
          title: `成功 ${successCount} 个，失败 ${failCount} 个`,
          icon: 'none',
          duration: 2500
        });
      }
    }
  }
})
