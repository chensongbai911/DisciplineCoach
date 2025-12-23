/**
 * 首页UI交互 Behavior
 * 负责卡片展开、FAB菜单、分享海报等UI交互
 */

const vibrate = require('../utils/vibrate.js')
const { formatDateChinese } = require('../utils/date.js')

module.exports = Behavior({
  data: {
    // 成功反馈
    showSuccessFeedback: false,
    successMessage: '',

    // 分享海报
    showSharePoster: false,
    shareData: null,

    // FAB菜单
    showFabMenu: false,

    // 当前日期
    currentDate: ''
  },

  methods: {
    /**
     * 初始化页面
     */
    initPage () {
      const today = new Date();
      this.setData({
        currentDate: formatDateChinese(today)
      });
    },

    /**
     * 切换卡片展开/折叠
     */
    toggleCard (e) {
      const { index } = e.currentTarget.dataset;
      const { dimensions } = this.data;

      const newDimensions = dimensions.map((dim, i) => {
        if (i === index) {
          return { ...dim, expanded: !dim.expanded };
        }
        return dim;
      });

      this.setData({ dimensions: newDimensions });
      vibrate.light();
    },

    /**
     * 显示成功动画
     */
    showSuccessAnimation () {
      const messages = [
        '太棒了！继续保持！',
        '又完成一个目标！',
        '你真是自律之星！',
        '坚持就是胜利！',
        '今天也很努力呢！'
      ];

      const randomMessage = messages[Math.floor(Math.random() * messages.length)];

      this.setData({
        showSuccessFeedback: true,
        successMessage: randomMessage
      });

      // 强震动反馈
      vibrate.heavy();

      // 3秒后自动隐藏
      setTimeout(() => {
        this.setData({
          showSuccessFeedback: false
        });
      }, 3000);
    },

    /**
     * 询问是否分享
     */
    askForShare () {
      const { completedTasks, totalTasks } = this.data;

      // 如果全部完成，询问是否分享
      if (completedTasks === totalTasks && totalTasks > 0) {
        setTimeout(() => {
          wx.showModal({
            title: '今日目标已全部完成！',
            content: '要不要生成海报分享一下战绩？',
            confirmText: '生成海报',
            cancelText: '暂不分享',
            success: (res) => {
              if (res.confirm) {
                this.showShare();
              }
            }
          });
        }, 500);
      }
    },

    /**
     * 显示分享海报
     */
    showShare () {
      const { completedTasks, totalTasks, streakDays, progressPercent } = this.data;

      this.setData({
        showSharePoster: true,
        shareData: {
          type: 'checkin',
          completedTasks,
          totalTasks,
          streakDays,
          progressPercent,
          date: new Date().toLocaleDateString('zh-CN')
        }
      });

      vibrate.light();
    },

    /**
     * 关闭分享海报
     */
    closeSharePoster () {
      this.setData({
        showSharePoster: false,
        shareData: null
      });
    },

    /**
     * 海报保存成功
     */
    onSharePosterSave (e) {
      console.log('海报保存成功:', e.detail);
    },

    /**
     * 海报分享
     */
    onSharePosterShare (e) {
      console.log('海报分享:', e.detail);
      this.closeSharePoster();
    },

    /**
     * 切换FAB菜单
     */
    toggleFabMenu () {
      this.setData({
        showFabMenu: !this.data.showFabMenu
      });
      vibrate.light();
    },

    /**
     * 快速全部打卡
     */
    handleQuickCheckAll () {
      vibrate.medium();

      // 关闭FAB菜单
      this.setData({ showFabMenu: false });

      // 获取未完成的任务
      const { dimensions } = this.data;
      const uncompletedTasks = [];

      dimensions.forEach(dim => {
        dim.tasks.forEach(task => {
          if (!task.completed) {
            uncompletedTasks.push(task);
          }
        });
      });

      if (uncompletedTasks.length === 0) {
        wx.showToast({
          title: '所有任务已完成',
          icon: 'success',
          duration: 2000
        });
        return;
      }

      // 确认对话框
      wx.showModal({
        title: '快速全部打卡',
        content: `确认为 ${uncompletedTasks.length} 个未完成任务打卡？`,
        confirmText: '确认',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.showLoading({ title: '批量打卡中...' });
            this.batchQuickCheckin(uncompletedTasks).finally(() => {
              wx.hideLoading();
            });
          }
        }
      });
    },

    /**
     * 跳转到计划页
     */
    goToPlan (e) {
      console.log('[UI Handler] ===== 点击添加任务按钮 =====');
      console.log('[UI Handler] 事件对象:', e);
      console.log('[UI Handler] 当前页面路由:', getCurrentPages());

      try {
        wx.navigateTo({
          url: '/pages/plan/index',
          success: () => {
            console.log('[UI Handler] 跳转成功');
          },
          fail: (error) => {
            console.error('[UI Handler] 跳转失败:', error);
            wx.showToast({
              title: '跳转失败,请重试',
              icon: 'none'
            });
          }
        });
      } catch (error) {
        console.error('[UI Handler] goToPlan异常:', error);
      }
    },

    /**
     * 跳转到统计页
     */
    goToStatistics () {
      wx.switchTab({
        url: '/pages/statistics/index'
      });
    }
  }
})
