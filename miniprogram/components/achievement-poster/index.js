// components/achievement-poster/index.js
// 成就分享海报生成组件

Component({
  properties: {
    // 是否显示
    show: {
      type: Boolean,
      value: false
    },
    // 成就数据
    achievement: {
      type: Object,
      value: {}
    },
    // 用户信息
    userInfo: {
      type: Object,
      value: {}
    }
  },

  data: {
    // 海报图片路径
    posterPath: '',
    // 生成状态
    generating: false
  },

  observers: {
    'show': function (show) {
      if (show && !this.data.posterPath) {
        this.generatePoster();
      }
    }
  },

  methods: {
    /**
     * 生成海报
     */
    async generatePoster () {
      const { achievement, userInfo } = this.properties;

      if (!achievement || !achievement.name) {
        console.warn('成就数据为空');
        return;
      }

      this.setData({ generating: true });

      try {
        const query = wx.createSelectorQuery().in(this);
        query.select('#posterCanvas')
          .fields({ node: true, size: true })
          .exec(async (res) => {
            if (!res || !res[0]) {
              console.error('Canvas节点获取失败');
              return;
            }

            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');

            // 设置画布尺寸
            const dpr = wx.getSystemInfoSync().pixelRatio;
            canvas.width = 750 * dpr;
            canvas.height = 1334 * dpr;
            ctx.scale(dpr, dpr);

            // 绘制海报内容
            await this.drawPosterContent(ctx, canvas, achievement, userInfo);

            // 生成图片
            wx.canvasToTempFilePath({
              canvas: canvas,
              success: (res) => {
                this.setData({
                  posterPath: res.tempFilePath,
                  generating: false
                });
              },
              fail: (err) => {
                console.error('生成海报失败:', err);
                this.setData({ generating: false });
                wx.showToast({
                  title: '生成失败',
                  icon: 'none'
                });
              }
            });
          });
      } catch (err) {
        console.error('生成海报异常:', err);
        this.setData({ generating: false });
      }
    },

    /**
     * 绘制海报内容
     */
    async drawPosterContent (ctx, canvas, achievement, userInfo) {
      const width = 750;
      const height = 1334;

      // 1. 绘制渐变背景
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 2. 绘制装饰圆形
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(600, 200, 150, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(150, 1100, 100, 0, 2 * Math.PI);
      ctx.fill();

      // 3. 绘制成就图标
      ctx.font = 'bold 200px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(achievement.icon || '🏆', width / 2, 400);

      // 4. 绘制"成就解锁"标签
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(250, 550, 250, 60);
      ctx.font = 'bold 32px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('成就解锁', width / 2, 580);

      // 5. 绘制成就名称
      ctx.font = 'bold 64px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(achievement.name, width / 2, 700);

      // 6. 绘制成就描述
      ctx.font = '36px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.drawMultiLineText(ctx, achievement.description || '', width / 2, 800, 600, 50);

      // 7. 绘制用户信息
      ctx.font = '28px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(`${userInfo.nickname || '用户'} 的成就`, width / 2, 950);

      // 8. 绘制日期
      ctx.font = '24px sans-serif';
      const date = new Date().toLocaleDateString('zh-CN');
      ctx.fillText(date, width / 2, 1000);

      // 9. 绘制底部文字
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('自律教练', width / 2, 1150);

      ctx.font = '24px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('让自律成为习惯', width / 2, 1200);
    },

    /**
     * 绘制多行文本
     */
    drawMultiLineText (ctx, text, x, y, maxWidth, lineHeight) {
      const words = text.split('');
      let line = '';
      let currentY = y;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i];
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, x, currentY);
          line = words[i];
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
    },

    /**
     * 保存图片到相册
     */
    handleSave () {
      const { posterPath } = this.data;

      if (!posterPath) {
        wx.showToast({
          title: '海报生成中',
          icon: 'none'
        });
        return;
      }

      wx.saveImageToPhotosAlbum({
        filePath: posterPath,
        success: () => {
          wx.showToast({
            title: '已保存到相册',
            icon: 'success'
          });
        },
        fail: (err) => {
          if (err.errMsg.includes('auth deny')) {
            wx.showModal({
              title: '提示',
              content: '需要您授权保存相册',
              success: (res) => {
                if (res.confirm) {
                  wx.openSetting();
                }
              }
            });
          } else {
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            });
          }
        }
      });
    },

    /**
     * 分享到微信
     */
    handleShare () {
      // 触发分享事件，由页面处理
      this.triggerEvent('share', {
        posterPath: this.data.posterPath
      });
    },

    /**
     * 关闭海报
     */
    handleClose () {
      this.triggerEvent('close');
    }
  }
});
