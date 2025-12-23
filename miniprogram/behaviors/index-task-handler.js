/**
 * 首页任务操作 Behavior
 * 负责任务编辑、删除、快速输入等操作
 */

const { planAPI } = require('../utils/api.js')
const vibrate = require('../utils/vibrate.js')

module.exports = Behavior({
  data: {
    // 滑动操作配置
    swipeActions: [
      { text: '编辑', type: 'primary', icon: '✏️' },
      { text: '删除', type: 'danger', icon: '🗑️' }
    ]
  },

  methods: {
    /**
     * 处理滑动操作
     */
    handleSwipeAction (e) {
      const { action, index } = e.detail;
      const { task } = e.currentTarget.dataset;

      console.log('滑动操作:', action, task);

      if (action.text === '编辑') {
        this.editTask(task);
      } else if (action.text === '删除') {
        this.deleteTask(task);
      }
    },

    /**
     * 编辑任务
     */
    editTask (task) {
      vibrate.medium();

      wx.showModal({
        title: '编辑任务',
        content: `确认编辑「${task.title}」？`,
        confirmText: '去编辑',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: `/pages/plan/plan-detail?id=${task.id}`
            });
          }
        }
      });
    },

    /**
     * 删除任务
     */
    deleteTask (task) {
      vibrate.heavy();

      wx.showModal({
        title: '确认删除',
        content: `删除后无法恢复「${task.title}」，确认删除？`,
        confirmText: '删除',
        confirmColor: '#FF4444',
        cancelText: '取消',
        success: async (res) => {
          if (res.confirm) {
            try {
              wx.showLoading({ title: '删除中...' });

              await planAPI.delete(task.id);

              wx.hideLoading();
              wx.showToast({
                title: '删除成功',
                icon: 'success',
                duration: 2000
              });

              // 刷新数据
              this.loadData();
            } catch (err) {
              wx.hideLoading();
              console.error('删除任务失败:', err);
              wx.showToast({
                title: '删除失败',
                icon: 'error',
                duration: 2000
              });
            }
          }
        }
      });
    },

    /**
     * 长按任务
     */
    handleLongPress (e) {
      const { taskId, taskTitle, taskType, taskUnit, taskTargetValue, taskCompleted } = e.currentTarget.dataset;

      // 已完成的任务不处理
      if (taskCompleted) {
        return;
      }

      // 检查网络状态
      if (!this.data.isOnline) {
        wx.showToast({
          title: '当前离线，无法打卡',
          icon: 'none',
          duration: 2000
        });
        return;
      }

      // 中等震动反馈
      vibrate.medium();

      // 布尔型任务直接快速打卡
      if (taskType === 'boolean') {
        wx.showModal({
          title: '快速打卡',
          content: `确认完成「${taskTitle}」？`,
          confirmText: '确认',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.quickCheckin(taskId, taskTitle, 1, '');
            }
          }
        });
      } else {
        // 数值型任务显示快捷输入
        this.showQuickInput(taskId, taskTitle, taskType, taskUnit, taskTargetValue);
      }
    },

    /**
     * 显示快捷输入
     */
    showQuickInput (taskId, taskTitle, taskType, taskUnit, taskTargetValue) {
      const unit = taskUnit || '';
      wx.showModal({
        title: `快速打卡：${taskTitle}`,
        content: `请输入完成量（目标：${taskTargetValue}${unit}）`,
        editable: true,
        placeholderText: `输入${unit}数`,
        confirmText: '确认',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm && res.content) {
            const value = Number(res.content);
            if (!isNaN(value) && value > 0) {
              this.quickCheckin(taskId, taskTitle, value, '');
            } else {
              wx.showToast({
                title: '请输入有效数值',
                icon: 'none',
                duration: 2000
              });
            }
          }
        }
      });
    }
  }
})
