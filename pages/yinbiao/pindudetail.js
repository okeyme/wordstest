// pages/yinbiao/yinbiao.js
const app = getApp()
Page({

    /**
     * 页面的初始数据
     */
    data: {
			headerName:'超级拼读',
			serverHost: 'https://bossbell.com/miniprogram/',
			scrollHeight: 300,
			scrollTop: 0,
			viewTop:0,
			pinduArr:[],
			yinbiaoArr:[],
			yb:'',
			zm:'',
			currentArr:[],
			zmabc: 0,
			zmindex: 0,
			playCurrect:false,
			popupStatus:false,
			ybaudio:'',
			ybstr:'',
			toViewID:'',
			tempID:null
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
			wx.showLoading({
				title: '数据加载中',
			})			
			let ybzm = options.yb;
			var yzarr = ybzm.split("#");
			console.log('yzarr',yzarr);
			this.setData({yb:yzarr[0], zm:yzarr[1]});
			this.checkpindudetail();
		},
		showPopup: function(e){
			this.checkyinbiao();
			let zmindex = e.currentTarget.dataset.index;
			let zmabc = e.currentTarget.dataset.zm;
			this.setData({zmindex:zmindex,zmabc:zmabc,popupStatus:true});
			this.audioPlay();
		},
		popupClose: function(){
			this.setData({popupStatus:false});
		},
		popupPrev: function(){
			let eq = this.data.zmindex;
			if(eq>0) eq = eq-1
			else{
				app.showToast('已是字母'+this.data.zm+'的第一个');
				return;
			}
			this.setData({zmindex:eq});
			this.popupAudio();
		},
		popupNext: function(){
			let eq = this.data.zmindex;
			if(eq<(this.data.currentArr[this.data.zmabc].length-1)) eq = eq+1
			else{
				app.showToast('已是字母'+this.data.zm+'的最后一个');
				return;
			}
			this.setData({zmindex:eq});
			this.popupAudio();
		},
		popupAudio: function(){
			this.audioPlay();
		},
		playYinbiao: function(e){
			var that = this;
			let ybstr = e.currentTarget.dataset.yinbiao;
			that.setData({ybstr:ybstr});
			ybstr = ybstr.replace('<span>','');
			ybstr = ybstr.replace('</span>','');
			console.log('ybstr',ybstr);
			var ybarr = this.data.yinbiaoArr['yinbiao'];
			outerLoop: for(let keys in ybarr){
				for(let key in ybarr[keys]){
					if(ybarr[keys][key][0]=='/'+ybstr+'/'){
						that.data.ybaudio = ybarr[keys][key][1];
						that.yinbiaoPlay();
						break outerLoop;
					}
				}
			}
		},
		yinbiaoPlay: function(){
			var that = this;
			var webAudio = wx.createInnerAudioContext({
				useWebAudioImplement: true
			});
      webAudio.src = 'http://w.360e.cn/yinbiao/audio/'+this.data.ybaudio;
			webAudio.play();
      webAudio.onPlay(()=>{
				console.log('音频开始播放');
      })
      webAudio.onEnded(()=>{
				console.log('音频播放完毕');
				that.setData({ybstr:''});
      })
		},
		playAudio: function(e){
			let zmindex = e.currentTarget.dataset.index;
			let zmabc = e.currentTarget.dataset.zm;
			this.setData({zmindex:zmindex,zmabc:zmabc});
			this.audioPlay(); 
		},
		audioPlay: function () {
		//	clearTimeout(this.data.tempID);
			var that = this;
			that.setData({playCurrect:true});
			var currentArr = this.data.currentArr;
			let obj = currentArr[this.data.zmabc][this.data.zmindex];
			console.log('obj',obj);
			let audio = obj.audio;
			audio = audio.replace("https://bossbell.com/","")
			let audiostr = 'http://w.360e.cn/'+audio;
			var webAudio = wx.createInnerAudioContext({
				useWebAudioImplement: true
			});
      webAudio.src = audiostr;
			webAudio.play();
      webAudio.onPlay(()=>{
				console.log('音频开始播放');
      })
      webAudio.onEnded(()=>{
				console.log('音频播放完毕');
				that.setData({playCurrect:false});
      })
		},
		checkpindudetail: function(){
			var that = this;
    //查有没有缓存 token, 缓存可能被清空
			wx.getStorage({
				key: 'pindudetail',
				success(res) {
					console.log('pindudetail',res.data);
					var ybkeys = Object.keys(res.data);
					let currentArr = res.data.data[that.data.yb];
					console.log('currentArr',currentArr);
					that.setData({pinduArr:res.data.data,currentArr:currentArr});
					wx.hideLoading()
				},
				// 没有缓存token, 需要登录
				fail(e) {
					console.log("not pindu...");
					that.getpindudetail();
				}
			})
		},
		getpindudetail: function(){
			var that = this;
			wx.request({
				url: that.data.serverHost + '?ac=getpindudetail',
				method: 'POST',
				data: {
					token: app.globalData.token
				},
				header: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				success(res) {
					if (res.data.code == 10000) {
						console.log('data=',res.data.data);
						let currentArr = res.data.data.data[that.data.yb];
						that.setData({
							pinduArr: res.data.data.data,
							currentArr: currentArr
						});
						wx.setStorage({
							key: 'pindudetail',
							data: res.data.data
						});
						wx.hideLoading()
					} else {
						console.log("我的pindu获取失败");
					}
				},
				fail(e) {
					//console.log(e);
					console.log("我的pindu获取失败2");
				}
			})
		},
		checkyinbiao: function(){
			var that = this;
    //查有没有缓存 token, 缓存可能被清空
			wx.getStorage({
				key: 'yinbiaolearn',
				success(res) {
					console.log(res.data);
					that.setData({yinbiaoArr:res.data});
				},
				// 没有缓存token, 需要登录
				fail(e) {
					console.log("not yinbiao...");
					that.getyinbiao();
				}
			})
		},
		getyinbiao: function(){
			var that = this;
			wx.request({
				url: that.data.serverHost + '?ac=getyinbiao',
				method: 'POST',
				data: {
					token: app.globalData.token
				},
				header: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				success(res) {
					if (res.data.code == 10000) {
						console.log(res.data.data);
						that.setData({
							yinbiaoArr: res.data.data
						});
						wx.setStorage({
							key: 'yinbiaolearn',
							data: res.data.data
						});
					} else {
						console.log("我的yinbiao获取失败");
					}
				},
				fail(e) {
					//console.log(e);
					console.log("我的yinbiao获取失败2");
				}
			})
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
					that.setData({scrollTop:data.height, scrollHeight: sHeight,toViewID:'view_'+that.data.zm});
				}
			}).exec();
		},
		goDetail: function(e) {
			let yinbiao = e.currentTarget.dataset.yinbiao;
			app.gotoPage("/pages/yinbiao/yinbiaodetail?yinbiao="+yinbiao);
		},
		goBack: function() {
			app.gotoBack();
		},
		goHome: function() {
			app.gotoHome();
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