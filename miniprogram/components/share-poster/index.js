const {
  generateCheckinPoster,
  generateStreakPoster,
  generateAchievementPoster,
  saveImageToAlbum,
  shareImage
} = require('../../utils/poster.js');
const vibrate = require('../../utils/vibrate.js');

Component({
  properties: {
    // 分享类型: checkin/streak/achievement
    type: {
      type: String,
      value: 'checkin'
    },
    // 分享数据
    data: {
      type: Object,
      value: {}
    },
    // 是否显示
    visible: {
      type: Boolean,
      value: false
    }
  },

  data: {
    posterPath: '',        // 海报临时路径
    isGenerating: false,   // 是否正在生成
    showPoster: false      // 是否显示海报
  },

  lifetimes: {
    attached () {
      console.log('share-poster component attached');
    }
  },

  observers: {
    'visible': function (newVal) {
      if (newVal) {
        this.generatePoster();
      } else {
        this.setData({
          posterPath: '',
          showPoster: false
        });
      }
    }
  },

  methods: {
    /**
     * 生成海报
     */
    async generatePoster () {
      const { type, data } = this.properties;

      if (this.data.isGenerating) {
        return;
      }

      this.setData({ isGenerating: true });

      wx.showLoading({
        title: '生成中...',
        mask: true
      });

      // 添加超时保护
      const timeoutId = setTimeout(() => {
        wx.hideLoading();
        this.setData({ isGenerating: false });
        wx.showToast({
          title: '生成超时，请重试',
          icon: 'none',
          duration: 2000
        });
        vibrate.error();
        this.handleClose();
      }, 15000); // 15秒超时

      try {
        let posterPath = '';

        switch (type) {
          case 'checkin':
            posterPath = await generateCheckinPoster(data, this);
            break;
          case 'streak':
            posterPath = await generateStreakPoster(data, this);
            break;
          case 'achievement':
            posterPath = await generateAchievementPoster(data, this);
            break;
          default:
            throw new Error('未知的分享类型');
        }

        clearTimeout(timeoutId);

        if (!posterPath) {
          throw new Error('海报生成失败：返回路径为空');
        }

        this.setData({
          posterPath,
          showPoster: true
        });

        vibrate.success();
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('生成海报失败:', error);
        wx.showToast({
          title: error.message || '生成失败，请重试',
          icon: 'none',
          duration: 2000
        });
        vibrate.error();
        this.handleClose();
      } finally {
        wx.hideLoading();
        this.setData({ isGenerating: false });
      }
    },

    /**
     * 保存到相册
     */
    async handleSave () {
      const { posterPath } = this.data;

      if (!posterPath) {
        wx.showToast({
          title: '海报未生成',
          icon: 'none'
        });
        return;
      }

      vibrate.light();

      try {
        await saveImageToAlbum(posterPath);
        vibrate.success();

        this.triggerEvent('save', { posterPath });
      } catch (error) {
        console.error('保存失败:', error);
        vibrate.error();
      }
    },

    /**
     * 分享图片
     */
    handleShare () {
      const { posterPath } = this.data;

      if (!posterPath) {
        wx.showToast({
          title: '海报未生成',
          icon: 'none'
        });
        return;
      }

      vibrate.light();
      shareImage(posterPath);

      this.triggerEvent('share', { posterPath });
    },

    /**
     * 重新生成
     */
    handleRegenerate () {
      vibrate.light();
      this.setData({
        posterPath: '',
        showPoster: false
      });
      this.generatePoster();
    },

    /**
     * 关闭
     */
    handleClose () {
      vibrate.light();
      this.triggerEvent('close');
    },

    /**
     * 阻止冒泡
     */
    preventBubble () { }
  }
});
