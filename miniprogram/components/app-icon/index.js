const FALLBACK_MAP = {
  'arrow-down': '▼',
  'check': '✓',
  'add': '+',
  'edit': '✏️',
  'trash': '🗑️',
  'vip': '👑',
  'bell': '🔔',
  'calendar': '📅',
  'chart': '📊',
  'trophy': '🏆',
  'info': 'ℹ️',
  'phone': '📞',
  'wechat': '💬',
  'email': '📧',
  'timer': '⏱',
  'number': '🔢',
  'clock': '🕐',
  'circle': '○'
}

Component({
  properties: {
    type: { type: String, value: 'info' },
    size: { type: Number, value: 28 },
    radius: { type: Number, value: 0 },
    mode: { type: String, value: 'aspectFit' },
    customStyle: { type: String, value: '' }
  },
  data: {
    fallback: 'ℹ️',
    glyph: '' // 字体字符（如 \ue600）
  },
  lifetimes: {
    attached () {
      this.updateGlyph()
    }
  },
  observers: {
    'type': function () {
      this.updateGlyph()
    }
  },
  methods: {
    updateGlyph () {
      try {
        const map = require('../../icons/iconfont.map.json')
        const code = map[this.properties.type]
        const fb = FALLBACK_MAP[this.properties.type] || 'ℹ️'
        this.setData({
          fallback: fb,
          glyph: code ? String.fromCharCode(parseInt(code.replace('\\u', ''), 16)) : ''
        })
      } catch (e) {
        const fb = FALLBACK_MAP[this.properties.type] || 'ℹ️'
        this.setData({ fallback: fb, glyph: '' })
      }
    }
  }
})
