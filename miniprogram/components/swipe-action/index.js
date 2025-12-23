/**
 * 左滑操作组件
 * 支持任务卡片左滑显示快捷操作按钮
 */

// Polyfill for requestAnimationFrame in WeChat MiniProgram
const requestAnimationFrame = (callback) => {
  return setTimeout(() => {
    callback(Date.now());
  }, 1000 / 60); // 模拟60fps
};

const cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// 全局实例管理器
const instanceManager = {
  instances: [],
  register (instance) {
    this.instances.push(instance);
  },
  unregister (instance) {
    const index = this.instances.indexOf(instance);
    if (index > -1) {
      this.instances.splice(index, 1);
    }
  },
  closeAll (except) {
    this.instances.forEach(instance => {
      if (instance !== except && instance.data.isOpen) {
        instance.close();
      }
    });
  }
};

Component({
  options: {
    multipleSlots: true
  },

  properties: {
    // 是否禁用滑动
    disabled: {
      type: Boolean,
      value: false
    },
    // 右侧按钮配置
    actions: {
      type: Array,
      value: []
      // 示例: [{ text: '编辑', type: 'primary', icon: '✏️' }, { text: '删除', type: 'danger', icon: '🗑️' }]
    },
    // 滑动阈值(rpx)
    threshold: {
      type: Number,
      value: 40
    }
  },

  data: {
    // 滑动状态
    startX: 0,
    startY: 0,
    moveX: 0,
    isMoving: false,
    isOpen: false,
    direction: null, // 滑动方向: 'horizontal' | 'vertical' | null
    // 动作按钮总宽度
    actionsWidth: 0,
    // 动画配置
    transitionStyle: 'none'
  },

  lifetimes: {
    attached () {
      // 计算动作按钮总宽度
      const actionsWidth = this.data.actions.length * 120; // 每个按钮120rpx
      this.setData({ actionsWidth });

      // 注册到实例管理器
      instanceManager.register(this);
    },

    detached () {
      // 从实例管理器注销
      instanceManager.unregister(this);
    }
  },

  methods: {
    /**
     * 触摸开始
     */
    handleTouchStart (e) {
      if (this.data.disabled) return;

      const touch = e.touches[0];
      const now = Date.now();

      // 记录触摸数据用于速度计算
      this.touchData = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: now,
        lastX: touch.clientX,
        lastY: touch.clientY,
        lastTime: now
      };

      this.setData({
        startX: touch.clientX,
        startY: touch.clientY,
        isMoving: false,
        direction: null,
        transitionStyle: 'none'
      });

      // 通知其他swipe-action关闭
      this.triggerEvent('swipestart');
    },

    /**
     * 触摸移动
     */
    handleTouchMove (e) {
      if (this.data.disabled) return;

      // RAF 节流优化性能
      if (this.rafId) return;
      this.rafId = requestAnimationFrame(() => {
        this.processTouchMove(e);
        this.rafId = null;
      });
    },

    /**
     * 实际处理触摸移动
     */
    processTouchMove (e) {
      const touch = e.touches[0];
      const { startX, startY, actionsWidth, isOpen, direction } = this.data;
      const now = Date.now();

      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // 更新速度追踪数据
      if (this.touchData) {
        this.touchData.lastX = touch.clientX;
        this.touchData.lastY = touch.clientY;
        this.touchData.lastTime = now;
      }

      // 第一次移动判断方向（精确判断，避免误触）
      if (!direction && (absX > 10 || absY > 10)) {
        if (absX > absY * 3) {
          // 明显的水平滑动（3倍阈值）
          this.setData({
            direction: 'horizontal',
            isMoving: true
          });
        } else {
          // 垂直或斜向滑动，不处理
          this.setData({ direction: 'vertical' });
          return;
        }
      }

      // 如果判定为垂直滑动，直接返回
      if (direction === 'vertical') {
        return;
      }

      // 水平滑动处理
      if (direction === 'horizontal') {
        let moveX;
        const maxOverflow = actionsWidth * 0.2; // 允许 20% 超出

        if (isOpen) {
          // 已打开状态
          if (deltaX > 0) {
            // 右滑关闭（带橡皮筋效果）
            moveX = Math.min(deltaX * 0.3, maxOverflow) - actionsWidth;
          } else {
            // 继续左滑（硬边界）
            moveX = -actionsWidth;
          }
        } else {
          // 关闭状态
          if (deltaX >= 0) {
            // 右滑（橡皮筋效果）
            moveX = Math.min(deltaX * 0.3, 0);
          } else {
            // 左滑打开
            const targetMove = -actionsWidth - maxOverflow;
            if (deltaX < targetMove) {
              // 超出边界，施加阻力
              const overflow = deltaX - targetMove;
              moveX = targetMove + overflow * 0.3;
            } else {
              moveX = Math.max(deltaX, targetMove);
            }
          }
        }

        this.setData({ moveX });
      }
    },

    /**
     * 触摸结束
     */
    handleTouchEnd () {
      if (this.data.disabled) return;

      const { moveX, actionsWidth, isOpen, direction } = this.data;

      // 如果是垂直滑动，直接返回
      if (direction === 'vertical') {
        this.setData({ direction: null });
        return;
      }

      // 计算滑动速度
      let velocity = 0;
      if (this.touchData) {
        const { startTime, lastTime, startX, lastX } = this.touchData;
        const duration = Math.max(lastTime - startTime, 1);
        const distance = lastX - startX;
        velocity = Math.abs(distance / duration); // px/ms
      }

      // 快速滑动判定（速度 > 0.3 px/ms）
      const isFlick = velocity > 0.3;

      // 智能判定最终状态
      if (isFlick) {
        // 快速滑动：根据方向决定
        if (moveX < -20) {
          this.open();
        } else {
          this.close();
        }
      } else {
        // 慢速滑动：根据距离判断
        const openThreshold = actionsWidth * 0.35; // 滑动超过 35% 就打开

        if (Math.abs(moveX) > openThreshold) {
          this.open();
        } else {
          this.close();
        }
      }

      // 清理数据
      this.touchData = null;
      this.setData({ direction: null });
    },

    /**
     * 打开动作按钮
     */
    open () {
      const { actionsWidth, isOpen } = this.data;

      // 如果已经打开，不重复操作
      if (isOpen) return;

      // 关闭其他打开的实例
      instanceManager.closeAll(this);

      this.setData({
        moveX: -actionsWidth,
        isOpen: true,
        transitionStyle: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' // easeOutQuad
      });

      // 轻微震动反馈
      wx.vibrateShort({ type: 'light' }).catch(() => { });

      this.triggerEvent('open');
    },

    /**
     * 关闭动作按钮
     */
    close () {
      const { isOpen } = this.data;

      // 如果已经关闭，不重复操作
      if (!isOpen && this.data.moveX === 0) return;

      this.setData({
        moveX: 0,
        isOpen: false,
        transitionStyle: 'transform 0.25s cubic-bezier(0.55, 0.085, 0.68, 0.53)' // easeInQuad
      });

      this.triggerEvent('close');
    },

    /**
     * 点击动作按钮
     */
    handleActionTap (e) {
      const { index } = e.currentTarget.dataset;
      const action = this.data.actions[index];

      // 中等强度震动反馈
      wx.vibrateShort({ type: 'medium' });

      // 触发事件
      this.triggerEvent('actiontap', {
        action,
        index
      });

      // 关闭
      this.close();
    },

    /**
     * 点击内容区域
     */
    handleContentTap () {
      if (this.data.isOpen) {
        // 如果已打开，点击内容区域关闭
        this.close();
      } else {
        // 触发内容点击事件
        this.triggerEvent('contenttap');
      }
    }
  }
});
