/**
 * 左滑操作组件
 * 支持任务卡片左滑显示快捷操作按钮
 */

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
    // 动作按钮总宽度
    actionsWidth: 0
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
      this.setData({
        startX: touch.clientX,
        startY: touch.clientY,
        isMoving: false
      });

      // 通知其他swipe-action关闭
      this.triggerEvent('swipestart');
    },

    /**
     * 触摸移动
     */
    handleTouchMove (e) {
      if (this.data.disabled) return;

      const touch = e.touches[0];
      const { startX, startY, actionsWidth, isOpen } = this.data;

      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      // 判断滑动方向（水平滑动才生效）
      if (!this.data.isMoving) {
        // 需要水平滑动距离明显大于垂直距离
        if (Math.abs(deltaX) < Math.abs(deltaY) * 1.5) {
          // 垂直滑动为主，不处理
          return;
        }
        this.setData({ isMoving: true });
      }

      let moveX;

      if (isOpen) {
        // 已打开状态：支持右滑关闭
        moveX = Math.min(deltaX - actionsWidth, 0);
        moveX = Math.max(moveX, -actionsWidth);
      } else {
        // 关闭状态：支持左滑打开
        if (deltaX >= 0) {
          // 右滑不处理
          moveX = 0;
        } else {
          // 左滑打开
          moveX = Math.max(deltaX, -actionsWidth);
        }
      }

      this.setData({ moveX });
    },

    /**
     * 触摸结束
     */
    handleTouchEnd () {
      if (this.data.disabled) return;

      const { moveX, threshold, actionsWidth, isOpen } = this.data;

      // 计算当前位置相对于目标状态的距离
      const distanceToOpen = Math.abs(moveX + actionsWidth);
      const distanceToClose = Math.abs(moveX);

      // 如果移动距离太小，恢复原状态
      if (Math.abs(moveX) < threshold && !isOpen) {
        this.close();
        return;
      }

      // 根据距离判断最终状态
      if (distanceToClose < distanceToOpen) {
        // 更接近关闭状态
        this.close();
      } else {
        // 更接近打开状态
        this.open();
      }
    },

    /**
     * 打开动作按钮
     */
    open () {
      const { actionsWidth } = this.data;

      // 关闭其他打开的实例
      instanceManager.closeAll(this);

      this.setData({
        moveX: -actionsWidth,
        isOpen: true
      });

      // 轻微震动反馈
      wx.vibrateShort({ type: 'light' });

      this.triggerEvent('open');
    },

    /**
     * 关闭动作按钮
     */
    close () {
      this.setData({
        moveX: 0,
        isOpen: false
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
