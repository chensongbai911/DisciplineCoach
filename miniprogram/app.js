// app.js
const { userAPI } = require('./utils/api.js')

App({
  globalData: {
    userInfo: null,
    openid: null,
    isMember: false,
    memberExpireAt: null,
    isOnline: true, // 网络状态
    networkType: 'unknown' // 网络类型
  },

  onLaunch: function () {
    console.log('自律教练小程序启动')

    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-0g29mlsv3d4ca637', // 云环境ID
        traceUser: true
      })
    }

    // 监听网络状态变化
    this.initNetworkMonitor();

    // 延迟加载字体,避免阻塞启动
    setTimeout(() => {
      this.loadIconFont();
    }, 500);

    // 检查登录状态
    console.log('[app.js] 检查登录状态')
    this.checkLogin()
  },

  /**
   * 加载 iconfont 字体
   */
  loadIconFont () {
    // 检查网络状态
    if (!this.globalData.isOnline) {
      console.log('[iconfont] 离线状态，跳过字体加载');
      return;
    }

    // 加载 iconfont 字体（使用阿里 CDN WOFF2 格式，失败则忽略，保持 PNG/emoji 兜底）
    try {
      const fontUrl = '/assets/fonts/iconfont.woff2';

      wx.loadFontFace({
        family: 'iconfont',
        source: `url("${fontUrl}")`,
        global: true,
        success: () => {
          console.log('[iconfont] 本地字体加载成功');
        },
        fail: (err) => {
          console.warn('[iconfont] 本地字体加载失败，使用兜底图标', err.errMsg);
          // 字体加载失败不影响功能，组件会自动降级到 PNG/emoji
        }
      });
    } catch (e) {
      console.warn('[iconfont] 加载异常，使用兜底图标', e);
    }
  },

  /**
   * 初始化网络监听
   */
  initNetworkMonitor () {
    // 获取当前网络状态
    wx.getNetworkType({
      success: (res) => {
        const isOnline = res.networkType !== 'none';
        this.globalData.isOnline = isOnline;
        this.globalData.networkType = res.networkType;
        console.log('[网络监听] 当前网络状态:', res.networkType, isOnline ? '在线' : '离线');
      }
    });

    // 监听网络状态变化
    wx.onNetworkStatusChange((res) => {
      const isOnline = res.isConnected;
      this.globalData.isOnline = isOnline;
      this.globalData.networkType = res.networkType;

      console.log('[网络监听] 网络状态变化:', res.networkType, isOnline ? '在线' : '离线');

      // 显示提示
      if (isOnline) {
        wx.showToast({
          title: '网络已恢复',
          icon: 'success',
          duration: 2000
        });
      } else {
        wx.showToast({
          title: '网络已断开',
          icon: 'error',
          duration: 2000
        });
      }

      // 通知所有页面刷新网络状态
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (currentPage && typeof currentPage.onNetworkChange === 'function') {
        currentPage.onNetworkChange(isOnline, res.networkType);
      }
    });
  },

  // 检查登录状态
  checkLogin () {
    const openid = wx.getStorageSync('openid')
    if (openid) {
      this.globalData.openid = openid
      this.getUserInfo()
    } else {
      this.login()
    }
  },

  // 登录
  login () {
    wx.showLoading({ title: '登录中...' })

    userAPI.login()
      .then(user => {
        wx.hideLoading()
        if (!user) {
          throw new Error('登录返回空用户数据')
        }

        // 统一写入全局与本地存储
        this.globalData.openid = user._openid || ''
        this.updateUserInfo(user)
        wx.setStorageSync('openid', this.globalData.openid)
        wx.setStorageSync('userInfo', user)

        console.log('[app.js] 登录成功', this.globalData.openid)
      })
      .catch(err => {
        wx.hideLoading()
        console.error('[app.js] 登录失败', err)
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        })
      })
  },

  // 获取用户信息
  getUserInfo () {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
      // 兼容新旧字段
      this.globalData.isMember = (userInfo.isVip !== undefined) ? userInfo.isVip : (userInfo.is_member || false)
      this.globalData.memberExpireAt = userInfo.vipExpireDate || userInfo.member_expire_at || null
    }
  },

  // 更新用户信息
  updateUserInfo (userInfo) {
    this.globalData.userInfo = userInfo
    // 兼容新旧字段
    this.globalData.isMember = (userInfo.isVip !== undefined) ? userInfo.isVip : (userInfo.is_member || false)
    this.globalData.memberExpireAt = userInfo.vipExpireDate || userInfo.member_expire_at || null
    wx.setStorageSync('userInfo', userInfo)
  },

  // 检查会员状态
  checkMemberStatus () {
    const { isMember, memberExpireAt } = this.globalData

    if (!isMember) {
      return { isVip: false, expireDate: '' }
    }

    // 检查是否过期
    if (memberExpireAt && new Date(memberExpireAt) < new Date()) {
      this.globalData.isMember = false
      return { isVip: false, expireDate: '' }
    }

    // 格式化过期日期
    const expireDate = memberExpireAt
      ? new Date(memberExpireAt).toLocaleDateString('zh-CN')
      : ''

    return { isVip: true, expireDate }
  }
})
