// components/form-input/index.js
// 表单输入组件 - 支持实时验证

const { validateField } = require('../../utils/validator');

Component({
  properties: {
    // 输入框类型
    type: {
      type: String,
      value: 'text' // text | number | digit | textarea
    },
    // 字段名
    name: {
      type: String,
      value: ''
    },
    // 标签
    label: {
      type: String,
      value: ''
    },
    // 占位符
    placeholder: {
      type: String,
      value: ''
    },
    // 值
    value: {
      type: String,
      value: ''
    },
    // 验证规则
    rules: {
      type: Object,
      value: {}
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    },
    // 最大长度
    maxlength: {
      type: Number,
      value: 140
    },
    // textarea行数
    rows: {
      type: Number,
      value: 3
    }
  },

  data: {
    // 验证状态: '' | 'validating' | 'success' | 'error'
    validateStatus: '',
    // 错误信息
    errorMessage: '',
    // 是否显示字数统计
    showCount: false,
    // 当前字数
    currentLength: 0
  },

  lifetimes: {
    attached () {
      this.setData({
        currentLength: this.properties.value.length,
        showCount: this.properties.type === 'textarea'
      });
    }
  },

  observers: {
    'value': function (newValue) {
      this.setData({
        currentLength: newValue ? newValue.length : 0
      });
    }
  },

  methods: {
    /**
     * 输入事件
     */
    handleInput (e) {
      const value = e.detail.value;

      // 触发input事件
      this.triggerEvent('input', {
        name: this.properties.name,
        value
      });

      // 实时验证（如果有规则）
      if (this.properties.rules && Object.keys(this.properties.rules).length > 0) {
        this.validateValue(value);
      }
    },

    /**
     * 失焦事件
     */
    handleBlur (e) {
      const value = e.detail.value;

      // 失焦时验证
      if (this.properties.rules && Object.keys(this.properties.rules).length > 0) {
        this.validateValue(value);
      }

      this.triggerEvent('blur', {
        name: this.properties.name,
        value
      });
    },

    /**
     * 聚焦事件
     */
    handleFocus (e) {
      // 聚焦时清除错误状态
      if (this.data.validateStatus === 'error') {
        this.setData({ validateStatus: '' });
      }

      this.triggerEvent('focus', {
        name: this.properties.name
      });
    },

    /**
     * 验证值
     */
    validateValue (value) {
      const { name, rules } = this.properties;

      // 显示验证中状态
      this.setData({ validateStatus: 'validating' });

      // 延迟验证，避免频繁触发
      if (this.validateTimer) {
        clearTimeout(this.validateTimer);
      }

      this.validateTimer = setTimeout(() => {
        const result = validateField(name, value, rules);

        if (result.valid) {
          this.setData({
            validateStatus: 'success',
            errorMessage: ''
          });
        } else {
          this.setData({
            validateStatus: 'error',
            errorMessage: result.message
          });
        }

        // 触发验证事件
        this.triggerEvent('validate', {
          name,
          valid: result.valid,
          message: result.message
        });
      }, 300);
    },

    /**
     * 外部调用验证
     */
    validate () {
      const { name, value, rules } = this.properties;

      if (!rules || Object.keys(rules).length === 0) {
        return { valid: true };
      }

      const result = validateField(name, value, rules);

      this.setData({
        validateStatus: result.valid ? 'success' : 'error',
        errorMessage: result.valid ? '' : result.message
      });

      return result;
    },

    /**
     * 清除验证状态
     */
    clearValidate () {
      this.setData({
        validateStatus: '',
        errorMessage: ''
      });
    }
  }
});
