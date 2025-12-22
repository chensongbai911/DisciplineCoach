// pages/user/index.js
// 用户中心页 - 个人信息和设置

const app = getApp();
const { userAPI, statisticsAPI, exportAPI } = require('../../utils/api');
const { showToast, showLoading, hideLoading, copyToClipboard } = require('../../utils/common');
const { getStorage, setStorage } = require('../../utils/storage');

Page({
  data: {
    userInfo: {},
    totalDays: 0,
    streakDays: 0,
    memberStatus: {
      isVip: false,
      expireDate: ''
    },
    achievementCount: 0,
    reminderEnabled: true,
    version: '1.0.0',
    showContactModal: false
  },

  onLoad () {
    this.loadUserData();
  },

  onShow () {
    // 从其他页面返回时刷新数据
    this.loadUserData();
    this.checkMemberStatus();
  },

  /**
   * 加载用户数据
   */
  async loadUserData () {
    try {
      // 获取缓存的用户信息
      const cachedUserInfo = app.globalData.userInfo || getStorage('userInfo');

      if (cachedUserInfo) {
        this.setData({ userInfo: cachedUserInfo });
      }

      // 并行加载统计数据
      const [overview, badges] = await Promise.all([
        statisticsAPI.getOverview(),
        statisticsAPI.getBadges()
      ]);

      this.setData({
        totalDays: overview.totalDays || 0,
        streakDays: overview.currentStreak || 0,
        achievementCount: badges.filter(b => b.unlocked).length || 0
      });

      // 加载提醒设置
      const reminderEnabled = getStorage('reminderEnabled');
      if (reminderEnabled !== null) {
        this.setData({ reminderEnabled });
      }

    } catch (error) {
      console.error('加载用户数据失败:', error);
    }
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
   * 页面跳转
   */
  navigateTo (e) {
    const { url } = e.currentTarget.dataset;
    wx.navigateTo({ url });
  },

  /**
   * 跳转到会员中心
   */
  navigateToVip () {
    wx.navigateTo({
      url: '/pages/vip/index'
    });
  },

  /**
   * 处理提醒设置
   */
  handleReminder () {
    // 点击整行时不做处理，由开关本身控制
  },

  /**
   * 切换提醒开关
   */
  async handleReminderToggle (e) {
    const { value } = e.detail;

    try {
      if (value) {
        // 请求通知权限
        const setting = await wx.getSetting();

        if (!setting.authSetting['scope.subscribeMessage']) {
          // 请求订阅消息权限
          wx.requestSubscribeMessage({
            tmplIds: ['your_template_id'], // 替换为实际的模板ID
            success: (res) => {
              this.setData({ reminderEnabled: true });
              setStorage('reminderEnabled', true);
              showToast('提醒已开启', 'success');
            },
            fail: () => {
              this.setData({ reminderEnabled: false });
              showToast('请在设置中允许通知权限');
            }
          });
        } else {
          this.setData({ reminderEnabled: true });
          setStorage('reminderEnabled', true);
          showToast('提醒已开启', 'success');
        }
      } else {
        this.setData({ reminderEnabled: false });
        setStorage('reminderEnabled', false);
        showToast('提醒已关闭');
      }

      // 同步到服务器
      await userAPI.updateSettings({
        reminderEnabled: value
      });

    } catch (error) {
      console.error('更新提醒设置失败:', error);
      // 恢复原状态
      this.setData({ reminderEnabled: !value });
    }
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation () {
    // 阻止开关点击冒泡到menu-item
  },

  /**
   * 显示联系方式
   */
  handleContactUs () {
    this.setData({ showContactModal: true });
  },

  /**
   * 关闭联系方式弹窗
   */
  closeContactModal () {
    this.setData({ showContactModal: false });
  },

  /**
   * 复制微信号
   */
  handleCopyWechat () {
    copyToClipboard('discipline_coach');
  },

  /**
   * 复制邮箱
   */
  handleCopyEmail () {
    copyToClipboard('service@discipline.com');
  },

  /**
   * 数据导出
   */
  handleExport () {
    const { memberStatus } = this.data;

    // 检查会员权限
    if (!memberStatus.isVip) {
      wx.showModal({
        title: '会员功能',
        content: '数据导出为会员专享功能，开通会员后即可使用',
        confirmText: '去开通',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/vip/index'
            });
          }
        }
      });
      return;
    }

    // 显示导出选项
    wx.showActionSheet({
      itemList: ['导出Excel数据', '生成周报告', '生成月报告'],
      success: (res) => {
        const tapIndex = res.tapIndex;
        if (tapIndex === 0) {
          this.exportExcel();
        } else if (tapIndex === 1) {
          this.exportReport('weekly');
        } else if (tapIndex === 2) {
          this.exportReport('monthly');
        }
      }
    });
  },

  /**
   * 导出 Excel
   */
  async exportExcel () {
    try {
      // 选择日期范围
      const dates = await this.selectDateRange();
      if (!dates) return;

      showLoading('正在导出...');

      const result = await exportAPI.exportToExcel(
        dates.startDate,
        dates.endDate,
        []
      );

      hideLoading();

      if (result && result.excelData) {
        // 将数据转换为Excel格式并下载
        this.downloadExcelData(result.excelData, `打卡记录_${dates.startDate}_${dates.endDate}.xlsx`);

        showToast('导出成功');
      } else {
        showToast('导出失败，请重试');
      }

    } catch (error) {
      hideLoading();
      console.error('导出Excel失败:', error);
      showToast(error.message || '导出失败');
    }
  },

  /**
   * 导出报告
   */
  async exportReport (reportType) {
    try {
      // 计算日期范围
      const dates = this.calculateReportDateRange(reportType);

      showLoading('正在生成报告...');

      const result = await exportAPI.exportToPDF(
        dates.startDate,
        dates.endDate,
        reportType
      );

      hideLoading();

      if (result && result.reportData) {
        // 跳转到报告预览页
        wx.navigateTo({
          url: `/pages/report/preview?data=${encodeURIComponent(JSON.stringify(result.reportData))}`
        });
      } else {
        showToast('生成失败，请重试');
      }

    } catch (error) {
      hideLoading();
      console.error('生成报告失败:', error);
      showToast(error.message || '生成失败');
    }
  },

  /**
   * 选择日期范围
   */
  selectDateRange () {
    return new Promise((resolve) => {
      wx.showActionSheet({
        itemList: ['最近7天', '最近30天', '最近90天', '自定义'],
        success: (res) => {
          const today = new Date();
          let startDate, endDate = this.formatDate(today);

          if (res.tapIndex === 0) {
            // 最近7天
            startDate = this.formatDate(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000));
          } else if (res.tapIndex === 1) {
            // 最近30天
            startDate = this.formatDate(new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000));
          } else if (res.tapIndex === 2) {
            // 最近90天
            startDate = this.formatDate(new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000));
          } else {
            // 自定义（简化处理，默认最近30天）
            showToast('暂不支持自定义范围');
            startDate = this.formatDate(new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000));
          }

          resolve({ startDate, endDate });
        },
        fail: () => resolve(null)
      });
    });
  },

  /**
   * 计算报告日期范围
   */
  calculateReportDateRange (reportType) {
    const today = new Date();
    const endDate = this.formatDate(today);
    let startDate;

    if (reportType === 'weekly') {
      // 最近7天
      startDate = this.formatDate(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000));
    } else {
      // 最近30天
      startDate = this.formatDate(new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000));
    }

    return { startDate, endDate };
  },

  /**
   * 格式化日期
   */
  formatDate (date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 下载Excel数据（生成CSV格式）
   */
  downloadExcelData (data, filename) {
    if (!data || data.length === 0) {
      showToast('暂无数据');
      return;
    }

    // 转换为CSV格式
    const headers = Object.keys(data[0]);
    let csvContent = headers.join(',') + '\n';

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        // 处理包含逗号的字段
        return value.toString().includes(',') ? `"${value}"` : value;
      });
      csvContent += values.join(',') + '\n';
    });

    // 使用文件系统管理器保存文件
    const fs = wx.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/${filename}`;

    fs.writeFile({
      filePath,
      data: csvContent,
      encoding: 'utf8',
      success: () => {
        // 打开文档查看器
        wx.openDocument({
          filePath,
          fileType: 'xlsx',
          showMenu: true,
          success: () => {
            console.log('文件打开成功');
          },
          fail: (err) => {
            console.error('打开文件失败:', err);
            // 提供分享选项
            wx.showModal({
              title: '提示',
              content: '文件已保存，是否分享？',
              confirmText: '分享',
              success: (res) => {
                if (res.confirm) {
                  wx.shareFileMessage({
                    filePath,
                    success: () => showToast('分享成功'),
                    fail: () => showToast('分享失败')
                  });
                }
              }
            });
          }
        });
      },
      fail: (err) => {
        console.error('保存文件失败:', err);
        showToast('保存失败');
      }
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh () {
    Promise.all([
      this.loadUserData(),
      this.checkMemberStatus()
    ]).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 分享
   */
  onShareAppMessage () {
    return {
      title: '自律教练 - 让自律成为习惯',
      path: '/pages/index/index'
    };
  }
});
