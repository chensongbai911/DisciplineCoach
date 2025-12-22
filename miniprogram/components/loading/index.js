// components/loading/index.js
// 自定义加载组件

// 场景化文案配置
const LOADING_TEXTS = {
  'default': '加载中...',
  'login': '登录中...',
  'saving': '保存中...',
  'uploading': '上传中...',
  'deleting': '删除中...',
  'submitting': '提交中...',
  'loading-data': '加载数据中...',
  'syncing': '同步中...',
  'processing': '处理中...',
  'generating': '生成中...'
};

Component({
  properties: {
    // 是否显示
    show: {
      type: Boolean,
      value: false
    },
    // 场景类型
    type: {
      type: String,
      value: 'default'
    },
    // 自定义文案
    text: {
      type: String,
      value: ''
    },
    // 是否全屏遮罩
    mask: {
      type: Boolean,
      value: true
    },
    // 超时时间(ms)
    timeout: {
      type: Number,
      value: 10000
    }
  },

  data: {
    loadingText: '加载中...',
    isTimeout: false,
    dots: '...'
  },

  lifetimes: {
    attached () {
      this.updateText();
    },

    detached () {
      this.clearTimers();
    }
  },

  observers: {
    'show': function (show) {
      if (show) {
        this.startLoading();
      } else {
        this.clearTimers();
      }
    },
    'type, text': function () {
      this.updateText();
    }
  },

  methods: {
    /**
     * 更新文案
     */
    updateText () {
      const { type, text } = this.properties;
      const loadingText = text || LOADING_TEXTS[type] || LOADING_TEXTS['default'];
      this.setData({ loadingText });
    },

    /**
     * 开始加载
     */
    startLoading () {
      this.setData({
        isTimeout: false,
        dots: '...'
      });

      // 点点点动画
      this.startDotsAnimation();

      // 超时检测
      if (this.properties.timeout > 0) {
        this.timeoutTimer = setTimeout(() => {
          this.handleTimeout();
        }, this.properties.timeout);
      }
    },

    /**
     * 点点点动画
     */
    startDotsAnimation () {
      let count = 0;
      this.dotsTimer = setInterval(() => {
        count = (count + 1) % 4;
        const dots = '.'.repeat(count || 1);
        this.setData({ dots });
      }, 400);
    },

    /**
     * 处理超时
     */
    handleTimeout () {
      this.setData({ isTimeout: true });
      this.triggerEvent('timeout');
    },

    /**
     * 清除定时器
     */
    clearTimers () {
      if (this.timeoutTimer) {
        clearTimeout(this.timeoutTimer);
        this.timeoutTimer = null;
      }
      if (this.dotsTimer) {
        clearInterval(this.dotsTimer);
        this.dotsTimer = null;
      }
    },

    /**
     * 重试
     */
    handleRetry () {
      this.setData({ isTimeout: false });
      this.triggerEvent('retry');
    },

    /**
     * 取消
     */
    handleCancel () {
      this.triggerEvent('cancel');
    }
  }
});
