const app = getApp()
Page({

    /**
     * 页面的初始数据
     */
    data: {
			serverHost: 'https://bossbell.com/miniprogram/',
			scrollHeight: 300,
			scrollTop: 0,
			currentTab:0,
			articleArr: null,
			articleIndex:-1, 
			orderArr:[{'id':3,'name':'单词记忆'},{'id':1,'name':'小学英语'},{'id':2,'name':'初中英语'}]
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
			this.checkArticle();
		},
		swiperChange: function(e){
			let current = e.detail.current;
			this.setData({currentTab:current,articleIndex:-1});
		},
		swiperChange2: function(e){
			let index = e.currentTarget.dataset.index;
			//let current = e.detail.current;
			this.setData({currentTab:index,articleIndex:-1});
		},
		showDetail: function(e){
			console.log(this.data.articleArr);
			let index = e.currentTarget.dataset.index;
			let types = this.data.orderArr[this.data.currentTab].id;
			let arr = this.data.articleArr[types];
			console.log(arr);
			let url = arr[index].url;
			if(url!='' && url!=null){
				url = encodeURIComponent(url);
				console.log('url1='+url);
				app.gotoPage('/pages/webview/index?url='+url);
			}else{
				this.setData({articleIndex:index});
			}
		},
		showList: function(){
			this.setData({articleIndex:-1});
		},
		checkArticle: function(){
			var that = this;
    //查有没有缓存 token, 缓存可能被清空
			wx.getStorage({
				key: 'EnglishArticle',
				success(res) {
					that.setData({articleArr:res.data});
				},
				// 没有缓存token, 需要登录
				fail(e) {
					console.log("not Article...");
					that.getArticle();
				}
			})
		},
		getArticle: function(){
			var that = this;
			wx.request({
				url: that.data.serverHost + '?ac=getarticle',
				method: 'POST',
				data: {
					token: app.globalData.token,
					vg_id: app.globalData.vg_id
				},
				header: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				success(res) {
					if (res.data.code == 10000) {
						console.log(res.data.data);
						that.setData({
							articleArr: res.data.data
						});
						wx.setStorage({
							key: 'EnglishArticle',
							data: res.data.data
						});
					} else {
						console.log("我的Article获取失败");
					}
				},
				fail(e) {
					//console.log(e);
					console.log("我的Article获取失败2");
				}
			})
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