Component({
  properties: {
    src: { type: String, value: '' },
    size: { type: Number, value: 120 },
    mode: { type: String, value: 'aspectFit' },
    radius: { type: Number, value: 9999 },
    fallbackText: { type: String, value: '' },
    fallbackIconType: { type: String, value: 'info' },
    customStyle: { type: String, value: '' },
    lazyLoad: { type: Boolean, value: true },  // 默认开启懒加载
    webp: { type: Boolean, value: true }        // 默认开启WebP
  },
  data: {
    error: false,
    loading: true,
    finalSrc: ''
  },
  observers: {
    'src, webp': function (src, webp) {
      if (!src) return;

      // 如果是本地图片且开启WebP，尝试使用WebP格式
      if (webp && src.startsWith('/assets/')) {
        const webpSrc = src.replace(/\.(png|jpg|jpeg)$/, '.webp');
        this.setData({ finalSrc: webpSrc });
      } else {
        this.setData({ finalSrc: src });
      }
    }
  },
  methods: {
    onLoad () {
      this.setData({ loading: false });
      this.triggerEvent('load');
    },
    onError (e) {
      // WebP加载失败，回退到原图片
      if (this.data.webp && this.data.finalSrc.endsWith('.webp')) {
        this.setData({
          finalSrc: this.properties.src,
          loading: false
        });
      } else {
        this.setData({
          error: true,
          loading: false
        });
        this.triggerEvent('error', e);
      }
    }
  }
});
