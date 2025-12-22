// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 支付管理云函数
 * 处理会员订单和支付相关操作
 */
exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()

  try {
    switch (action) {
      case 'createOrder':
        return await createOrder(event, wxContext)
      case 'getOrderList':
        return await getOrderList(event, wxContext)
      case 'getOrderDetail':
        return await getOrderDetail(event, wxContext)
      case 'unifiedOrder':
        return await unifiedOrder(event, wxContext)
      case 'queryOrder':
        return await queryOrder(event, wxContext)
      case 'handlePaymentNotify':
        return await handlePaymentNotify(event, wxContext)
      default:
        return {
          success: false,
          errMsg: `未知的操作类型: ${action}`
        }
    }
  } catch (err) {
    console.error('[云函数][payment] 调用失败', err)
    return {
      success: false,
      errMsg: err.message || '操作失败'
    }
  }
}

/**
 * 创建订单
 */
async function createOrder (event, wxContext) {
  const { orderType, price, duration } = event.orderData || {}
  const openid = wxContext.OPENID

  // 参数验证
  if (!orderType || !price || !duration) {
    return {
      success: false,
      errMsg: '缺少必要参数'
    }
  }

  try {
    const now = new Date()

    // 生成订单号
    const orderNo = generateOrderNo()

    // 创建订单记录
    const newOrder = {
      _openid: openid,
      orderNo: orderNo,
      orderType: orderType, // monthly, quarterly, yearly
      price: price,
      duration: duration, // 月数
      status: 'pending', // pending, paid, expired, refunded
      paymentMethod: '',
      transactionId: '',
      createTime: now,
      updateTime: now,
      expireTime: new Date(now.getTime() + 30 * 60 * 1000) // 30分钟后过期
    }

    const res = await db.collection('orders').add({
      data: newOrder
    })

    return {
      success: true,
      data: {
        _id: res._id,
        orderNo: orderNo,
        ...newOrder
      }
    }
  } catch (err) {
    console.error('[createOrder] 创建订单失败', err)
    throw new Error('创建订单失败')
  }
}

/**
 * 获取订单列表
 */
async function getOrderList (event, wxContext) {
  const { status } = event
  const openid = wxContext.OPENID

  try {
    // 构建查询条件
    const where = { _openid: openid }
    if (status) {
      where.status = status
    }

    const res = await db.collection('orders')
      .where(where)
      .orderBy('createTime', 'desc')
      .get()

    return {
      success: true,
      data: res.data
    }
  } catch (err) {
    console.error('[getOrderList] 获取订单列表失败', err)
    throw new Error('获取订单列表失败')
  }
}

/**
 * 获取订单详情
 */
async function getOrderDetail (event, wxContext) {
  const { orderNo } = event
  const openid = wxContext.OPENID

  if (!orderNo) {
    return {
      success: false,
      errMsg: '缺少订单号'
    }
  }

  try {
    const res = await db.collection('orders').where({
      _openid: openid,
      orderNo: orderNo
    }).get()

    if (res.data.length === 0) {
      return {
        success: false,
        errMsg: '订单不存在或无权访问'
      }
    }

    return {
      success: true,
      data: res.data[0]
    }
  } catch (err) {
    console.error('[getOrderDetail] 获取订单详情失败', err)
    throw new Error('获取订单详情失败')
  }
}

/**
 * 统一下单
 * 调用微信支付接口
 */
async function unifiedOrder (event, wxContext) {
  const { orderNo } = event
  const openid = wxContext.OPENID

  if (!orderNo) {
    return {
      success: false,
      errMsg: '缺少订单号'
    }
  }

  try {
    // 获取订单信息
    const orderRes = await db.collection('orders').where({
      _openid: openid,
      orderNo: orderNo
    }).get()

    if (orderRes.data.length === 0) {
      return {
        success: false,
        errMsg: '订单不存在'
      }
    }

    const order = orderRes.data[0]

    // 检查订单状态
    if (order.status !== 'pending') {
      return {
        success: false,
        errMsg: '订单状态不正确'
      }
    }

    // 检查订单是否过期
    if (new Date() > new Date(order.expireTime)) {
      await db.collection('orders').doc(order._id).update({
        data: {
          status: 'expired',
          updateTime: new Date()
        }
      })
      return {
        success: false,
        errMsg: '订单已过期'
      }
    }

    // 调用微信支付统一下单接口
    // 注意：实际项目需要配置支付参数和证书
    const paymentResult = await cloud.cloudPay.unifiedOrder({
      body: getOrderTypeName(order.orderType),
      outTradeNo: order.orderNo,
      spbillCreateIp: '127.0.0.1',
      subMchId: '', // 子商户号，如有需要
      totalFee: order.price * 100, // 单位：分
      envId: cloud.DYNAMIC_CURRENT_ENV,
      functionName: 'payment', // 支付回调云函数
      nonceStr: getNonceStr(),
      tradeType: 'JSAPI',
      openid: openid
    })

    return {
      success: true,
      data: paymentResult
    }
  } catch (err) {
    console.error('[unifiedOrder] 统一下单失败', err)

    // 微信支付错误处理
    if (err.errCode) {
      return {
        success: false,
        errMsg: `支付失败: ${err.errMsg || err.errCode}`
      }
    }

    throw new Error('统一下单失败')
  }
}

/**
 * 查询订单支付状态
 */
async function queryOrder (event, wxContext) {
  const { orderNo } = event
  const openid = wxContext.OPENID

  if (!orderNo) {
    return {
      success: false,
      errMsg: '缺少订单号'
    }
  }

  try {
    // 查询本地订单状态
    const orderRes = await db.collection('orders').where({
      _openid: openid,
      orderNo: orderNo
    }).get()

    if (orderRes.data.length === 0) {
      return {
        success: false,
        errMsg: '订单不存在'
      }
    }

    const order = orderRes.data[0]

    // 如果已支付，直接返回
    if (order.status === 'paid') {
      return {
        success: true,
        data: {
          status: 'paid',
          order: order
        }
      }
    }

    // 调用微信支付查询接口
    try {
      const queryResult = await cloud.cloudPay.queryOrder({
        outTradeNo: order.orderNo
      })

      if (queryResult.tradeState === 'SUCCESS') {
        // 更新订单状态
        await updateOrderAfterPayment(order._id, queryResult.transactionId, openid)

        return {
          success: true,
          data: {
            status: 'paid',
            transactionId: queryResult.transactionId
          }
        }
      } else {
        return {
          success: true,
          data: {
            status: order.status,
            tradeState: queryResult.tradeState
          }
        }
      }
    } catch (queryErr) {
      // 查询失败，返回本地状态
      return {
        success: true,
        data: {
          status: order.status
        }
      }
    }
  } catch (err) {
    console.error('[queryOrder] 查询订单失败', err)
    throw new Error('查询订单失败')
  }
}

/**
 * 处理支付回调通知
 */
async function handlePaymentNotify (event, wxContext) {
  const { orderNo, transactionId, resultCode } = event

  if (!orderNo || !transactionId) {
    return {
      success: false,
      errMsg: '缺少必要参数'
    }
  }

  try {
    // 查询订单
    const orderRes = await db.collection('orders').where({
      orderNo: orderNo
    }).get()

    if (orderRes.data.length === 0) {
      return {
        success: false,
        errMsg: '订单不存在'
      }
    }

    const order = orderRes.data[0]

    // 支付成功
    if (resultCode === 'SUCCESS') {
      await updateOrderAfterPayment(order._id, transactionId, order._openid)

      return {
        success: true,
        data: {
          returnCode: 'SUCCESS',
          returnMsg: 'OK'
        }
      }
    } else {
      // 支付失败
      await db.collection('orders').doc(order._id).update({
        data: {
          status: 'failed',
          updateTime: new Date()
        }
      })

      return {
        success: false,
        errMsg: '支付失败'
      }
    }
  } catch (err) {
    console.error('[handlePaymentNotify] 处理支付回调失败', err)
    throw new Error('处理支付回调失败')
  }
}

/**
 * 支付成功后更新订单和用户会员状态
 */
async function updateOrderAfterPayment (orderId, transactionId, openid) {
  try {
    const now = new Date()

    // 更新订单状态
    const orderRes = await db.collection('orders').doc(orderId).get()
    const order = orderRes.data

    await db.collection('orders').doc(orderId).update({
      data: {
        status: 'paid',
        transactionId: transactionId,
        paymentTime: now,
        updateTime: now
      }
    })

    // 获取用户当前会员状态
    const userRes = await db.collection('users').where({
      _openid: openid
    }).get()

    if (userRes.data.length === 0) {
      throw new Error('用户不存在')
    }

    const user = userRes.data[0]
    let newExpireDate

    // 计算新的过期时间
    if (user.isVip && user.vipExpireDate && new Date(user.vipExpireDate) > now) {
      // 在原有基础上续期
      const currentExpire = new Date(user.vipExpireDate)
      newExpireDate = new Date(currentExpire.getTime() + order.duration * 30 * 24 * 60 * 60 * 1000)
    } else {
      // 从当前时间开始计算
      newExpireDate = new Date(now.getTime() + order.duration * 30 * 24 * 60 * 60 * 1000)
    }

    // 更新用户会员状态
    await db.collection('users').doc(user._id).update({
      data: {
        isVip: true,
        vipExpireDate: newExpireDate,
        updateTime: now
      }
    })

    console.log('[updateOrderAfterPayment] 订单和会员状态更新成功', {
      orderId,
      openid,
      newExpireDate
    })
  } catch (err) {
    console.error('[updateOrderAfterPayment] 更新失败', err)
    throw err
  }
}

/**
 * 生成订单号
 */
function generateOrderNo () {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD${timestamp}${random}`
}

/**
 * 生成随机字符串
 */
function getNonceStr () {
  return Math.random().toString(36).substr(2, 15)
}

/**
 * 获取订单类型名称
 */
function getOrderTypeName (orderType) {
  const nameMap = {
    monthly: '自律教练-月度会员',
    quarterly: '自律教练-季度会员',
    yearly: '自律教练-年度会员'
  }
  return nameMap[orderType] || '自律教练-会员服务'
}
