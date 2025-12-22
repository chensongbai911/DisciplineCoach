// components/empty-state/index.js
// 空状态通用组件

// 预设场景配置
const EMPTY_CONFIGS = {
  'no-plan': {
    emoji: '📝',
    title: '还没有计划',
    desc: '创建你的第一个自律计划吧',
    actionText: '创建计划',
    actionEvent: 'createPlan'
  },
  'no-record': {
    emoji: '📅',
    title: '暂无打卡记录',
    desc: '完成今日任务开始记录吧',
    actionText: '去打卡',
    actionEvent: 'goCheckin'
  },
  'no-statistics': {
    emoji: '📊',
    title: '暂无统计数据',
    desc: '坚持打卡7天后查看数据分析',
    actionText: '了解更多',
    actionEvent: 'learnMore'
  },
  'no-achievement': {
    emoji: '🏆',
    title: '还未获得成就',
    desc: '完成更多任务解锁专属成就',
    actionText: '查看成就',
    actionEvent: 'viewAchievements'
  },
  'no-friend': {
    emoji: '👥',
    title: '还没有好友',
    desc: '邀请好友一起自律打卡',
    actionText: '邀请好友',
    actionEvent: 'inviteFriend'
  },
  'search-empty': {
    emoji: '🔍',
    title: '没有找到相关内容',
    desc: '试试其他关键词吧',
    actionText: '清除搜索',
    actionEvent: 'clearSearch'
  },
  'network-error': {
    emoji: '📡',
    title: '网络连接失败',
    desc: '请检查网络设置后重试',
    actionText: '重新加载',
    actionEvent: 'reload'
  },
  'no-permission': {
    emoji: '🔒',
    title: '暂无访问权限',
    desc: '升级会员解锁更多功能',
    actionText: '升级会员',
    actionEvent: 'upgradeMember'
  }
};

Component({
  properties: {
    // 场景类型
    type: {
      type: String,
      value: 'no-plan'
    },
    // 自定义配置（会覆盖预设）
    config: {
      type: Object,
      value: null
    },
    // 是否显示
    show: {
      type: Boolean,
      value: true
    },
    // 是否显示操作按钮
    showAction: {
      type: Boolean,
      value: true
    }
  },

  data: {
    emoji: '📝',
    title: '',
    desc: '',
    actionText: '',
    actionEvent: ''
  },

  lifetimes: {
    attached () {
      this.updateContent();
    }
  },

  observers: {
    'type, config': function () {
      this.updateContent();
    }
  },

  methods: {
    /**
     * 更新内容
     */
    updateContent () {
      const { type, config } = this.properties;

      // 获取预设配置
      const presetConfig = EMPTY_CONFIGS[type] || EMPTY_CONFIGS['no-plan'];

      // 合并自定义配置
      const finalConfig = config ? { ...presetConfig, ...config } : presetConfig;

      this.setData({
        emoji: finalConfig.emoji,
        title: finalConfig.title,
        desc: finalConfig.desc,
        actionText: finalConfig.actionText,
        actionEvent: finalConfig.actionEvent
      });
    },

    /**
     * 点击操作按钮
     */
    handleAction () {
      const { actionEvent } = this.data;
      this.triggerEvent('action', { type: actionEvent });
    }
  }
});
