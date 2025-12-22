// app.js
const { userAPI } = require('./utils/api.js')

App({
  globalData: {
    userInfo: null,
    openid: null,
    isMember: false,
    memberExpireAt: null
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

    // 加载 iconfont 字体（使用阿里 CDN WOFF2 格式，失败则忽略，保持 PNG/emoji 兜底）
    try {
      const fontUrl = 'https://at.alicdn.com/t/c/font_5094872_60e7nx4r6mr.woff2?t=1766394531251'
      wx.loadFontFace({
        family: 'iconfont',
        source: `url("${fontUrl}")`,
        global: true,
        success: () => console.log('[iconfont] 字体加载成功'),
        fail: (e) => console.warn('[iconfont] 字体加载失败，使用兜底', e)
      })
    } catch (e) {
      console.warn('[iconfont] 加载异常，使用兜底', e)
    }

    // 检查登录状态
    console.log('[app.js] 检查登录状态')
    this.checkLogin()
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
