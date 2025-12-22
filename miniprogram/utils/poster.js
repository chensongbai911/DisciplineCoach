/**
 * Canvas 海报生成工具
 * 用于生成打卡分享、成就分享等海报
 */

/**
 * 分享场景类型
 */
const SHARE_TYPES = {
  CHECKIN: 'checkin',           // 打卡分享
  STREAK: 'streak',             // 连续天数
  ACHIEVEMENT: 'achievement',   // 成就解锁
  WEEKLY: 'weekly',             // 周报
  MONTHLY: 'monthly'            // 月报
};

/**
 * 海报配置
 */
const POSTER_CONFIG = {
  width: 750,                    // 海报宽度
  height: 1334,                  // 海报高度 (16:9)
  padding: 60,                   // 内边距
  backgroundColor: '#ffffff',    // 背景色
  primaryColor: '#4FD1C5',      // 主题色
  textColor: '#333333',         // 文字颜色
  secondaryColor: '#999999'     // 次要文字颜色
};

/**
 * 创建Canvas上下文
 * @param {string} canvasId - Canvas ID
 * @returns {Object} Canvas上下文
 */
function createCanvasContext (canvasId) {
  return wx.createCanvasContext(canvasId);
}

/**
 * 绘制圆角矩形
 * @param {Object} ctx - Canvas上下文
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} radius - 圆角半径
 */
function drawRoundRect (ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * 绘制渐变背景
 * @param {Object} ctx - Canvas上下文
 * @param {Array} colors - 渐变颜色数组
 * @param {number} width - 宽度
 * @param {number} height - 高度
 */
function drawGradientBackground (ctx, colors, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });
  ctx.setFillStyle(gradient);
  ctx.fillRect(0, 0, width, height);
}

/**
 * 绘制文字 (支持换行)
 * @param {Object} ctx - Canvas上下文
 * @param {string} text - 文本内容
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} maxWidth - 最大宽度
 * @param {number} lineHeight - 行高
 * @returns {number} 实际高度
 */
function drawText (ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split('');
  let line = '';
  let currentY = y;
  let lineCount = 0;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i];
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
      lineCount++;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  lineCount++;

  return lineCount * lineHeight;
}

/**
 * 绘制圆形图片
 * @param {Object} ctx - Canvas上下文
 * @param {string} imagePath - 图片路径
 * @param {number} x - 中心X坐标
 * @param {number} y - 中心Y坐标
 * @param {number} radius - 半径
 * @returns {Promise}
 */
function drawCircleImage (ctx, imagePath, x, y, radius) {
  return new Promise((resolve, reject) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.clip();

    ctx.drawImage(imagePath, x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
    resolve();
  });
}

/**
 * 生成打卡分享海报
 * @param {Object} data - 打卡数据
 * @returns {Promise<string>} 海报临时路径
 */
function generateCheckinPoster (data) {
  return new Promise((resolve, reject) => {
    const {
      userName = '用户',
      streakDays = 0,
      completedCount = 0,
      totalCount = 0,
      date = new Date().toLocaleDateString(),
      avatarUrl = ''
    } = data;

    const canvasId = 'shareCanvas';
    const ctx = createCanvasContext(canvasId);
    const { width, height, padding } = POSTER_CONFIG;

    try {
      // 1. 绘制渐变背景
      drawGradientBackground(ctx, ['#4FD1C5', '#45B7AA'], width, height);

      // 2. 绘制白色卡片
      ctx.setFillStyle('#ffffff');
      drawRoundRect(ctx, padding, padding * 3, width - padding * 2, height - padding * 6, 32);
      ctx.fill();

      // 3-11. 绘制内容
      const drawContent = () => {
        // 4. 绘制用户名
        ctx.setFillStyle('#333333');
        ctx.setFontSize(40);
        ctx.setTextAlign('center');
        ctx.fillText(userName, width / 2, padding * 5.5);

        // 5. 绘制主标题
        ctx.setFillStyle('#4FD1C5');
        ctx.setFontSize(80);
        ctx.setFontWeight('bold');
        ctx.fillText(`${completedCount}/${totalCount}`, width / 2, padding * 8);

        // 6. 绘制副标题
        ctx.setFillStyle('#666666');
        ctx.setFontSize(36);
        ctx.fillText('今日完成任务', width / 2, padding * 9.5);

        // 7. 绘制连续天数
        if (streakDays > 0) {
          ctx.setFillStyle('#FF6B6B');
          ctx.setFontSize(48);
          ctx.fillText(`🔥 连续打卡 ${streakDays} 天`, width / 2, padding * 11);
        }

        // 8. 绘制日期
        ctx.setFillStyle('#999999');
        ctx.setFontSize(28);
        ctx.fillText(date, width / 2, padding * 12.5);

        // 9. 绘制分割线
        ctx.setStrokeStyle('#eeeeee');
        ctx.setLineWidth(2);
        ctx.beginPath();
        ctx.moveTo(padding * 2, padding * 14);
        ctx.lineTo(width - padding * 2, padding * 14);
        ctx.stroke();

        // 10. 绘制底部文字
        ctx.setFillStyle('#999999');
        ctx.setFontSize(24);
        ctx.fillText('自律教练 · 让自律成为习惯', width / 2, padding * 15.5);

        // 11. 绘制小程序码区域提示
        ctx.setFillStyle('#f7f8fa');
        drawRoundRect(ctx, width - padding * 2.5, height - padding * 2.5, padding * 1.8, padding * 1.8, 16);
        ctx.fill();
        ctx.setFillStyle('#999999');
        ctx.setFontSize(20);
        ctx.setTextAlign('right');
        ctx.fillText('长按识别', width - padding * 0.8, height - padding * 0.8);

        // 绘制完成
        ctx.draw(false, () => {
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvasId,
              success: (res) => {
                resolve(res.tempFilePath);
              },
              fail: reject
            });
          }, 500);
        });
      };

      // 3. 绘制头像 (可选)
      if (avatarUrl) {
        drawCircleImage(ctx, avatarUrl, width / 2, padding * 4, 80)
          .then(drawContent)
          .catch(() => {
            // 头像加载失败,继续绘制其他内容
            drawContent();
          });
      } else {
        drawContent();
      }
    } catch (error) {
      console.error('生成打卡海报失败:', error);
      reject(error);
    }
  });
}

/**
 * 生成连续打卡海报
 * @param {Object} data - 连续打卡数据
 * @returns {Promise<string>} 海报临时路径
 */
function generateStreakPoster (data) {
  return new Promise((resolve, reject) => {
    const {
      userName = '用户',
      streakDays = 0,
      totalDays = 0,
      startDate = '',
      avatarUrl = ''
    } = data;

    const canvasId = 'shareCanvas';
    const ctx = createCanvasContext(canvasId);
    const { width, height, padding } = POSTER_CONFIG;

    try {
      // 绘制炫耀风格的连续打卡海报
      drawGradientBackground(ctx, ['#FFD700', '#FFA500'], width, height);

      // 主标题区域
      ctx.setFillStyle('#ffffff');
      ctx.setFontSize(120);
      ctx.setFontWeight('bold');
      ctx.setTextAlign('center');
      ctx.fillText(`${streakDays}`, width / 2, height / 3);

      ctx.setFontSize(48);
      ctx.fillText('天', width / 2, height / 3 + 100);

      // 副标题
      ctx.setFontSize(36);
      ctx.fillText(`已坚持 ${streakDays} 天，共 ${totalDays} 天`, width / 2, height / 2);

      // 底部信息
      ctx.setFillStyle('rgba(255, 255, 255, 0.8)');
      ctx.setFontSize(28);
      ctx.fillText('自律给我自由', width / 2, height - padding * 3);

      ctx.draw(false, () => {
        setTimeout(() => {
          wx.canvasToTempFilePath({
            canvasId,
            success: (res) => resolve(res.tempFilePath),
            fail: reject
          });
        }, 500);
      });
    } catch (error) {
      console.error('生成连续打卡海报失败:', error);
      reject(error);
    }
  });
}

/**
 * 生成成就分享海报
 * @param {Object} data - 成就数据
 * @returns {Promise<string>} 海报临时路径
 */
function generateAchievementPoster (data) {
  return new Promise((resolve, reject) => {
    const {
      achievementName = '成就',
      achievementIcon = '🏆',
      achievementDesc = '',
      userName = '用户',
      unlockedAt = new Date().toLocaleDateString()
    } = data;

    const canvasId = 'shareCanvas';
    const ctx = createCanvasContext(canvasId);
    const { width, height } = POSTER_CONFIG;

    try {
      // 绘制成就风格海报
      drawGradientBackground(ctx, ['#9B59B6', '#8E44AD'], width, height);

      // 图标
      ctx.setFontSize(200);
      ctx.setTextAlign('center');
      ctx.fillText(achievementIcon, width / 2, height / 3);

      // 成就名称
      ctx.setFillStyle('#ffffff');
      ctx.setFontSize(64);
      ctx.setFontWeight('bold');
      ctx.fillText(achievementName, width / 2, height / 2);

      // 描述
      ctx.setFontSize(32);
      ctx.fillText(achievementDesc, width / 2, height / 2 + 80);

      ctx.draw(false, () => {
        setTimeout(() => {
          wx.canvasToTempFilePath({
            canvasId,
            success: (res) => resolve(res.tempFilePath),
            fail: reject
          });
        }, 500);
      });
    } catch (error) {
      console.error('生成成就海报失败:', error);
      reject(error);
    }
  });
}

/**
 * 保存图片到相册
 * @param {string} filePath - 临时文件路径
 * @returns {Promise}
 */
function saveImageToAlbum (filePath) {
  return new Promise((resolve, reject) => {
    // 先检查权限
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.writePhotosAlbum']) {
          // 已授权,直接保存
          saveToAlbum(filePath, resolve, reject);
        } else {
          // 请求授权
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              saveToAlbum(filePath, resolve, reject);
            },
            fail: () => {
              // 授权失败,引导用户手动开启
              wx.showModal({
                title: '需要相册权限',
                content: '需要您授权保存图片到相册',
                confirmText: '去设置',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.openSetting();
                  }
                  reject(new Error('用户拒绝授权'));
                }
              });
            }
          });
        }
      }
    });
  });
}

/**
 * 保存到相册
 */
function saveToAlbum (filePath, resolve, reject) {
  wx.saveImageToPhotosAlbum({
    filePath,
    success: () => {
      wx.showToast({
        title: '已保存到相册',
        icon: 'success'
      });
      resolve();
    },
    fail: (err) => {
      console.error('保存到相册失败:', err);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
      reject(err);
    }
  });
}

/**
 * 分享图片
 * @param {string} filePath - 临时文件路径
 */
function shareImage (filePath) {
  wx.showShareImageMenu({
    path: filePath,
    success: () => {
      console.log('分享成功');
    },
    fail: (err) => {
      console.error('分享失败:', err);
      wx.showToast({
        title: '分享失败',
        icon: 'none'
      });
    }
  });
}

module.exports = {
  SHARE_TYPES,
  POSTER_CONFIG,
  createCanvasContext,
  drawRoundRect,
  drawGradientBackground,
  drawText,
  drawCircleImage,
  generateCheckinPoster,
  generateStreakPoster,
  generateAchievementPoster,
  saveImageToAlbum,
  shareImage
};
