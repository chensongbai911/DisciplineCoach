// components/achievement-unlock/index.js
// 成就解锁动画组件

const vibrate = require('../../utils/vibrate');

Component({
  properties: {
    // 是否显示
    show: {
      type: Boolean,
      value: false
    },
    // 成就数据
    achievement: {
      type: Object,
      value: {}
    }
  },

  data: {
    // 烟花粒子数组
    fireworks: [],
    // 动画状态
    animating: false
  },

  lifetimes: {
    attached () {
      console.log('成就解锁组件已加载');
    }
  },

  observers: {
    'show': function (show) {
      if (show) {
        this.showUnlockAnimation();
      }
    }
  },

  methods: {
    /**
     * 显示解锁动画
     */
    showUnlockAnimation () {
      const { achievement } = this.properties;

      if (!achievement || !achievement.name) {
        console.warn('成就数据为空');
        return;
      }

      // 重度震动反馈
      vibrate.heavy();

      // 设置动画状态
      this.setData({
        animating: true
      });

      // 播放烟花效果
      this.playFireworks();

      // 3秒后自动关闭
      setTimeout(() => {
        this.hideUnlockAnimation();
      }, 3000);
    },

    /**
     * 播放烟花效果
     */
    playFireworks () {
      const fireworks = [];
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

      // 生成50个烟花粒子
      for (let i = 0; i < 50; i++) {
        const angle = (Math.PI * 2 * i) / 50;
        const distance = 100 + Math.random() * 100;

        fireworks.push({
          id: i,
          x: 375, // 屏幕中心X
          y: 667, // 屏幕中心Y
          targetX: 375 + Math.cos(angle) * distance,
          targetY: 667 + Math.sin(angle) * distance,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 4 + Math.random() * 4,
          delay: Math.random() * 0.3,
          duration: 0.8 + Math.random() * 0.4
        });
      }

      this.setData({ fireworks });

      // 烟花消失后清空
      setTimeout(() => {
        this.setData({ fireworks: [] });
      }, 1500);
    },

    /**
     * 隐藏解锁动画
     */
    hideUnlockAnimation () {
      this.setData({
        animating: false,
        fireworks: []
      });

      // 触发关闭事件
      this.triggerEvent('close');
    },

    /**
     * 点击分享按钮
     */
    handleShare () {
      vibrate.light();
      this.triggerEvent('share', { achievement: this.properties.achievement });
    },

    /**
     * 点击蒙层关闭
     */
    handleMaskClick () {
      this.hideUnlockAnimation();
    },

    /**
     * 阻止冒泡
     */
    preventBubble () {
      // 阻止点击事件冒泡到蒙层
    }
  }
});
