// utils/cache.js
// 数据缓存管理工具

const { getStorage, setStorage, removeStorage } = require('./storage');

/**
 * 缓存管理类
 */
class CacheManager {
  constructor() {
    this.defaultTTL = 5 * 60 * 1000; // 默认5分钟过期
  }

  /**
   * 设置缓存
   * @param {string} key 缓存键
   * @param {any} data 缓存数据
   * @param {number} ttl 过期时间(毫秒),默认5分钟
   */
  set (key, data, ttl = this.defaultTTL) {
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl
    };
    setStorage(key, cacheData);
  }

  /**
   * 获取缓存
   * @param {string} key 缓存键
   * @returns {any|null} 缓存数据,过期或不存在返回null
   */
  get (key) {
    const cacheData = getStorage(key);

    if (!cacheData) {
      return null;
    }

    const { data, timestamp, ttl } = cacheData;
    const now = Date.now();

    // 检查是否过期
    if (now - timestamp > ttl) {
      this.remove(key);
      return null;
    }

    return data;
  }

  /**
   * 删除缓存
   * @param {string} key 缓存键
   */
  remove (key) {
    removeStorage(key);
  }

  /**
   * 清空所有缓存
   */
  clear () {
    try {
      wx.clearStorageSync();
    } catch (e) {
      console.error('清空缓存失败:', e);
    }
  }

  /**
   * 检查缓存是否有效
   * @param {string} key 缓存键
   * @returns {boolean}
   */
  isValid (key) {
    return this.get(key) !== null;
  }

  /**
   * 获取缓存剩余时间
   * @param {string} key 缓存键
   * @returns {number} 剩余毫秒数,-1表示不存在或已过期
   */
  getRemaining (key) {
    const cacheData = getStorage(key);

    if (!cacheData) {
      return -1;
    }

    const { timestamp, ttl } = cacheData;
    const now = Date.now();
    const elapsed = now - timestamp;
    const remaining = ttl - elapsed;

    return remaining > 0 ? remaining : -1;
  }
}

// 预定义的缓存键
const CACHE_KEYS = {
  // 首页数据
  INDEX_PLANS: 'cache_index_plans',
  INDEX_RECORDS: 'cache_index_records',
  INDEX_STREAK: 'cache_index_streak',

  // 统计数据
  STATS_OVERVIEW: 'cache_stats_overview',
  STATS_TREND: 'cache_stats_trend',

  // 用户信息
  USER_INFO: 'cache_user_info',
  MEMBER_STATUS: 'cache_member_status',

  // 计划列表
  PLAN_LIST: 'cache_plan_list',

  // 成就数据
  ACHIEVEMENTS: 'cache_achievements'
};

// 导出单例
const cacheManager = new CacheManager();

module.exports = {
  cacheManager,
  CACHE_KEYS
};
