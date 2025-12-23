/**
 * 主题管理工具
 * 支持亮色模式和深色模式的切换
 *
 * @module utils/theme
 * @version 1.0.0
 * @since 2025-12-23
 */

const { getStorage, setStorage } = require('./storage');
const THEME_STORAGE_KEY = 'theme_preference';

/**
 * 主题类型枚举
 */
const THEME_TYPE = {
  AUTO: 'auto',    // 跟随系统
  LIGHT: 'light',  // 亮色模式
  DARK: 'dark'     // 深色模式
};

/**
 * 主题管理类
 */
class ThemeManager {
  constructor() {
    this.currentTheme = THEME_TYPE.AUTO;
    this.systemTheme = 'light'; // 默认系统主题
    this.listeners = []; // 主题变化监听器
  }

  /**
   * 初始化主题
   * 在 app.js onLaunch 中调用
   */
  init () {
    // 1. 读取用户偏好
    const savedTheme = getStorage(THEME_STORAGE_KEY);
    if (savedTheme && Object.values(THEME_TYPE).includes(savedTheme)) {
      this.currentTheme = savedTheme;
    }

    // 2. 检测系统主题
    this.detectSystemTheme();

    // 3. 应用主题
    this.applyTheme();

    // 4. 监听系统主题变化
    this.watchSystemTheme();

    console.log('[ThemeManager] 初始化完成', {
      userPreference: this.currentTheme,
      systemTheme: this.systemTheme,
      actualTheme: this.getActualTheme()
    });
  }

  /**
   * 检测系统主题偏好
   */
  detectSystemTheme () {
    try {
      const systemInfo = wx.getSystemInfoSync();
      // 微信小程序基础库 2.11.0+ 支持 theme 属性
      if (systemInfo.theme) {
        this.systemTheme = systemInfo.theme;
      } else {
        // 降级为亮色模式
        this.systemTheme = 'light';
      }
    } catch (error) {
      console.error('[ThemeManager] 检测系统主题失败', error);
      this.systemTheme = 'light';
    }
  }

  /**
   * 监听系统主题变化
   */
  watchSystemTheme () {
    // 微信小程序提供的 API
    wx.onThemeChange && wx.onThemeChange((res) => {
      console.log('[ThemeManager] 系统主题变化:', res.theme);
      this.systemTheme = res.theme;

      // 如果用户设置为跟随系统，则应用新主题
      if (this.currentTheme === THEME_TYPE.AUTO) {
        this.applyTheme();
        this.notifyListeners();
      }
    });
  }

  /**
   * 获取实际应用的主题
   * @returns {string} 'light' 或 'dark'
   */
  getActualTheme () {
    if (this.currentTheme === THEME_TYPE.AUTO) {
      return this.systemTheme;
    }
    return this.currentTheme;
  }

  /**
   * 设置主题
   * @param {string} theme - THEME_TYPE.AUTO | THEME_TYPE.LIGHT | THEME_TYPE.DARK
   */
  setTheme (theme) {
    if (!Object.values(THEME_TYPE).includes(theme)) {
      console.error('[ThemeManager] 无效的主题类型:', theme);
      return false;
    }

    console.log('[ThemeManager] 切换主题:', theme);
    this.currentTheme = theme;

    // 保存用户偏好
    setStorage(THEME_STORAGE_KEY, theme);

    // 应用主题
    this.applyTheme();

    // 通知监听器
    this.notifyListeners();

    return true;
  }

  /**
   * 应用主题到全局
   */
  applyTheme () {
    const actualTheme = this.getActualTheme();

    // 设置全局 data 属性，用于条件渲染
    const app = getApp();
    if (app) {
      app.globalData.theme = actualTheme;
      app.globalData.isDarkMode = (actualTheme === 'dark');
    }

    // 通过 CSS 类控制主题（如果需要）
    // 注意：微信小程序不支持操作 document，这里仅用于记录
    console.log('[ThemeManager] 主题已应用:', actualTheme);
  }

  /**
   * 切换主题（亮色<->深色）
   * 仅在当前主题为 light 或 dark 时有效
   */
  toggleTheme () {
    if (this.currentTheme === THEME_TYPE.LIGHT) {
      this.setTheme(THEME_TYPE.DARK);
    } else if (this.currentTheme === THEME_TYPE.DARK) {
      this.setTheme(THEME_TYPE.LIGHT);
    } else {
      // 如果是 auto，则切换为与当前系统主题相反的主题
      const actualTheme = this.getActualTheme();
      this.setTheme(actualTheme === 'light' ? THEME_TYPE.DARK : THEME_TYPE.LIGHT);
    }
  }

  /**
   * 添加主题变化监听器
   * @param {Function} callback - 回调函数 (theme) => {}
   */
  addListener (callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  /**
   * 移除主题变化监听器
   * @param {Function} callback - 回调函数
   */
  removeListener (callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 通知所有监听器
   */
  notifyListeners () {
    const actualTheme = this.getActualTheme();
    this.listeners.forEach(callback => {
      try {
        callback(actualTheme);
      } catch (error) {
        console.error('[ThemeManager] 监听器执行错误:', error);
      }
    });
  }

  /**
   * 获取当前用户偏好
   * @returns {string} auto | light | dark
   */
  getUserPreference () {
    return this.currentTheme;
  }

  /**
   * 判断是否为深色模式
   * @returns {boolean}
   */
  isDarkMode () {
    return this.getActualTheme() === 'dark';
  }

  /**
   * 判断是否为亮色模式
   * @returns {boolean}
   */
  isLightMode () {
    return this.getActualTheme() === 'light';
  }

  /**
   * 获取主题配置
   * 返回当前主题的颜色配置（用于动态样式）
   */
  getThemeConfig () {
    const isDark = this.isDarkMode();

    return {
      // 主色系
      primary: isDark ? '#1AC158' : '#07C160',
      primaryLight: isDark ? '#2ACB6F' : '#B7F4D6',
      primaryDark: isDark ? '#0FA850' : '#029E6D',

      // 文本色
      textPrimary: isDark ? '#F5F5F5' : '#333333',
      textSecondary: isDark ? '#B0B0B0' : '#666666',
      textTertiary: isDark ? '#808080' : '#999999',
      textDisabled: isDark ? '#505050' : '#CCCCCC',

      // 背景色
      bgPrimary: isDark ? '#1A1A1A' : '#FFFFFF',
      bgSecondary: isDark ? '#2A2A2A' : '#F7F8FA',
      bgTertiary: isDark ? '#3A3A3A' : '#EFEFEF',
      bgLight: isDark ? '#141414' : '#FAFBFC',

      // 边框色
      borderLight: isDark ? '#404040' : '#E8E8E8',
      borderMedium: isDark ? '#505050' : '#D8D8D8',
      borderDark: isDark ? '#606060' : '#C8C8C8',

      // 功能色
      success: isDark ? '#1AC158' : '#07C160',
      warning: isDark ? '#FFA500' : '#FF9500',
      error: isDark ? '#FF6B6B' : '#FA5151',
      info: isDark ? '#5DADE2' : '#10AEFF',
    };
  }
}

// 创建单例
const themeManager = new ThemeManager();

// 导出
module.exports = {
  THEME_TYPE,
  themeManager,

  // 便捷方法
  init: () => themeManager.init(),
  setTheme: (theme) => themeManager.setTheme(theme),
  toggleTheme: () => themeManager.toggleTheme(),
  getActualTheme: () => themeManager.getActualTheme(),
  getUserPreference: () => themeManager.getUserPreference(),
  isDarkMode: () => themeManager.isDarkMode(),
  isLightMode: () => themeManager.isLightMode(),
  getThemeConfig: () => themeManager.getThemeConfig(),
  addListener: (callback) => themeManager.addListener(callback),
  removeListener: (callback) => themeManager.removeListener(callback),
};
