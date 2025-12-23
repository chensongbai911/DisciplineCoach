/**
 * 网络状态 Behavior
 * 负责网络监控、离线提示
 */

const app = getApp()

module.exports = Behavior({
  data: {
    // 网络状态
    isOnline: true,
    networkType: 'unknown'
  },

  methods: {
    /**
     * 更新网络状态
     */
    updateNetworkStatus () {
      wx.getNetworkType({
        success: (res) => {
          const isOnline = res.networkType !== 'none';
          this.setData({
            isOnline,
            networkType: res.networkType
          });

          // 更新全局状态
          app.globalData.isOnline = isOnline;
          app.globalData.networkType = res.networkType;
        }
      });

      // 监听网络状态变化
      wx.onNetworkStatusChange((res) => {
        this.onNetworkChange(res.isConnected, res.networkType);
      });
    },

    /**
     * 网络状态变化回调
     */
    onNetworkChange (isOnline, networkType) {
      console.log('网络状态变化:', isOnline, networkType);

      this.setData({
        isOnline,
        networkType
      });

      // 更新全局状态
      app.globalData.isOnline = isOnline;
      app.globalData.networkType = networkType;

      // 显示提示
      if (!isOnline) {
        wx.showToast({
          title: '网络已断开',
          icon: 'none',
          duration: 2000
        });
      } else {
        wx.showToast({
          title: '网络已恢复',
          icon: 'success',
          duration: 2000
        });

        // 网络恢复后重新加载数据
        this.loadData();
      }
    }
  }
})
