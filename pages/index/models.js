// pages/index/models.js
Page({

	/**
	 * 页面的初始数据
	 */
	data: {

	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {

	},
	goWordWrite: function() {
		wx.navigateTo({
			url: '/pages/wordlist/category?model=wordWrite' // 这里是需要跳转到的页面路径
		});
  },
  goWordSpeak: function() {
		wx.navigateTo({
			url: '/pages/wordlist/category?model=wordSpeak' // 这里是需要跳转到的页面路径
		});
  },
	goWordAnipop: function() {
		wx.navigateTo({
			url: '/pages/wordlist/category?model=wordAnipop' // 这里是需要跳转到的页面路径
		});
	},
	goWordTranslate: function() {
		wx.navigateTo({
			url: '/pages/wordlist/category?model=wordTranslate' // 这里是需要跳转到的页面路径
		});
	},
	goWordAudio: function() {
		wx.navigateTo({
			url: '/pages/wordlist/category?model=wordAudio' // 这里是需要跳转到的页面路径
		});
	},
	goWordSpell: function() {
		wx.navigateTo({
			url: '/pages/wordlist/category?model=wordSpell' // 这里是需要跳转到的页面路径
		});
	},	
	goTranslateWord: function() {
		wx.navigateTo({
			url: '/pages/wordlist/category?model=translateWord' // 这里是需要跳转到的页面路径
		});
	},
	goTranslateAudio: function() {
		wx.navigateTo({
			url: '/pages/wordlist/category?model=translateAudio' // 这里是需要跳转到的页面路径
		});
	},
	goTranslateSepll: function() {
		wx.navigateTo({
			url: '/pages/wordlist/category?model=translateSpell' // 这里是需要跳转到的页面路径
		});
	},
	goListenWord: function() {
		wx.navigateTo({
			url: '/pages/wordlist/category?model=listenWord' // 这里是需要跳转到的页面路径
		});
	},
	goListenTranslate: function() {
		wx.navigateTo({
			url: '/pages/wordlist/category?model=listenTranslate' // 这里是需要跳转到的页面路径
		});
	},
	goListenSpell: function() {
		wx.navigateTo({
			url: '/pages/wordlist/category?model=listenSpell' // 这里是需要跳转到的页面路径
		});
	},
	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady(){
		wx.updateShareMenu({
			withShareTicket: true,
			menus: ['shareAppMessage', 'shareTimeline'],
		});
	},
	onShareAppMessage: function (options) {
		// 返回分享的内容
		return {
			title: '同步学习',
			path: '/pages/index/index',
			imageUrl: '' // 分享卡片的图片，可选
		};
	},
	btnShare: function () {
		// 显示分享按钮
		wx.showShareMenu({
			withShareTicket: true
		});
	},
	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow() {

	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide() {

	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload() {

	},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh() {

	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom() {

	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage() {

	}
})