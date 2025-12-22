// 云函数集成测试脚本
// 在微信开发者工具的控制台运行此脚本，验证所有云函数调用

/**
 * 测试 user.login 云函数
 */
async function testUserLogin () {
  console.log('====== 测试 user.login ======')
  try {
    const res = await wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'login'
      }
    })
    console.log('结果:', res.result)
    return res.result.success
  } catch (err) {
    console.error('错误:', err)
    return false
  }
}

/**
 * 测试 user.getUserInfo 云函数
 */
async function testGetUserInfo () {
  console.log('====== 测试 user.getUserInfo ======')
  try {
    const res = await wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'getUserInfo'
      }
    })
    console.log('结果:', res.result)
    return res.result.success
  } catch (err) {
    console.error('错误:', err)
    return false
  }
}

/**
 * 测试 plan.list 云函数
 */
async function testPlanList () {
  console.log('====== 测试 plan.list ======')
  try {
    const res = await wx.cloud.callFunction({
      name: 'plan',
      data: {
        action: 'list',
        params: {
          status: 'active'
        }
      }
    })
    console.log('结果:', res.result)
    return res.result.success
  } catch (err) {
    console.error('错误:', err)
    return false
  }
}

/**
 * 测试 plan.create 云函数
 */
async function testPlanCreate () {
  console.log('====== 测试 plan.create ======')
  try {
    const res = await wx.cloud.callFunction({
      name: 'plan',
      data: {
        action: 'create',
        title: '运动测试',
        category: 'exercise',
        targetType: 'duration',
        targetValue: 30,
        targetUnit: '分钟',
        reminderTime: '20:00',
        days: [1, 2, 3, 4, 5, 6, 0]
      }
    })
    console.log('结果:', res.result)
    if (res.result.success) {
      window.testPlanId = res.result.data._id
      console.log('保存的计划ID:', window.testPlanId)
    }
    return res.result.success
  } catch (err) {
    console.error('错误:', err)
    return false
  }
}

/**
 * 测试 record.getTodayRecords 云函数
 */
async function testGetTodayRecords () {
  console.log('====== 测试 record.getTodayRecords ======')
  try {
    const res = await wx.cloud.callFunction({
      name: 'record',
      data: {
        action: 'getTodayRecords'
      }
    })
    console.log('结果:', res.result)
    return res.result.success
  } catch (err) {
    console.error('错误:', err)
    return false
  }
}

/**
 * 测试 record.create 云函数
 */
async function testRecordCreate () {
  console.log('====== 测试 record.create ======')

  if (!window.testPlanId) {
    console.log('请先运行 testPlanCreate 创建计划')
    return false
  }

  try {
    const res = await wx.cloud.callFunction({
      name: 'record',
      data: {
        action: 'create',
        planId: window.testPlanId,
        actualValue: 35,
        remark: '测试打卡'
      }
    })
    console.log('结果:', res.result)
    return res.result.success
  } catch (err) {
    console.error('错误:', err)
    return false
  }
}

/**
 * 测试 statistics.getOverview 云函数
 */
async function testStatisticsOverview () {
  console.log('====== 测试 statistics.getOverview ======')
  try {
    const today = new Date()
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const formatDate = (date) => {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }

    const res = await wx.cloud.callFunction({
      name: 'statistics',
      data: {
        action: 'getOverview',
        dateRange: {
          startDate: formatDate(sevenDaysAgo),
          endDate: formatDate(today)
        }
      }
    })
    console.log('结果:', res.result)
    return res.result.success
  } catch (err) {
    console.error('错误:', err)
    return false
  }
}

/**
 * 测试 feedback.submit 云函数
 */
async function testFeedbackSubmit () {
  console.log('====== 测试 feedback.submit ======')
  try {
    const res = await wx.cloud.callFunction({
      name: 'feedback',
      data: {
        action: 'submit',
        feedbackData: {
          type: 'bug',
          content: '这是一条测试反馈',
          contactInfo: 'test@example.com',
          images: []
        }
      }
    })
    console.log('结果:', res.result)
    return res.result.success
  } catch (err) {
    console.error('错误:', err)
    return false
  }
}

/**
 * 运行所有测试
 */
async function runAllTests () {
  console.log('\n\n========== 开始运行所有测试 ==========\n')

  const results = {
    'user.login': await testUserLogin(),
    'user.getUserInfo': await testGetUserInfo(),
    'plan.list': await testPlanList(),
    'plan.create': await testPlanCreate(),
    'record.getTodayRecords': await testGetTodayRecords(),
    'record.create': await testRecordCreate(),
    'statistics.getOverview': await testStatisticsOverview(),
    'feedback.submit': await testFeedbackSubmit()
  }

  console.log('\n\n========== 测试结果总结 ==========\n')
  Object.entries(results).forEach(([test, success]) => {
    const status = success ? '✓ 通过' : '✗ 失败'
    console.log(`${test}: ${status}`)
  })

  const passCount = Object.values(results).filter(v => v).length
  const totalCount = Object.values(results).length
  console.log(`\n总计: ${passCount}/${totalCount} 通过\n`)

  return results
}

// 导出测试函数
window.cloudFunctionTests = {
  testUserLogin,
  testGetUserInfo,
  testPlanList,
  testPlanCreate,
  testGetTodayRecords,
  testRecordCreate,
  testStatisticsOverview,
  testFeedbackSubmit,
  runAllTests
}

console.log('云函数测试工具已加载')
console.log('使用方法:')
console.log('  - 运行单个测试: cloudFunctionTests.testUserLogin()')
console.log('  - 运行所有测试: cloudFunctionTests.runAllTests()')
