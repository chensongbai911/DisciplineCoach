// pages/vip/index.js
// 会员中心页 - VIP权益和购买

const app = getApp();
const { paymentAPI } = require('../../utils/api');
const { showToast, showLoading, hideLoading, showModal } = require('../../utils/common');

// 会员权益配置
const BENEFITS = [
  { id: 1, icon: '🎨', name: '个性化主题', description: '多种主题风格自由切换' },
  { id: 2, icon: '📊', name: '高级统计', description: '更详细的数据分析报告' },
  { id: 3, icon: '☁️', name: '云端备份', description: '数据自动备份，永不丢失' },
  { id: 4, icon: '🏆', name: '专属徽章', description: '解锁VIP专属成就徽章' },
  { id: 5, icon: '🔔', name: '智能提醒', description: '更智能的打卡提醒功能' },
  { id: 6, icon: '💬', name: '优先客服', description: '专属客服通道，快速响应' }
];

// 套餐配置
const PLANS = [
  {
    id: 1,
    duration: '月卡',
    price: 18,
    originalPrice: null,
    dailyPrice: '0.6',
    features: ['解锁全部权益', '30天有效期'],
    recommended: false
  },
  {
    id: 2,
    duration: '季卡',
    price: 45,
    originalPrice: 54,
    dailyPrice: '0.5',
    features: ['解锁全部权益', '90天有效期', '赠送7天体验'],
    recommended: true
  },
  {
    id: 3,
    duration: '年卡',
    price: 128,
    originalPrice: 216,
    dailyPrice: '0.35',
    features: ['解锁全部权益', '365天有效期', '赠送30天体验', '优先新功能体验'],
    recommended: false
  }
];

// 常见问题
const FAQS = [
  {
    id: 1,
    question: '会员可以退款吗？',
    answer: '开通后7天内未使用任何会员功能，可申请全额退款。使用后恕不支持退款。',
    expanded: false
  },
  {
    id: 2,
    question: '会员到期后数据会丢失吗？',
    answer: '不会。会员到期后您的所有数据仍会保留，只是部分高级功能将无法使用。',
    expanded: false
  },
  {
    id: 3,
    question: '支持哪些支付方式？',
    answer: '目前支持微信支付。我们会尽快支持更多支付方式。',
    expanded: false
  },
  {
    id: 4,
    question: '会员可以转让吗？',
    answer: '会员权益与账号绑定，不支持转让或共享。',
    expanded: false
  }
];

Page({
  data: {
    memberStatus: {
      isVip: false,
      expireDate: ''
    },
    benefits: BENEFITS,
    plans: PLANS,
    selectedPlan: 2, // 默认选择季卡
    currentPlanPrice: 45,
    agreedTerms: false,
    faqs: FAQS
  },

  onLoad () {
    this.checkMemberStatus();
  },

  onShow () {
    this.checkMemberStatus();
  },

  /**
   * 检查会员状态
   */
  async checkMemberStatus () {
    try {
      const memberStatus = await app.checkMemberStatus();
      this.setData({ memberStatus });
    } catch (error) {
      console.error('检查会员状态失败:', error);
    }
  },

  /**
   * 选择套餐
   */
  handleSelectPlan (e) {
    const { id } = e.currentTarget.dataset;
    const plan = this.data.plans.find(p => p.id === id);

    this.setData({
      selectedPlan: id,
      currentPlanPrice: plan.price
    });
  },

  /**
   * 处理购买/续费按钮
   */
  handlePurchase () {
    if (this.data.memberStatus.isVip) {
      // 已是会员，滚动到套餐选择区域
      wx.pageScrollTo({
        selector: '.plans-section',
        duration: 300
      });
    } else {
      // 未开通，滚动到套餐选择
      wx.pageScrollTo({
        selector: '.plans-section',
        duration: 300
      });
    }
  },

  /**
   * 确认购买
   */
  async handleConfirmPurchase () {
    // 检查是否同意协议
    if (!this.data.agreedTerms) {
      showToast('请先阅读并同意会员服务协议');
      return;
    }

    const { selectedPlan, plans } = this.data;
    const plan = plans.find(p => p.id === selectedPlan);

    try {
      showLoading('正在创建订单...');

      // 创建订单
      const order = await paymentAPI.createOrder({
        type: 'vip',
        planId: selectedPlan,
        amount: plan.price
      });

      hideLoading();

      // 调起微信支付
      await this.requestPayment(order);

    } catch (error) {
      console.error('购买失败:', error);
      showToast('购买失败，请重试');
    } finally {
      hideLoading();
    }
  },

  /**
   * 调起微信支付
   */
  async requestPayment (order) {
    return new Promise((resolve, reject) => {
      wx.requestPayment({
        timeStamp: order.timeStamp,
        nonceStr: order.nonceStr,
        package: order.package,
        signType: 'MD5',
        paySign: order.paySign,
        success: async (res) => {
          showToast('支付成功', 'success');

          // 刷新会员状态
          await this.checkMemberStatus();

          // 显示成功提示
          showModal({
            title: '开通成功',
            content: '恭喜你成为VIP会员，尽情享受专属权益吧！',
            showCancel: false
          });

          resolve(res);
        },
        fail: (err) => {
          if (err.errMsg === 'requestPayment:fail cancel') {
            showToast('支付已取消');
          } else {
            showToast('支付失败');
          }
          reject(err);
        }
      });
    });
  },

  /**
   * 同意协议
   */
  handleAgreeChange (e) {
    this.setData({
      agreedTerms: e.detail.value.length > 0
    });
  },

  /**
   * 查看协议
   */
  viewTerms (e) {
    e.stopPropagation();
    wx.navigateTo({
      url: '/pages/about/terms?type=vip'
    });
  },

  /**
   * 切换FAQ展开状态
   */
  toggleFaq (e) {
    const { id } = e.currentTarget.dataset;
    const faqs = this.data.faqs.map(faq => {
      if (faq.id === id) {
        return { ...faq, expanded: !faq.expanded };
      }
      return faq;
    });
    this.setData({ faqs });
  },

  /**
   * 分享
   */
  onShareAppMessage () {
    return {
      title: '自律教练VIP - 让自律成为习惯',
      path: '/pages/vip/index'
    };
  }
});
