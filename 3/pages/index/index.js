// index.js
Page({
  data: {
  },
  
  // 跳转到商城页面
  goToShop() {
    wx.navigateTo({
      url: '/pages/shop/shop'
    })
  },

  // 跳转到AI页面
  goToAI() {
    wx.navigateTo({
      url: '/pages/ai/ai'
    })
  }
})
