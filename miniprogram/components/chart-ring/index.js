// components/chart-ring/index.js
// 环形图组件 - 显示完成率

Component({
  properties: {
    // 完成百分比 (0-100)
    percentage: {
      type: Number,
      value: 0,
      observer: 'updateChart'
    },
    // 图表尺寸
    size: {
      type: Number,
      value: 300
    },
    // 环宽度
    ringWidth: {
      type: Number,
      value: 30
    },
    // 颜色配置
    colors: {
      type: Object,
      value: {
        completed: '#4FD1C5',
        background: '#EDF2F7'
      }
    }
  },

  data: {
    canvasId: 'ringChart_' + Date.now(),
    animatedPercentage: 0
  },

  lifetimes: {
    attached () {
      setTimeout(() => {
        this.initChart();
      }, 100);
    }
  },

  methods: {
    /**
     * 初始化图表
     */
    initChart () {
      this.animatePercentage(0, this.properties.percentage);
    },

    /**
     * 更新图表
     */
    updateChart (newPercentage) {
      const oldPercentage = this.data.animatedPercentage;
      this.animatePercentage(oldPercentage, newPercentage);
    },

    /**
     * 动画更新百分比
     */
    animatePercentage (from, to) {
      const duration = 1000; // 1秒动画
      const startTime = Date.now();
      const frameInterval = 1000 / 60; // 60fps

      const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);

        // 使用缓动函数
        const easeProgress = this.easeOutCubic(progress);
        const currentPercentage = from + (to - from) * easeProgress;

        this.setData({
          animatedPercentage: currentPercentage
        });

        this.drawChart();

        if (progress < 1) {
          // 使用setTimeout模拟requestAnimationFrame
          setTimeout(animate, frameInterval);
        }
      };

      animate();
    },

    /**
     * 缓动函数
     */
    easeOutCubic (t) {
      return 1 - Math.pow(1 - t, 3);
    },

    /**
     * 绘制图表
     */
    drawChart () {
      const query = wx.createSelectorQuery().in(this);
      query.select('#' + this.data.canvasId)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0]) {
            console.error('Canvas节点获取失败');
            return;
          }

          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio;

          const width = res[0].width;
          const height = res[0].height;

          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);

          // 绘制图表
          this.renderChart(ctx, width, height);
        });
    },

    /**
     * 渲染图表
     */
    renderChart (ctx, width, height) {
      const { ringWidth, colors } = this.properties;
      const { animatedPercentage } = this.data;

      // 清空画布
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2 - ringWidth / 2 - 10;

      // 绘制背景环
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = colors.background;
      ctx.lineWidth = ringWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 绘制完成环 - 添加渐变效果
      if (animatedPercentage > 0) {
        const startAngle = -Math.PI / 2; // 从12点方向开始
        const endAngle = startAngle + (animatedPercentage / 100) * 2 * Math.PI;

        // 创建渐变色
        const gradient = ctx.createLinearGradient(
          centerX - radius,
          centerY,
          centerX + radius,
          centerY
        );
        gradient.addColorStop(0, '#4FD1C5');
        gradient.addColorStop(1, '#38B2AC');

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = ringWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        // 添加光晕效果
        ctx.shadowColor = 'rgba(79, 209, 197, 0.3)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = ringWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      // 绘制中心文字
      this.drawCenterText(ctx, centerX, centerY, animatedPercentage);
    },

    /**
     * 绘制中心文字
     */
    drawCenterText (ctx, centerX, centerY, percentage) {
      const roundedPercentage = Math.round(percentage);

      // 百分比数字
      ctx.fillStyle = '#2D3748';
      ctx.font = '600 28px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(roundedPercentage + '%', centerX, centerY - 3);

      // 完成率文字
      ctx.fillStyle = '#A0AEC0';
      ctx.font = '400 12px system-ui, -apple-system, sans-serif';
      ctx.fillText('完成率', centerX, centerY + 22);
    }
  }
});
