const app = getApp();
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		invite_code:'',
		invite:{
			counts:0,
			members:0,
			reward_days:0,
			list:[]
		}
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad() {
		this.getInvitecode();
		this.getInvitelist();
	},
	getInvitelist: function() {
		app.requestData('/invite/getInvitelist', 'POST', {}, (res) => {
			console.log('===res invite==',res);
			if (res.code === 0) {
				this.setData({
					invite:res.data.data
				})
			}
		});
	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady(){
		wx.showShareMenu({
			withShareTicket: true,
			menus: ['shareAppMessage', 'shareTimeline']
		});
	},
	// 分享给朋友
	getInvitecode: function() {
		if(this.data.invite_code!='') return;
		app.requestData('/invite/getInvitecode', 'POST', {}, (res) => {
			if (res.code === 0) {
				this.setData({
					invite_code: res.data.data.invite_code
				})
				console.log('===invite_code==',this.data.invite_code);
			}
		});
	},
	onShareAppMessage: function () {
		// 返回分享的内容
		console.log('分享路径','/pages/index/index?invite_code='+this.data.invite_code);
		return {
			title: app.globalData.serverName || '云单词速记',
			path: '/pages/index/index?invite_code='+this.data.invite_code,
			imageUrl: '' // 分享卡片的图片，可选
		};
	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow() {
	}
})