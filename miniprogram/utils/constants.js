/**
 * constants.js - 常量和配置管理
 * 集中管理应用的所有常量和配置
 */

// ============ 应用配置 ============
const APP_CONFIG = {
  VERSION: '1.0.0',
  BUILD_TIME: '2025-12-23',
  ENVIRONMENT: 'production', // production | development
  DEBUG: false
}

// ============ API配置 ============
const API_CONFIG = {
  REQUEST_TIMEOUT: 10000,      // 请求超时（毫秒）
  RETRY_TIMES: 2,              // 重试次数
  RETRY_DELAY: 1000            // 重试延迟（毫秒）
}

// ============ 缓存配置 ============
const CACHE_CONFIG = {
  ENABLED: true,
  VERSION: '1.0.0',
  KEYS: {
    USER_INFO: 'user_info',
    PLANS: 'plans_list',
    RECORDS: 'records',
    STATS: 'statistics',
    SETTINGS: 'user_settings'
  }
}

// ============ 任务分类 ============
const TASK_CATEGORIES = {
  EXERCISE: { key: 'exercise', name: '运动健身', icon: '🏃', color: '#FF6B6B' },
  DIET: { key: 'diet', name: '健康饮食', icon: '🥗', color: '#4ECDC4' },
  SLEEP: { key: 'sleep', name: '规律作息', icon: '😴', color: '#9B59B6' },
  READING: { key: 'reading', name: '阅读学习', icon: '📚', color: '#F39C12' },
  STUDY: { key: 'study', name: '技能提升', icon: '💻', color: '#3498DB' }
}

// ============ 任务类型 ============
const TASK_TYPES = {
  BOOLEAN: 'boolean',          // 是/否任务
  NUMERIC: 'numeric'           // 数值型任务
}

// ============ 成就徽章 ============
const ACHIEVEMENTS = [
  {
    id: 1,
    name: '初心',
    icon: '🌱',
    requirement: '完成第1次打卡',
    unlockCondition: 'totalDays >= 1'
  },
  {
    id: 2,
    name: '坚持',
    icon: '💪',
    requirement: '连续打卡7天',
    unlockCondition: 'currentStreak >= 7'
  },
  {
    id: 3,
    name: '恒心',
    icon: '🔥',
    requirement: '连续打卡30天',
    unlockCondition: 'currentStreak >= 30'
  },
  {
    id: 4,
    name: '百日',
    icon: '🏆',
    requirement: '连续打卡100天',
    unlockCondition: 'currentStreak >= 100'
  },
  {
    id: 5,
    name: '完美',
    icon: '💎',
    requirement: '单日完成率100%',
    unlockCondition: 'bestDayRate === 100'
  },
  {
    id: 6,
    name: '全能',
    icon: '🌟',
    requirement: '开启全部5个维度',
    unlockCondition: 'activeDimensions >= 5'
  }
]

// ============ 用户等级 ============
const USER_LEVELS = [
  { level: 1, name: '初学者', icon: '👶', minDays: 0, maxDays: 7 },
  { level: 2, name: '追梦者', icon: '🚴', minDays: 8, maxDays: 30 },
  { level: 3, name: '行动者', icon: '🏃', minDays: 31, maxDays: 100 },
  { level: 4, name: '坚持者', icon: '💪', minDays: 101, maxDays: 365 },
  { level: 5, name: '自律大师', icon: '👑', minDays: 366, maxDays: Infinity }
]

// ============ 用户排名 ============
const USER_RANKS = [
  { rank: '新手', icon: '🌱', minScore: 0, maxScore: 10 },
  { rank: '青铜', icon: '🥉', minScore: 10, maxScore: 50 },
  { rank: '白银', icon: '🥈', minScore: 50, maxScore: 150 },
  { rank: '黄金', icon: '🥇', minScore: 150, maxScore: 300 },
  { rank: '白金', icon: '💎', minScore: 300, maxScore: 500 },
  { rank: '钻石', icon: '👑', minScore: 500, maxScore: Infinity },
  { rank: '传奇', icon: '🌟', minScore: 1000, maxScore: Infinity }
]

// ============ 反馈类型 ============
const FEEDBACK_TYPES = {
  BUG: { key: 'bug', name: '问题报告', icon: '🐛' },
  FEATURE: { key: 'feature', name: '功能建议', icon: '✨' },
  IMPROVEMENT: { key: 'improvement', name: '改进意见', icon: '📝' },
  OTHER: { key: 'other', name: '其他反馈', icon: '💬' }
}

// ============ 提醒配置 ============
const REMINDER_CONFIG = {
  // 提醒模板ID（需在微信后台配置）
  TEMPLATES: {
    DAILY_REMINDER: 'YOUR_DAILY_REMINDER_ID',
    STREAK_WARNING: 'YOUR_STREAK_WARNING_ID',
    WEEKLY_SUMMARY: 'YOUR_WEEKLY_SUMMARY_ID',
    ACHIEVEMENT_UNLOCK: 'YOUR_ACHIEVEMENT_ID'
  },

  // 提醒时间建议
  SUGGESTED_TIMES: [
    { hour: 6, minute: 0, name: '早晨' },
    { hour: 9, minute: 0, name: '上午' },
    { hour: 12, minute: 0, name: '中午' },
    { hour: 15, minute: 0, name: '下午' },
    { hour: 18, minute: 0, name: '傍晚' },
    { hour: 21, minute: 0, name: '晚间' }
  ],

  // 缓存过期时间（毫秒）
  CACHE_EXPIRE: {
    SHORT: 5 * 60 * 1000,           // 5分钟
    MEDIUM: 30 * 60 * 1000,         // 30分钟
    LONG: 60 * 60 * 1000,           // 1小时
    VERY_LONG: 24 * 60 * 60 * 1000  // 1天
  }
}

// ============ 性能阈值 ============
const PERFORMANCE_THRESHOLDS = {
  PAGE_LOAD: 1000,      // 页面加载
  API_CALL: 2000,       // API调用
  IMAGE_LOAD: 3000,     // 图片加载
  RENDER: 500           // 渲染耗时
}

// ============ 错误代码 ============
const ERROR_CODES = {
  SUCCESS: 0,
  NETWORK_ERROR: 1001,
  AUTH_FAILED: 1002,
  PERMISSION_DENIED: 1003,
  DATA_NOT_FOUND: 1004,
  DATA_INVALID: 1005,
  SERVER_ERROR: 1006,
  TIMEOUT: 1007,
  UNKNOWN: 9999
}

// ============ 特征开关 ============
const FEATURE_FLAGS = {
  ENABLE_STATISTICS_CHART: true,     // 启用统计图表
  ENABLE_DATA_EXPORT: true,          // 启用数据导出
  ENABLE_SOCIAL_SHARE: true,         // 启用社交分享
  ENABLE_OFFLINE_MODE: true,         // 启用离线模式
  ENABLE_DARK_MODE: false,           // 启用深色模式
  ENABLE_CUSTOM_LOADING: true        // 启用自定义加载
}

// ============ 日期和时间格式 ============
const DATE_TIME_FORMAT = {
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  MONTH: 'YYYY-MM',
  YEAR: 'YYYY'
}

// ============ 颜色主题 ============
const COLOR_THEME = {
  PRIMARY: '#4FD1C5',
  SECONDARY: '#3182CE',
  SUCCESS: '#07C160',
  WARNING: '#FF9800',
  ERROR: '#F44336',
  INFO: '#2196F3',

  // 文字颜色
  TEXT_PRIMARY: '#1F2937',
  TEXT_SECONDARY: '#6B7280',
  TEXT_TERTIARY: '#9CA3AF',

  // 背景颜色
  BG_PRIMARY: '#FFFFFF',
  BG_SECONDARY: '#F9FAFB',
  BG_TERTIARY: '#F3F4F6',

  // 边框颜色
  BORDER: '#E5E7EB'
}

module.exports = {
  APP_CONFIG,
  API_CONFIG,
  CACHE_CONFIG,
  TASK_CATEGORIES,
  TASK_TYPES,
  ACHIEVEMENTS,
  USER_LEVELS,
  USER_RANKS,
  FEEDBACK_TYPES,
  REMINDER_CONFIG,
  PERFORMANCE_THRESHOLDS,
  ERROR_CODES,
  FEATURE_FLAGS,
  DATE_TIME_FORMAT,
  COLOR_THEME
}
