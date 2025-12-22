Component({
  properties: {
    src: { type: String, value: '' },
    size: { type: Number, value: 120 },
    mode: { type: String, value: 'aspectFit' },
    radius: { type: Number, value: 9999 },
    fallbackText: { type: String, value: '' },
    fallbackIconType: { type: String, value: 'info' },
    customStyle: { type: String, value: '' }
  },
  data: {
    error: false
  },
  methods: {
    onError () {
      this.setData({ error: true })
      this.triggerEvent('error')
    }
  }
})
