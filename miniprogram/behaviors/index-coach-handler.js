/**
 * 小教练和连续天数 Behavior
 * 负责教练消息、连续天数、成就系统
 */

const { recordAPI } = require('../utils/api.js')

module.exports = Behavior({
  data: {
    // 小教练消息
    coachMessage: '今天也要元气满满哦~',

    // 连续天数
    streakDays: 0,

    // 成就系统
    showAchievementUnlock: false,
    currentAchievement: null
  },

  methods: {
    /**
     * 更新教练消息
     */
    updateCoachMessage () {
      const { completedTasks, totalTasks } = this.data;
      const messages = this.getCoachMessages(completedTasks, totalTasks);
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];

      this.setData({
        coachMessage: randomMessage
      });
    },

    /**
     * 获取教练消息列表
     */
    getCoachMessages (completed, total) {
      const hour = new Date().getHours()

      // 早上问候
      if (hour < 12) {
        return ['早上好！今天也要元气满满哦~', '新的一天开始了，加油！', '早安！准备好迎接挑战了吗？']
      }

      // 全部完成
      if (completed === total && total > 0) {
        return ['太棒了！今天所有目标都完成了！', '你真是自律之星！', '完美收官！继续保持~']
      }

      // 完成一半
      if (completed >= total / 2 && total > 0) {
        return ['不错哦！已经完成一半了！', '继续加油，胜利在望！', '你很棒！再接再厉！']
      }

      // 还未开始
      if (completed === 0 && total > 0) {
        return ['开始行动吧！第一步最重要！', '相信自己，你可以的！', '今天也要努力哦~']
      }

      // 默认
      return ['今天也要元气满满哦~', '加油，你是最棒的！', '每一步都算数！']
    },

    /**
     * 加载连续天数
     */
    async loadStreakDays () {
      try {
        const result = await recordAPI.calculateStreak();  // 修复：getStreakDays → calculateStreak
        const streakDays = result?.streakDays || result?.days || 0;  // 兼容两种返回格式

        this.setData({ streakDays });

        console.log('连续打卡天数:', streakDays);
        return streakDays;
      } catch (err) {
        console.error('加载连续天数失败:', err);
        return 0;
      }
    },

    /**
     * 检查并发送连续天数庆祝
     */
    async checkAndSendStreakCongrats () {
      const { streakDays } = this.data;

      // 里程碑天数
      const milestones = [7, 14, 21, 30, 60, 90, 100, 180, 365];

      if (milestones.includes(streakDays)) {
        wx.showModal({
          title: `连续打卡 ${streakDays} 天！`,
          content: '恭喜你达成新的里程碑！继续保持自律，你是最棒的！',
          showCancel: false,
          confirmText: '太好了',
          success: () => {
            // 可以在这里触发成就解锁
            console.log('连续天数里程碑:', streakDays);
          }
        });
      }
    },

    /**
     * 检查成就
     */
    async checkAchievements () {
      const { completedTasks, totalTasks, streakDays } = this.data;

      // 成就列表
      const achievements = [
        {
          id: 'first_checkin',
          title: '初次尝试',
          description: '完成第一次打卡',
          condition: () => completedTasks > 0,
          icon: '🎉'
        },
        {
          id: 'perfect_day',
          title: '完美的一天',
          description: '完成当天所有任务',
          condition: () => completedTasks === totalTasks && totalTasks > 0,
          icon: '⭐'
        },
        {
          id: 'streak_7',
          title: '七日之约',
          description: '连续打卡7天',
          condition: () => streakDays >= 7,
          icon: '🔥'
        },
        {
          id: 'streak_30',
          title: '坚持一月',
          description: '连续打卡30天',
          condition: () => streakDays >= 30,
          icon: '💪'
        },
        {
          id: 'streak_100',
          title: '百日修行',
          description: '连续打卡100天',
          condition: () => streakDays >= 100,
          icon: '👑'
        }
      ];

      // 检查已解锁的成就
      try {
        const unlockedAchievements = wx.getStorageSync('unlocked_achievements') || [];

        for (const achievement of achievements) {
          // 如果成就已解锁，跳过
          if (unlockedAchievements.includes(achievement.id)) {
            continue;
          }

          // 检查是否满足条件
          if (achievement.condition()) {
            // 解锁成就
            unlockedAchievements.push(achievement.id);
            wx.setStorageSync('unlocked_achievements', unlockedAchievements);

            // 显示成就解锁动画
            this.showAchievementUnlock(achievement);

            // 只显示一个成就
            break;
          }
        }
      } catch (e) {
        console.error('检查成就失败:', e);
      }
    },

    /**
     * 显示成就解锁
     */
    showAchievementUnlock (achievement) {
      this.setData({
        showAchievementUnlock: true,
        currentAchievement: achievement
      });

      // 5秒后自动关闭
      setTimeout(() => {
        this.setData({
          showAchievementUnlock: false
        });
      }, 5000);
    },

    /**
     * 关闭成就弹窗
     */
    handleAchievementClose () {
      this.setData({
        showAchievementUnlock: false,
        currentAchievement: null
      });
    },

    /**
     * 分享成就
     */
    handleAchievementShare (e) {
      console.log('分享成就:', e.detail);
      this.setData({
        showAchievementUnlock: false,
        currentAchievement: null
      });
    }
  }
})
