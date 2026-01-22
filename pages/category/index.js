const app = getApp();
const wxc = app.globalData.wxc;
Page({

    /**
     * 页面的初始数据
     */
    data: {
			serverHost: 'https://bossbell.com/miniprogram/',
			scrollHeight: 300,
			scrollTop: 0,
			classid:0,
			classidList: ['','/pages/wordlearn/onlinedictate','/pages/wordlearn/autodictate','/pages/wordlearn/word_text','/pages/wordlearn/word_spell','/pages/wordlearn/word_listen','/pages/wordlearn/translate_word','/pages/wordlearn/translate_spell','/pages/wordlearn/translate_listen','/pages/wordlearn/listen_word','/pages/wordlearn/listen_spell','/pages/wordlearn/listen_translate'],
			catearray: null
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
			var that = this;
			let classid = options.classid;
			this.setData({classid:classid});
			const TokenStatus = setInterval(()=>{
				if(app.globalData.token!=''){
					clearInterval(TokenStatus);
					this.getCategory();
				}
			},100)
		},
		checkCategory: function(){
			var that = this;
			wxc.get('catearray'+app.globalData.vg_id).then(res=>{
				let dataArr = res;
				that.data.dataArr = dataArr;
				that.getCategory(dataArr.version);
			}).catch(err=>{
				that.getCategory();
			});
		},
		getCategory: function(versionNumber=''){
			var that = this;
			app.requestHttp({ac:'getcategory',vg_id:app.globalData.vg_id,versionNumber:versionNumber}).then(res=>{
				if (res.data.code == 20000){
					var dataArr = that.data.dataArr;
					that.setData({
						catearray: dataArr.data
					});
				}else if(res.data.code == 10000){
					let dataArr = res.data.data;
					wxc.set('catearray'+app.globalData.vg_id,dataArr);
					that.setData({
						catearray: dataArr.data
					});
				} else {
					console.log("category获取失败");
				}
			}).catch(err=>{
				console.log("category获取失败");
			});
		},
		goWordlist: function(e) {
			console.log(e.currentTarget.dataset);
			let cid = e.currentTarget.dataset.cid;
			let url = '/pages/wordlist/index?cid='+cid
			if(this.data.classid>0){
				url = this.data.classidList[this.data.classid]+'?cid='+cid;
			}
			wx.navigateTo({
				url: url // 这里是需要跳转到的页面路径
			});
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
					let sHeight = windowInfo.windowHeight - data.height;
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