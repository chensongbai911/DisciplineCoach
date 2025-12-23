/**
 * export.js - 数据导出工具
 * 支持导出为JSON、CSV等格式
 */

const { showToast, showLoading, hideLoading } = require('./common.js')

/**
 * 导出数据为JSON
 * @param {Array} data - 要导出的数据
 * @param {string} filename - 文件名
 * @returns {Promise<string>} 临时文件路径
 */
async function exportJSON (data, filename = 'data.json') {
  try {
    showLoading('导出中...')

    const jsonString = JSON.stringify(data, null, 2)
    const timestamp = new Date().toISOString().split('T')[0]
    const fullFilename = `${filename.replace('.json', '')}_${timestamp}.json`

    // 保存到本地文件
    const fs = wx.getFileSystemManager()
    const path = `${wx.env.USER_DATA_PATH}/${fullFilename}`

    fs.writeFileSync(path, jsonString)

    hideLoading()
    showToast('导出成功', 'success')

    return path
  } catch (error) {
    hideLoading()
    console.error('JSON导出失败:', error)
    showToast('导出失败')
    throw error
  }
}

/**
 * 导出数据为CSV
 * @param {Array<object>} data - 要导出的数据
 * @param {Array<string>} headers - CSV列标题
 * @param {string} filename - 文件名
 * @returns {Promise<string>} 临时文件路径
 */
async function exportCSV (data, headers = [], filename = 'data.csv') {
  try {
    showLoading('导出中...')

    // 如果没有指定headers，从第一条数据推导
    if (headers.length === 0 && data.length > 0) {
      headers = Object.keys(data[0])
    }

    // 构建CSV内容
    let csvContent = headers.join(',') + '\n'

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header]
        // 处理包含逗号的值
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`
        }
        return value || ''
      })
      csvContent += values.join(',') + '\n'
    })

    const timestamp = new Date().toISOString().split('T')[0]
    const fullFilename = `${filename.replace('.csv', '')}_${timestamp}.csv`

    // 保存到本地文件
    const fs = wx.getFileSystemManager()
    const path = `${wx.env.USER_DATA_PATH}/${fullFilename}`

    fs.writeFileSync(path, csvContent)

    hideLoading()
    showToast('导出成功', 'success')

    return path
  } catch (error) {
    hideLoading()
    console.error('CSV导出失败:', error)
    showToast('导出失败')
    throw error
  }
}

/**
 * 导出打卡记录
 * @param {Array<object>} records - 打卡记录数组
 * @param {string} format - 导出格式 'json'|'csv'
 * @returns {Promise<string>}
 */
async function exportRecords (records = [], format = 'json') {
  const filename = `打卡记录_${new Date().getFullYear()}`

  if (format === 'csv') {
    const headers = ['日期', '任务', '类别', '目标值', '完成值', '完成度', '备注']
    const data = records.map(r => ({
      日期: r.date,
      任务: r.taskTitle,
      类别: r.category,
      目标值: r.targetValue,
      完成值: r.actualValue,
      完成度: r.completionRate + '%',
      备注: r.remark || ''
    }))
    return exportCSV(data, headers, filename)
  } else {
    return exportJSON(records, filename)
  }
}

/**
 * 导出统计数据
 * @param {object} stats - 统计数据
 * @param {string} format - 导出格式
 * @returns {Promise<string>}
 */
async function exportStats (stats = {}, format = 'json') {
  const filename = `数据统计_${new Date().getFullYear()}`

  if (format === 'csv') {
    const data = [
      { 指标: '总打卡天数', 数值: stats.totalDays || 0 },
      { 指标: '当前连续', 数值: stats.currentStreak || 0 },
      { 指标: '最长连续', 数值: stats.bestStreak || 0 },
      { 指标: '完成率', 数值: (stats.completionRate || 0) + '%' },
      { 指标: '用户等级', 数值: stats.level || '初学者' }
    ]
    return exportCSV(data, ['指标', '数值'], filename)
  } else {
    return exportJSON(stats, filename)
  }
}

/**
 * 分享导出文件
 * @param {string} filePath - 文件路径
 * @param {string} fileName - 文件名
 */
async function shareExportFile (filePath, fileName) {
  try {
    // 需要微信6.7.2以上版本支持
    if (!wx.shareFile) {
      // 降级方案：复制文件路径到剪贴板
      wx.setClipboardData({
        data: filePath,
        success: () => {
          showToast('文件路径已复制，您可以通过文件管理器访问', 'none')
        }
      })
      return
    }

    wx.shareFile({
      filePath,
      fileName,
      success: () => {
        showToast('分享成功', 'success')
      },
      fail: () => {
        showToast('分享失败', 'none')
      }
    })
  } catch (error) {
    console.error('文件分享失败:', error)
    showToast('分享失败')
  }
}

/**
 * 清空已导出的文件
 * @returns {Promise<boolean>}
 */
async function clearExportedFiles () {
  try {
    const fs = wx.getFileSystemManager()
    const files = fs.readdirSync(wx.env.USER_DATA_PATH)

    const exportedFiles = files.filter(f => f.endsWith('.json') || f.endsWith('.csv'))

    exportedFiles.forEach(file => {
      fs.unlinkSync(`${wx.env.USER_DATA_PATH}/${file}`)
    })

    console.log(`[Export] 清除${exportedFiles.length}个导出文件`)
    return true
  } catch (error) {
    console.warn('[Export] 清除导出文件失败:', error)
    return false
  }
}

module.exports = {
  exportJSON,
  exportCSV,
  exportRecords,
  exportStats,
  shareExportFile,
  clearExportedFiles
}
