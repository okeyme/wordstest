const app = getApp();
const wxc = app.globalData.wxc;
Page({

    /**
     * 页面的初始数据
     */
    data: {
			serverHost: 'https://bossbell.com/miniprogram/',
			scrollHeight: 1000,
			scrollTop:0,
			catearray: null,
			dataArr:''
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
			var that = this;
			const TokenStatus = setInterval(()=>{
				if(app.globalData.token!=''){
					clearInterval(TokenStatus);
					this.checkCategory();
				}
			},100)
		},
		checkCategory: function(){
			var that = this;
			wxc.get('listencatearray'+app.globalData.vg_id).then(res=>{
				let dataArr = res;
				that.data.dataArr = dataArr;
				that.getCategory(dataArr.version);
			}).catch(err=>{
				that.getCategory();
			});
		},
		getCategory: function(versionNumber=''){
			var that = this;
			app.requestHttp({ac:'getlistencategory',vg_id:app.globalData.vg_id,versionNumber:versionNumber}).then(res=>{
				if (res.data.code == 20000){
					var dataArr = that.data.dataArr;
					that.setData({
						catearray: dataArr.data
					});
				}else if(res.data.code == 10000){
					let dataArr = res.data.data;
					wxc.set('listencatearray'+app.globalData.vg_id,dataArr);
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
/*
		checkCategory: function(){
			var that = this;
		//查有没有缓存 token, 缓存可能被清空
			wxc.get('listencatearray'+app.globalData.vg_id).then(res=>{
				let catearray = res.data;
				that.data.catearray = catearray;
				console.log('catearray',catearray);
				let versionNumber = catearray.version;
				that.checkCategory2(versionNumber);
			}).catch(err=>{
				console.log("not listencategory...");
				that.getCategory();
			});
		},
		checkCategory2: function(versionNumber){
			var that = this;
			app.requestHttp({ac:'checklistencategory',vg_id: app.globalData.vg_id,versionNumber:versionNumber}).then(res=>{
				if(res.data.code==10000){
					that.getCategory();
				}else{
					var res = that.data.catearray;
					that.setData({catearray:res});
				}
			}).catch(err=>{
				that.getCategory();
			});
		},
		getCategory: function(){
			var that = this;
			app.requestHttp({ac:'getlistencategory',vg_id: app.globalData.vg_id}).then(res=>{
				if (res.data.code == 10000) {
					console.log(res.data.data);
					that.setData({
						catearray: res.data.data.data
					});
					wx.setStorage({
						key: 'listencatearray'+app.globalData.vg_id,
						data: res.data.data
					});
				} else {
					console.log("我的listencatearray获取失败");
				}
			}).catch(err=>{
				app.showError('listencatearray获取失败');
			});
		},*/
		goListenlist: function(e) {
			console.log(e.currentTarget.dataset);
			let cid = e.currentTarget.dataset.cid;
			let listenTextArr = [43,45,47,49,51,53,55,57,59,61,71,72,73,74,75,76,77,78,9,11,13,15,63,64,65,66,67,68,69,70,1,3,5,7,343,345,347,349,209,210,211,212,213,214,215,216,482,484,486,488,124,126,128,130,132,134,29,31,33,35,217,218,219,220,221,222,223,224,199,200,201,202,203,204,205,206,207,208,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,266,267,268,269,270,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,56,58,60,62,302,303,304,305,306,307,308,309,310,311,312,313,324,326,328,330,332,334,44,46,48,50,52,54,85,87,89,91,10,12,14,16,344,346,348,350,320,322,319,321,2,4,6,8,483,485,487,489,225,227,229,17,19,21,24,25,27,18,20,22,23,26,28,226,228,230,160,162,125,127,129,131,133,135,30,32,34,36,86,88,90,92,323,325,327,329,331,333,112,114,116,118,120,122,113,115,117,119,121,123,37,38,39,40,41,42,160,161,162,163,164,290,291,292,293,294,295,296,297,298,299,300,301];
			let listenTTSArr = [79,80,81,82,83,84,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159];
			let url = '/pages/listen/image?cid='+cid;
			let vg_id = parseInt(app.globalData.vg_id);
			console.log('vg_id='+vg_id);
			if(listenTextArr.indexOf(vg_id)!==-1){
				url = '/pages/listen/text?cid='+cid;
			}else if(listenTTSArr.indexOf(vg_id)!==-1){
				url = '/pages/listen/index?cid='+cid;
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