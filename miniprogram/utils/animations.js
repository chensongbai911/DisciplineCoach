/**
 * 动画库
 * 统一管理项目中的所有动画效果
 *
 * @module utils/animations
 * @version 1.0.0
 * @since 2025-12-23
 */

/**
 * 动画时长（毫秒）
 */
const DURATION = {
  INSTANT: 0,      // 即时
  FAST: 150,       // 快速 (0.15s)
  NORMAL: 300,     // 正常 (0.3s)
  SLOW: 500,       // 缓慢 (0.5s)
  VERY_SLOW: 800   // 非常慢 (0.8s)
};

/**
 * 缓动函数
 */
const EASING = {
  LINEAR: 'linear',
  EASE: 'ease',
  EASE_IN: 'ease-in',
  EASE_OUT: 'ease-out',
  EASE_IN_OUT: 'ease-in-out',
  EASE_IN_BACK: 'ease-in-back',
  EASE_OUT_BACK: 'ease-out-back'
};

/**
 * 动画管理类
 */
class AnimationManager {
  /**
   * 创建动画实例
   * @param {number} duration - 动画时长(ms)
   * @param {string} timingFunction - 缓动函数
   * @param {number} delay - 延迟时间(ms)
   * @returns {Object} wx.createAnimation实例
   */
  static create (duration = DURATION.NORMAL, timingFunction = EASING.EASE_OUT, delay = 0) {
    return wx.createAnimation({
      duration,
      timingFunction,
      delay
    });
  }

  /**
   * 淡入动画
   * @param {number} duration - 动画时长
   * @returns {Object}
   */
  static fadeIn (duration = DURATION.NORMAL) {
    const animation = this.create(duration);
    animation.opacity(1).step();
    return animation.export();
  }

  /**
   * 淡出动画
   * @param {number} duration - 动画时长
   * @returns {Object}
   */
  static fadeOut (duration = DURATION.NORMAL) {
    const animation = this.create(duration);
    animation.opacity(0).step();
    return animation.export();
  }

  /**
   * 从下方滑入
   * @param {number} distance - 滑动距离(rpx)
   * @param {number} duration - 动画时长
   * @returns {Object}
   */
  static slideInUp (distance = 50, duration = DURATION.NORMAL) {
    const animation = this.create(duration, EASING.EASE_OUT);
    animation.translateY(0).opacity(1).step();
    return animation.export();
  }

  /**
   * 向下滑出
   * @param {number} distance - 滑动距离(rpx)
   * @param {number} duration - 动画时长
   * @returns {Object}
   */
  static slideOutDown (distance = 50, duration = DURATION.NORMAL) {
    const animation = this.create(duration, EASING.EASE_IN);
    animation.translateY(distance).opacity(0).step();
    return animation.export();
  }

  /**
   * 缩放进入
   * @param {number} fromScale - 起始缩放
   * @param {number} toScale - 结束缩放
   * @param {number} duration - 动画时长
   * @returns {Object}
   */
  static scaleIn (fromScale = 0.8, toScale = 1, duration = DURATION.NORMAL) {
    const animation = this.create(duration, EASING.EASE_OUT_BACK);
    animation.scale(toScale).opacity(1).step();
    return animation.export();
  }

  /**
   * 缩放退出
   * @param {number} toScale - 结束缩放
   * @param {number} duration - 动画时长
   * @returns {Object}
   */
  static scaleOut (toScale = 0.8, duration = DURATION.NORMAL) {
    const animation = this.create(duration, EASING.EASE_IN);
    animation.scale(toScale).opacity(0).step();
    return animation.export();
  }

  /**
   * 旋转动画
   * @param {number} degree - 旋转角度
   * @param {number} duration - 动画时长
   * @returns {Object}
   */
  static rotate (degree = 360, duration = DURATION.SLOW) {
    const animation = this.create(duration, EASING.LINEAR);
    animation.rotate(degree).step();
    return animation.export();
  }

  /**
   * 脉冲动画
   * @param {number} scale - 缩放大小
   * @param {number} duration - 动画时长
   * @returns {Object}
   */
  static pulse (scale = 1.1, duration = DURATION.FAST) {
    const animation = this.create(duration, EASING.EASE_IN_OUT);
    animation.scale(scale).step({
      duration: duration / 2
    }).scale(1).step({
      duration: duration / 2
    });
    return animation.export();
  }

  /**
   * 弹跳动画
   * @param {number} height - 弹跳高度(rpx)
   * @param {number} duration - 动画时长
   * @returns {Object}
   */
  static bounce (height = 20, duration = DURATION.NORMAL) {
    const animation = this.create(duration, EASING.EASE_OUT);
    animation.translateY(-height).step({
      duration: duration / 3
    }).translateY(0).step({
      duration: duration / 3
    }).translateY(-height / 2).step({
      duration: duration / 6
    }).translateY(0).step({
      duration: duration / 6
    });
    return animation.export();
  }

  /**
   * 摇晃动画
   * @param {number} angle - 摇晃角度
   * @param {number} duration - 动画时长
   * @returns {Object}
   */
  static shake (angle = 10, duration = DURATION.NORMAL) {
    const animation = this.create(duration, EASING.EASE_IN_OUT);
    animation.rotate(angle).step({
      duration: duration / 6
    }).rotate(-angle).step({
      duration: duration / 6
    }).rotate(angle / 2).step({
      duration: duration / 6
    }).rotate(-angle / 2).step({
      duration: duration / 6
    }).rotate(0).step({
      duration: duration / 3
    });
    return animation.export();
  }

  /**
   * 呼吸动画（循环）
   * @param {Object} options - 配置选项
   * @returns {Function} 停止函数
   */
  static breathing (options = {}) {
    const {
      target,          // 目标元素（Page实例）
      dataKey,         // data中的key
      minOpacity = 0.3,
      maxOpacity = 1,
      duration = DURATION.SLOW
    } = options;

    let isRunning = true;
    const animate = () => {
      if (!isRunning) return;

      const animation1 = this.create(duration, EASING.EASE_IN_OUT);
      animation1.opacity(minOpacity).step();
      target.setData({ [dataKey]: animation1.export() });

      setTimeout(() => {
        if (!isRunning) return;
        const animation2 = this.create(duration, EASING.EASE_IN_OUT);
        animation2.opacity(maxOpacity).step();
        target.setData({ [dataKey]: animation2.export() });

        setTimeout(animate, duration);
      }, duration);
    };

    animate();

    // 返回停止函数
    return () => {
      isRunning = false;
    };
  }
}

/**
 * 预定义动画配置
 */
const PRESET_ANIMATIONS = {
  // 页面进入
  pageEnter: {
    name: '页面进入',
    type: 'slideInUp',
    duration: DURATION.NORMAL,
    easing: EASING.EASE_OUT
  },

  // 页面退出
  pageExit: {
    name: '页面退出',
    type: 'fadeOut',
    duration: DURATION.FAST,
    easing: EASING.EASE_IN
  },

  // 弹窗显示
  modalShow: {
    name: '弹窗显示',
    type: 'scaleIn',
    duration: DURATION.NORMAL,
    easing: EASING.EASE_OUT_BACK
  },

  // 弹窗隐藏
  modalHide: {
    name: '弹窗隐藏',
    type: 'scaleOut',
    duration: DURATION.FAST,
    easing: EASING.EASE_IN
  },

  // 卡片进入
  cardEnter: {
    name: '卡片进入',
    type: 'slideInUp',
    duration: DURATION.NORMAL,
    easing: EASING.EASE_OUT
  },

  // 按钮点击
  buttonClick: {
    name: '按钮点击',
    type: 'pulse',
    duration: DURATION.FAST,
    easing: EASING.EASE_IN_OUT
  },

  // 成功反馈
  successFeedback: {
    name: '成功反馈',
    type: 'bounce',
    duration: DURATION.NORMAL,
    easing: EASING.EASE_OUT
  },

  // 错误提示
  errorShake: {
    name: '错误提示',
    type: 'shake',
    duration: DURATION.NORMAL,
    easing: EASING.EASE_IN_OUT
  },

  // 加载中
  loading: {
    name: '加载中',
    type: 'rotate',
    duration: DURATION.SLOW,
    easing: EASING.LINEAR
  },

  // 小教练呼吸
  coachBreathing: {
    name: '小教练呼吸',
    type: 'breathing',
    duration: DURATION.SLOW,
    minOpacity: 0.8,
    maxOpacity: 1
  }
};

/**
 * CSS动画类名
 */
const CSS_ANIMATIONS = {
  // 淡入淡出
  FADE_IN: 'animate-fade-in',
  FADE_OUT: 'animate-fade-out',

  // 滑动
  SLIDE_IN_UP: 'animate-slide-in-up',
  SLIDE_IN_DOWN: 'animate-slide-in-down',
  SLIDE_IN_LEFT: 'animate-slide-in-left',
  SLIDE_IN_RIGHT: 'animate-slide-in-right',
  SLIDE_OUT_UP: 'animate-slide-out-up',
  SLIDE_OUT_DOWN: 'animate-slide-out-down',

  // 缩放
  SCALE_IN: 'animate-scale-in',
  SCALE_OUT: 'animate-scale-out',
  ZOOM_IN: 'animate-zoom-in',
  ZOOM_OUT: 'animate-zoom-out',

  // 旋转
  ROTATE: 'animate-rotate',
  ROTATE_IN: 'animate-rotate-in',
  ROTATE_OUT: 'animate-rotate-out',

  // 弹跳
  BOUNCE: 'animate-bounce',
  BOUNCE_IN: 'animate-bounce-in',

  // 摇晃
  SHAKE: 'animate-shake',
  SHAKE_X: 'animate-shake-x',
  SHAKE_Y: 'animate-shake-y',

  // 脉冲
  PULSE: 'animate-pulse',
  HEARTBEAT: 'animate-heartbeat',

  // 闪烁
  FLASH: 'animate-flash',
  BLINK: 'animate-blink',

  // 呼吸
  BREATHING: 'animate-breathing'
};

/**
 * 页面切换动画助手
 */
class PageTransition {
  /**
   * 执行页面进入动画
   * @param {Object} pageInstance - 页面实例
   * @param {string} animationDataKey - 动画数据key
   */
  static enter (pageInstance, animationDataKey = 'pageAnimation') {
    const animation = AnimationManager.slideInUp(50, DURATION.NORMAL);
    pageInstance.setData({
      [animationDataKey]: animation
    });
  }

  /**
   * 执行页面退出动画
   * @param {Object} pageInstance - 页面实例
   * @param {string} animationDataKey - 动画数据key
   * @param {Function} callback - 完成回调
   */
  static exit (pageInstance, animationDataKey = 'pageAnimation', callback) {
    const animation = AnimationManager.fadeOut(DURATION.FAST);
    pageInstance.setData({
      [animationDataKey]: animation
    });
    setTimeout(() => {
      callback && callback();
    }, DURATION.FAST);
  }
}

// 导出
module.exports = {
  DURATION,
  EASING,
  AnimationManager,
  PRESET_ANIMATIONS,
  CSS_ANIMATIONS,
  PageTransition
};
