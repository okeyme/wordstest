const app = getApp();
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		searchValue:''
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {

	},
	onInputChange(e) {
    const value = e.detail.value.trim();
    this.setData({
      searchValue: value
    });
  },
	memberConvert: function(){
		if(this.data.searchValue=='') {
			app.showToast('请输入会员兑换码'); return;
		}
		app.showToast('未找到会员兑换码，请联系购买平台客服。'); return;
	},
	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady() {

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