// pages/yinbiao/index.js
const app = getApp()
Page({

    /**
     * 页面的初始数据
     */
    data: {
			headerName:'字母音标',
			serverHost: 'https://bossbell.com/miniprogram/',
			scrollHeight: 300,
			scrollTop: 0
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {

    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
		goabc: function(){
			app.gotoPage("/pages/yinbiao/abc");
		},
		goyinbiao: function(){
			app.gotoPage("/pages/yinbiao/yinbiao");
		},
		gopingdu: function(){
			app.gotoPage("/pages/yinbiao/pindu");
		},
    goBack: function() {
			app.gotoBack();
		},
		goHome: function() {
			app.gotoHome();
		},
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {
			var that = this;
			const windowInfo = wx.getWindowInfo()
			const query = wx.createSelectorQuery();
			query.select('.header').boundingClientRect(data => {
				if (data) {
					let sHeight = windowInfo.windowHeight - data.height - 50;
					that.setData({scrollTop:data.height, scrollHeight: sHeight});
				}
			}).exec();
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