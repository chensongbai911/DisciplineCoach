// app.js
const { userAPI } = require('./utils/api.js')
const theme = require('./utils/theme.js')
const monitor = require('./utils/monitor.js')

App({
  globalData: {
    userInfo: null,
    openid: null,
    isMember: false,
    memberExpireAt: null,
    isOnline: true, // 网络状态
    networkType: 'unknown', // 网络类型
    preloadComplete: false, // 预加载完成标识
    cachedPlans: null, // 缓存的计划列表
    cachedStats: null, // 缓存的统计数据
    cacheTimestamp: {}, // 缓存时间戳
    theme: 'light', // 当前主题 (light | dark)
    isDarkMode: false // 是否深色模式
  },

  onLaunch: function () {
    console.log('自律教练小程序启动')

    // 初始化监控系统
    monitor.init({
      enabled: true,
      sampleRate: 1.0,
      autoReport: true,
      reportInterval: 60000
    });

    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-0g29mlsv3d4ca637', // 云环境ID
        traceUser: true
      })
    }

    // 初始化主题管理
    theme.init();

    // 监听网络状态变化
    this.initNetworkMonitor();

    // 延迟加载字体,避免阻塞启动
    setTimeout(() => {
      this.loadIconFont();
    }, 500);

    // 预加载关键图片资源
    this.preloadImages();

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

      // 用户信息加载完成后，预加载业务数据
      this.preloadData();
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
  },

  /**
   * 预加载图片资源
   * 预加载小教练表情和常用图标，提升页面打开速度
   */
  preloadImages () {
    if (!this.globalData.isOnline) {
      console.log('[preload] 离线状态，跳过图片预加载');
      return;
    }

    const images = [
      '/assets/images/coach-happy.webp',
      '/assets/images/coach-sad.webp',
      '/assets/images/coach-encourage.webp',
      '/assets/images/coach-thinking.webp'
    ];

    console.log('[preload] 开始预加载图片资源');

    images.forEach(src => {
      wx.getImageInfo({
        src,
        success: () => console.log(`[preload] 图片预加载成功: ${src}`),
        fail: (err) => console.warn(`[preload] 图片预加载失败: ${src}`, err)
      });
    });
  },  /**
   * 预加载业务数据
   * 在后台预加载计划和统计数据，减少页面等待时间
   */
  async preloadData () {
    if (!this.globalData.isOnline) {
      console.log('[preload] 离线状态，跳过数据预加载');
      return;
    }

    console.log('[preload] 开始预加载业务数据');

    try {
      // 并行预加载计划列表和统计数据
      const [plansRes, statsRes] = await Promise.allSettled([
        wx.cloud.callFunction({ name: 'plan', data: { action: 'list' } }),
        wx.cloud.callFunction({ name: 'statistics', data: { action: 'overview' } })
      ]);

      // 缓存计划数据
      if (plansRes.status === 'fulfilled' && plansRes.value?.result?.success) {
        this.globalData.cachedPlans = plansRes.value.result.data;
        this.globalData.cacheTimestamp.plans = Date.now();
        console.log('[preload] 计划数据预加载成功');
      }

      // 缓存统计数据
      if (statsRes.status === 'fulfilled' && statsRes.value?.result?.success) {
        this.globalData.cachedStats = statsRes.value.result.data;
        this.globalData.cacheTimestamp.stats = Date.now();
        console.log('[preload] 统计数据预加载成功');
      }

      this.globalData.preloadComplete = true;
      console.log('[preload] 数据预加载完成');

    } catch (err) {
      console.warn('[preload] 数据预加载失败', err);
    }
  },

  /**
   * 获取缓存数据
   * @param {string} key - 缓存键名 (plans/stats)
   * @param {number} maxAge - 最大缓存时间（毫秒），默认5分钟
   * @returns {Object|null} 缓存的数据或null
   */
  getCachedData (key, maxAge = 5 * 60 * 1000) {
    const cacheKey = `cached${key.charAt(0).toUpperCase() + key.slice(1)}`;
    const data = this.globalData[cacheKey];
    const timestamp = this.globalData.cacheTimestamp[key];

    if (!data || !timestamp) {
      return null;
    }

    // 检查缓存是否过期
    if (Date.now() - timestamp > maxAge) {
      console.log(`[cache] ${key} 缓存已过期`);
      return null;
    }

    console.log(`[cache] 使用 ${key} 缓存数据`);
    return data;
  },

  /**
   * 更新缓存数据
   * @param {string} key - 缓存键名
   * @param {*} data - 要缓存的数据
   */
  setCachedData (key, data) {
    const cacheKey = `cached${key.charAt(0).toUpperCase() + key.slice(1)}`;
    this.globalData[cacheKey] = data;
    this.globalData.cacheTimestamp[key] = Date.now();
    console.log(`[cache] 更新 ${key} 缓存`);
  },

  /**
   * 获取缓存时间戳
   * @param {string} key - 缓存键名
   * @returns {number|null} 缓存时间戳，如果不存在返回 null
   */
  getCachedDataTime (key) {
    return this.globalData.cacheTimestamp[key] || null;
  },

  /**
   * 清除指定缓存
   * @param {string} key - 缓存键名，不传则清除所有缓存
   */
  clearCache (key) {
    if (key) {
      const cacheKey = `cached${key.charAt(0).toUpperCase() + key.slice(1)}`;
      this.globalData[cacheKey] = null;
      delete this.globalData.cacheTimestamp[key];
      console.log(`[cache] 清除 ${key} 缓存`);
    } else {
      this.globalData.cachedPlans = null;
      this.globalData.cachedStats = null;
      this.globalData.cacheTimestamp = {};
      console.log('[cache] 清除所有缓存');
    }
  }
})
