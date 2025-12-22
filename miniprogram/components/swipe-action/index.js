/**
 * 左滑操作组件
 * 支持任务卡片左滑显示快捷操作按钮
 */
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
      const actionsWidth = this.data.actions.length * 160; // 每个按钮160rpx
      this.setData({ actionsWidth });
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
      const { startX, startY, actionsWidth } = this.data;

      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      // 判断滑动方向（水平滑动才生效）
      if (!this.data.isMoving) {
        if (Math.abs(deltaX) < Math.abs(deltaY)) {
          // 垂直滑动，不处理
          return;
        }
        this.setData({ isMoving: true });
      }

      // 只允许左滑
      if (deltaX >= 0) {
        this.setData({ moveX: 0 });
        return;
      }

      // 限制滑动距离
      const moveX = Math.max(deltaX, -actionsWidth);
      this.setData({ moveX });
    },

    /**
     * 触摸结束
     */
    handleTouchEnd () {
      if (this.data.disabled) return;

      const { moveX, threshold, actionsWidth } = this.data;

      // 判断是打开还是关闭
      if (Math.abs(moveX) > threshold) {
        // 打开
        this.open();
      } else {
        // 关闭
        this.close();
      }
    },

    /**
     * 打开动作按钮
     */
    open () {
      const { actionsWidth } = this.data;
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
