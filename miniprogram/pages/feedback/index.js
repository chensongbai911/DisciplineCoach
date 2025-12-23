// pages/feedback/index.js
// 意见反馈页

const { feedbackAPI } = require('../../utils/api');
const { showToast, showLoading, hideLoading, chooseImage } = require('../../utils/common');
const { validateFeedback } = require('../../utils/validator');
const { formatDate } = require('../../utils/date');
const vibrate = require('../../utils/vibrate');

// 反馈类型映射
const TYPE_MAP = {
  'bug': '问题反馈',
  'feature': '功能建议',
  'other': '其他'
};

// 状态映射
const STATUS_MAP = {
  'pending': '待处理',
  'processing': '处理中',
  'resolved': '已解决',
  'closed': '已关闭'
};

Page({
  data: {
    feedbackType: 'bug',
    content: '',
    images: [],
    contact: '',
    historyList: [],

    // 验证规则
    contentRules: {
      required: true,
      minLength: 10,
      maxLength: 500,
      label: '反馈内容'
    }
  },

  onLoad () {
    this.loadHistory();
  },

  onShow () {
    this.loadHistory();
  },

  /**
   * 加载历史反馈
   */
  async loadHistory () {
    try {
      const list = await feedbackAPI.list();
      const processedList = list.map(item => ({
        ...item,
        typeName: TYPE_MAP[item.type] || item.type,
        statusName: STATUS_MAP[item.status] || item.status,
        createTime: formatDate(new Date(item.createdAt))
      }));

      this.setData({ historyList: processedList });
    } catch (error) {
      console.error('加载反馈历史失败:', error);
    }
  },

  /**
   * 切换反馈类型
   */
  handleTypeChange (e) {
    const { type } = e.currentTarget.dataset;
    this.setData({ feedbackType: type });
  },

  /**
   * 输入反馈内容
   */
  handleContentChange (e) {
    this.setData({ content: e.detail.value });
  },

  /**
   * 输入联系方式
   */
  handleContactChange (e) {
    this.setData({ contact: e.detail.value });
  },

  /**
   * 选择图片
   */
  async handleChooseImage () {
    try {
      const count = 3 - this.data.images.length;
      const tempFilePaths = await chooseImage(count);

      showLoading('上传中...');

      // 上传图片到云存储
      const uploadPromises = tempFilePaths.map(filePath => {
        return wx.cloud.uploadFile({
          cloudPath: `feedback/${Date.now()}_${Math.random().toString(36).substr(2)}.jpg`,
          filePath
        });
      });

      const results = await Promise.all(uploadPromises);
      const cloudPaths = results.map(res => res.fileID);

      this.setData({
        images: [...this.data.images, ...cloudPaths]
      });

      hideLoading();
      showToast('上传成功', 'success');

    } catch (error) {
      console.error('上传图片失败:', error);
      hideLoading();
      showToast('上传失败，请重试');
    }
  },

  /**
   * 删除图片
   */
  handleDeleteImage (e) {
    // 删除图片警告震动
    vibrate.warning();

    const { index } = e.currentTarget.dataset;
    const images = this.data.images.filter((_, i) => i !== index);
    this.setData({ images });
  },

  /**
   * 提交反馈
   */
  async handleSubmit () {
    // 按钮点击轻微震动
    vibrate.light();

    const { feedbackType, content, images, contact } = this.data;

    // 验证
    const validation = validateFeedback({ type: feedbackType, content });
    if (!validation.valid) {
      showToast(validation.message);
      return;
    }

    try {
      showLoading('提交中...');

      await feedbackAPI.submit({
        type: feedbackType,
        content,
        images,
        contact
      });

      hideLoading();
      vibrate.success();
      showToast('提交成功，感谢您的反馈！', 'success');

      // 重置表单
      this.setData({
        feedbackType: 'bug',
        content: '',
        images: [],
        contact: ''
      });

      // 刷新历史记录
      this.loadHistory();

    } catch (error) {
      console.error('提交反馈失败:', error);
      hideLoading();
      showToast('提交失败，请重试');
    }
  },

  /**
   * 查看反馈详情
   */
  viewFeedbackDetail (e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/feedback/detail?id=${id}`
    });
  }
});
