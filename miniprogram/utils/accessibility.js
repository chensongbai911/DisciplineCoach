/**
 * 无障碍辅助工具
 * 提供屏幕阅读器支持、键盘导航等无障碍功能
 *
 * @module utils/accessibility
 * @version 1.0.0
 * @since 2025-12-23
 */

/**
 * ARIA 角色定义
 */
const ARIA_ROLES = {
  BUTTON: 'button',
  LINK: 'link',
  HEADING: 'heading',
  LIST: 'list',
  LISTITEM: 'listitem',
  NAVIGATION: 'navigation',
  MAIN: 'main',
  COMPLEMENTARY: 'complementary',
  SEARCH: 'search',
  FORM: 'form',
  DIALOG: 'dialog',
  ALERT: 'alert',
  STATUS: 'status',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  TABLIST: 'tablist'
};

/**
 * 颜色对比度计算
 * 符合 WCAG 2.1 标准
 */
class ColorContrastChecker {
  /**
   * 计算相对亮度
   * @param {string} color - 十六进制颜色值
   * @returns {number} 相对亮度 (0-1)
   */
  static getRelativeLuminance (color) {
    // 移除 # 号
    color = color.replace('#', '');

    // 转换为 RGB
    const r = parseInt(color.substr(0, 2), 16) / 255;
    const g = parseInt(color.substr(2, 2), 16) / 255;
    const b = parseInt(color.substr(4, 2), 16) / 255;

    // 计算亮度
    const R = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const G = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const B = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }

  /**
   * 计算对比度
   * @param {string} color1 - 前景色
   * @param {string} color2 - 背景色
   * @returns {number} 对比度 (1-21)
   */
  static getContrastRatio (color1, color2) {
    const l1 = this.getRelativeLuminance(color1);
    const l2 = this.getRelativeLuminance(color2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * 检查是否符合 WCAG AA 标准
   * @param {string} color1 - 前景色
   * @param {string} color2 - 背景色
   * @param {number} fontSize - 字体大小 (px)
   * @returns {boolean}
   */
  static meetsWCAG_AA (color1, color2, fontSize = 14) {
    const ratio = this.getContrastRatio(color1, color2);
    // 大文本 (18px+) 需要 3:1，普通文本需要 4.5:1
    const requiredRatio = fontSize >= 18 ? 3 : 4.5;
    return ratio >= requiredRatio;
  }

  /**
   * 检查是否符合 WCAG AAA 标准
   * @param {string} color1 - 前景色
   * @param {string} color2 - 背景色
   * @param {number} fontSize - 字体大小 (px)
   * @returns {boolean}
   */
  static meetsWCAG_AAA (color1, color2, fontSize = 14) {
    const ratio = this.getContrastRatio(color1, color2);
    // 大文本 (18px+) 需要 4.5:1，普通文本需要 7:1
    const requiredRatio = fontSize >= 18 ? 4.5 : 7;
    return ratio >= requiredRatio;
  }
}

/**
 * 屏幕阅读器支持
 */
class ScreenReaderSupport {
  /**
   * 生成 ARIA 标签
   * @param {string} text - 标签文本
   * @param {string} role - ARIA 角色
   * @returns {Object} ARIA 属性对象
   */
  static generateAriaLabel (text, role = null) {
    const attrs = {
      'aria-label': text
    };
    if (role) {
      attrs.role = role;
    }
    return attrs;
  }

  /**
   * 生成按钮的 ARIA 属性
   * @param {string} label - 按钮标签
   * @param {boolean} disabled - 是否禁用
   * @returns {Object}
   */
  static buttonAria (label, disabled = false) {
    return {
      role: ARIA_ROLES.BUTTON,
      'aria-label': label,
      'aria-disabled': disabled ? 'true' : 'false'
    };
  }

  /**
   * 生成链接的 ARIA 属性
   * @param {string} label - 链接标签
   * @param {string} url - 链接地址
   * @returns {Object}
   */
  static linkAria (label, url = '') {
    return {
      role: ARIA_ROLES.LINK,
      'aria-label': label,
      'aria-describedby': url
    };
  }

  /**
   * 生成表单输入的 ARIA 属性
   * @param {string} label - 输入框标签
   * @param {boolean} required - 是否必填
   * @param {boolean} invalid - 是否无效
   * @returns {Object}
   */
  static inputAria (label, required = false, invalid = false) {
    const attrs = {
      'aria-label': label,
      'aria-required': required ? 'true' : 'false'
    };
    if (invalid) {
      attrs['aria-invalid'] = 'true';
    }
    return attrs;
  }

  /**
   * 生成对话框的 ARIA 属性
   * @param {string} label - 对话框标题
   * @param {string} description - 描述
   * @returns {Object}
   */
  static dialogAria (label, description = '') {
    return {
      role: ARIA_ROLES.DIALOG,
      'aria-label': label,
      'aria-describedby': description,
      'aria-modal': 'true'
    };
  }

  /**
   * 生成实时区域的 ARIA 属性
   * @param {string} politeness - 礼貌级别 (polite | assertive | off)
   * @returns {Object}
   */
  static liveRegionAria (politeness = 'polite') {
    return {
      'aria-live': politeness,
      'aria-atomic': 'true'
    };
  }
}

/**
 * 键盘导航支持
 */
class KeyboardNavigation {
  /**
   * Tab键顺序定义
   */
  static TAB_ORDER = {
    AUTO: 0,      // 自动
    FIRST: 1,     // 第一个
    NORMAL: 0,    // 正常顺序
    LAST: 999,    // 最后一个
    SKIP: -1      // 跳过
  };

  /**
   * 生成 tabindex 属性
   * @param {number} order - Tab 顺序
   * @returns {Object}
   */
  static tabIndex (order = 0) {
    return {
      tabindex: order
    };
  }

  /**
   * 处理键盘事件
   * @param {Object} event - 事件对象
   * @param {Object} handlers - 处理函数映射
   */
  static handleKeyPress (event, handlers = {}) {
    const keyCode = event.keyCode || event.which;
    const key = event.key;

    // Enter键
    if (keyCode === 13 || key === 'Enter') {
      handlers.onEnter && handlers.onEnter(event);
    }
    // 空格键
    else if (keyCode === 32 || key === ' ') {
      handlers.onSpace && handlers.onSpace(event);
    }
    // Esc键
    else if (keyCode === 27 || key === 'Escape') {
      handlers.onEscape && handlers.onEscape(event);
    }
    // Tab键
    else if (keyCode === 9 || key === 'Tab') {
      handlers.onTab && handlers.onTab(event);
    }
    // 方向键
    else if ([37, 38, 39, 40].includes(keyCode) || ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(key)) {
      handlers.onArrow && handlers.onArrow(event, key);
    }
  }
}

/**
 * 焦点管理
 */
class FocusManager {
  /**
   * 获取可聚焦元素
   * @param {Object} container - 容器元素
   * @returns {Array} 可聚焦元素数组
   */
  static getFocusableElements (container) {
    const selector = [
      'button',
      'input',
      'textarea',
      'select',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    // 微信小程序不支持 querySelectorAll
    // 这里仅作为示例，实际使用需要适配
    return [];
  }

  /**
   * 陷阱焦点在对话框内
   * @param {Object} dialogElement - 对话框元素
   */
  static trapFocus (dialogElement) {
    // 微信小程序焦点管理示例
    // 实际使用需要根据框架适配
  }

  /**
   * 恢复焦点
   * @param {Object} element - 元素
   */
  static restoreFocus (element) {
    // 恢复之前的焦点
  }
}

/**
 * 文本替代
 */
class TextAlternatives {
  /**
   * 为图标生成文本描述
   * @param {string} iconType - 图标类型
   * @returns {string}
   */
  static getIconDescription (iconType) {
    const descriptions = {
      'bell': '提醒',
      'calendar': '日历',
      'chart': '统计',
      'trophy': '成就',
      'vip': '会员',
      'settings': '设置',
      'delete': '删除',
      'edit': '编辑',
      'add': '添加',
      'close': '关闭',
      'info': '信息',
      'warning': '警告',
      'error': '错误',
      'success': '成功',
      'check': '完成',
      'home': '首页',
      'user': '个人',
      'plan': '计划',
      'record': '记录'
    };
    return descriptions[iconType] || iconType;
  }

  /**
   * 为emoji生成文本描述
   * @param {string} emoji - emoji字符
   * @returns {string}
   */
  static getEmojiDescription (emoji) {
    const descriptions = {
      '🏃': '运动',
      '🥗': '饮食',
      '😴': '睡眠',
      '📚': '阅读',
      '📝': '学习',
      '✨': '特别',
      '👑': '会员',
      '🎉': '庆祝',
      '💪': '加油',
      '❤️': '喜欢',
      '👍': '点赞',
      '🔥': '火热',
      '⭐': '星星',
      '🎯': '目标'
    };
    return descriptions[emoji] || '';
  }
}

// 导出
module.exports = {
  ARIA_ROLES,
  ColorContrastChecker,
  ScreenReaderSupport,
  KeyboardNavigation,
  FocusManager,
  TextAlternatives
};
