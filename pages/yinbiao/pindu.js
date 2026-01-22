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
			yinbiaoArr:[],
			currentArr:[],
			yindex: 0,
			index: 0,
			playCurrect:'',
			lianbo: false,
			toViewID:'',
			tempID:null
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
			this.checkpindu();
		},
		soundYuan: function(){
			this.data.lianbo = true;
			var yinbiaoArr = this.data.yinbiaoArr;
			var currentArr = yinbiaoArr['yinbiao'][this.data.yindex][this.data.index];
			this.data.currentArr = currentArr;
			this.setData({playCurrect:currentArr[0]});
			this.audioPlay();
		},
		soundYuan2: function(){
			this.data.lianbo = true;
			if(this.data.yindex<3){
				this.data.yindex = 3;
			}
			var yinbiaoArr = this.data.yinbiaoArr;
			var currentArr = yinbiaoArr['yinbiao'][this.data.yindex][this.data.index];
			this.data.currentArr = currentArr;
			this.setData({playCurrect:currentArr[0]});
			this.audioPlay();
		},
		soundYuanNext: function(){
			var that = this;
			var yinbiaoArr = this.data.yinbiaoArr;
			let lens = yinbiaoArr['yinbiao'][this.data.yindex].length;
			console.log('lens',lens);
			var currentArr = this.data.currentArr;
			if(this.data.index<lens-1){
				this.data.index = this.data.index+1;
			}else{
				let yy = 2;
				if(this.data.yindex>=3){
					yy = 8;
				}
				if(this.data.yindex<yy){
					this.data.yindex = this.data.yindex+1;
				}else{
					that.data.lianbo = false;
					this.data.yindex = 0;
					this.data.index = 0;
					clearTimeout(that.data.tempID);
					return;
				}
				this.data.index = 0;
			}
			if(this.data.yindex<=2){
				this.soundYuan();
			}else{
				this.soundYuan2();
			}
		},
		playAudio: function(e){
			let index = e.currentTarget.dataset.index;
			let yindex = e.currentTarget.dataset.yindex;
			var yinbiaoArr = this.data.yinbiaoArr;
			var currentArr = yinbiaoArr['yinbiao'][yindex][index];
			this.data.currentArr = currentArr;
			console.log('currentArr',currentArr);
			this.setData({playCurrect:currentArr[0]});
			this.audioPlay(); 
		},
		audioPlay: function () {
			clearTimeout(this.data.tempID);
			var that = this;
			var currentArr = this.data.currentArr;
			let src = currentArr[1];
			let audio = 'http://w.360e.cn/yinbiao/audio/'+src;
			var webAudio = wx.createInnerAudioContext({
				useWebAudioImplement: true
			});
      webAudio.src = audio;
			webAudio.play();
      webAudio.onPlay(()=>{
				console.log('音频开始播放');
      })
      webAudio.onEnded(()=>{
				console.log('音频播放完毕');
				that.setData({playCurrect:''});
				if(that.data.lianbo){
					that.data.tempID = setTimeout(function(){
						that.soundYuanNext();
					},2000);
				}
      })
		},
		gotoView: function(e){
			var that = this;
			let viewid = e.currentTarget.dataset.viewid;
			this.setData({toViewID:'view_'+viewid});
		},
		checkpindu: function(){
			var that = this;
    //查有没有缓存 token, 缓存可能被清空
			wx.getStorage({
				key: 'pindulearn',
				success(res) {
					console.log(res.data);
					that.setData({yinbiaoArr:res.data});
				},
				// 没有缓存token, 需要登录
				fail(e) {
					console.log("not pindu...");
					that.getpindu();
				}
			})
		},
		getpindu: function(){
			var that = this;
			wx.request({
				url: that.data.serverHost + '?ac=getpindu',
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
							key: 'pindulearn',
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
					that.setData({scrollTop:data.height, scrollHeight: sHeight});
				}
			}).exec();
		},
		gotoDetail: function(e) {
			let yb = e.currentTarget.dataset.yb;
			let zm = e.currentTarget.dataset.zm;
			app.gotoPage("/pages/yinbiao/pindudetail?yb="+yb+'#'+zm);
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