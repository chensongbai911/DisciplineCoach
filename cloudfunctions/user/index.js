// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 用户管理云函数
 * 处理用户相关的所有操作
 */
exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()

  try {
    switch (action) {
      case 'login':
        return await login(event, wxContext)
      case 'getUserInfo':
        return await getUserInfo(event, wxContext)
      case 'updateUserInfo':
        return await updateUserInfo(event, wxContext)
      case 'updateSettings':
        return await updateSettings(event, wxContext)
      case 'checkMemberStatus':
        return await checkMemberStatus(event, wxContext)
      default:
        return {
          success: false,
          errMsg: `未知的操作类型: ${action}`
        }
    }
  } catch (err) {
    console.error('[云函数][user] 调用失败', err)
    return {
      success: false,
      errMsg: err.message || '操作失败'
    }
  }
}

/**
 * 用户登录
 * 首次登录创建用户记录，已有用户更新登录信息
 */
async function login (event, wxContext) {
  const { userInfo } = event
  const openid = wxContext.OPENID

  try {
    // 查询用户是否存在
    const userRes = await db.collection('users').where({
      _openid: openid
    }).get()

    const now = new Date()

    if (userRes.data.length === 0) {
      // 新用户，创建记录
      const newUser = {
        _openid: openid,
        nickName: userInfo?.nickName || '用户',
        avatarUrl: userInfo?.avatarUrl || '',
        gender: userInfo?.gender || 0,
        isVip: false,
        vipExpireDate: null,
        createTime: now,
        lastLoginTime: now,
        settings: {
          dailyReminder: true,
          reminderTime: '21:00',
          enableVibrate: true,
          enableSound: true
        },
        stats: {
          totalDays: 0,
          currentStreak: 0,
          maxStreak: 0,
          completionRate: 0
        }
      }

      const addRes = await db.collection('users').add({
        data: newUser
      })

      return {
        success: true,
        data: {
          _id: addRes._id,
          ...newUser,
          isNewUser: true
        }
      }
    } else {
      // 老用户，更新登录时间
      const user = userRes.data[0]

      await db.collection('users').doc(user._id).update({
        data: {
          lastLoginTime: now,
          ...(userInfo && {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            gender: userInfo.gender
          })
        }
      })

      return {
        success: true,
        data: {
          ...user,
          lastLoginTime: now,
          isNewUser: false
        }
      }
    }
  } catch (err) {
    console.error('[login] 登录失败', err)
    throw new Error('登录失败，请重试')
  }
}

/**
 * 获取用户信息
 */
async function getUserInfo (event, wxContext) {
  const openid = wxContext.OPENID

  try {
    const res = await db.collection('users').where({
      _openid: openid
    }).get()

    if (res.data.length === 0) {
      return {
        success: false,
        errMsg: '用户不存在'
      }
    }

    return {
      success: true,
      data: res.data[0]
    }
  } catch (err) {
    console.error('[getUserInfo] 获取用户信息失败', err)
    throw new Error('获取用户信息失败')
  }
}

/**
 * 更新用户信息
 */
async function updateUserInfo (event, wxContext) {
  const { nickName, avatarUrl, gender } = event
  const openid = wxContext.OPENID

  try {
    // 构建更新数据
    const updateData = {}
    if (nickName !== undefined) updateData.nickName = nickName
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl
    if (gender !== undefined) updateData.gender = gender

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        errMsg: '没有需要更新的数据'
      }
    }

    updateData.updateTime = new Date()

    const res = await db.collection('users').where({
      _openid: openid
    }).update({
      data: updateData
    })

    if (res.stats.updated === 0) {
      return {
        success: false,
        errMsg: '用户不存在'
      }
    }

    return {
      success: true,
      data: updateData
    }
  } catch (err) {
    console.error('[updateUserInfo] 更新用户信息失败', err)
    throw new Error('更新用户信息失败')
  }
}

/**
 * 更新用户设置
 */
async function updateSettings (event, wxContext) {
  const { dailyReminder, reminderTime, enableVibrate, enableSound } = event
  const openid = wxContext.OPENID

  try {
    // 构建更新数据
    const updateData = {}
    if (dailyReminder !== undefined) updateData['settings.dailyReminder'] = dailyReminder
    if (reminderTime !== undefined) updateData['settings.reminderTime'] = reminderTime
    if (enableVibrate !== undefined) updateData['settings.enableVibrate'] = enableVibrate
    if (enableSound !== undefined) updateData['settings.enableSound'] = enableSound

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        errMsg: '没有需要更新的设置'
      }
    }

    updateData.updateTime = new Date()

    const res = await db.collection('users').where({
      _openid: openid
    }).update({
      data: updateData
    })

    if (res.stats.updated === 0) {
      return {
        success: false,
        errMsg: '用户不存在'
      }
    }

    return {
      success: true,
      data: updateData
    }
  } catch (err) {
    console.error('[updateSettings] 更新设置失败', err)
    throw new Error('更新设置失败')
  }
}

/**
 * 检查会员状态
 */
async function checkMemberStatus (event, wxContext) {
  const openid = wxContext.OPENID

  try {
    const res = await db.collection('users').where({
      _openid: openid
    }).field({
      isVip: true,
      vipExpireDate: true
    }).get()

    if (res.data.length === 0) {
      return {
        success: false,
        errMsg: '用户不存在'
      }
    }

    const user = res.data[0]
    const now = new Date()

    // 检查会员是否过期
    let isVip = user.isVip
    if (isVip && user.vipExpireDate && new Date(user.vipExpireDate) < now) {
      // 会员已过期，更新状态
      await db.collection('users').doc(user._id).update({
        data: {
          isVip: false
        }
      })
      isVip = false
    }

    return {
      success: true,
      data: {
        isVip,
        expireDate: user.vipExpireDate ? formatDate(user.vipExpireDate) : ''
      }
    }
  } catch (err) {
    console.error('[checkMemberStatus] 检查会员状态失败', err)
    throw new Error('检查会员状态失败')
  }
}

/**
 * 格式化日期
 */
function formatDate (date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
