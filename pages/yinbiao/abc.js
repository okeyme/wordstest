// pages/yinbiao/index.js
const app = getApp()
const webAudio = wx.createInnerAudioContext({
	useWebAudioImplement: true
});
Page({

    /**
     * 页面的初始数据
     */
    data: {
			headerName:'字母学习',
			serverHost: 'https://bossbell.com/miniprogram/',
			scrollHeight: 300,
			scrollTop: 0,
			navHeight: 0,
			abcArr:[],
			currect:0,
			currentTab:0,
			currentArr:[],
			playCurrect: -1,
			swiperItem: ['印刷体','手写体','笔画','口型','例词'],
			randimage: 0,
			localVersion:0
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
			this.loadAbcLocal();
			this.getAbc();
		},
		showLetter: function(){
			var that = this; 
			var currentArr = this.data.abcArr[this.data.currect];
			that.setData({currentArr:currentArr});
			this.audioPlay(0);
		},
		changeAbc: function(e){
			let index = e.currentTarget.dataset.index;
			this.setData({currect:index});
			this.showLetter();
		},
		swiperChange: function(e){
			let current = e.detail.current;
			let randimage = Math.random();
			this.setData({currentTab:current,playCurrect:-1,randimage:randimage});
			if(current<4){
				this.audioPlay(0);
			}
		},
		swiperChange2: function(e){
			let index = e.currentTarget.dataset.index;
			let randimage = Math.random();
			this.setData({currentTab:index,playCurrect:-1,randimage:randimage});
			if(index<4){
				this.audioPlay(0);
			}
		},
		playAudio: function(){
			this.audioPlay(1);
			this.setData({playCurrect:1});
		},
		playAudio2: function(){
			this.audioPlay(2);
			this.setData({playCurrect:2});
		},
		playAudio3: function(){
			this.audioPlay(3);
			this.setData({playCurrect:3});
		},
		audioPlay: function (eq) {
			var that = this;
			var currentArr = this.data.currentArr;
			let src = currentArr.audio;
			if(eq==1){
				src = currentArr.word_audio;
			}else if(eq==2){
				src = currentArr.example_audio;
			}else if(eq==3){
				src = currentArr.example_audio2;
			}
			let audio = 'https://bossbell.com/'+src;
      webAudio.src = audio;
			webAudio.play();
      webAudio.onPlay(()=>{
				console.log('音频开始播放');
      })
      webAudio.onEnded(()=>{
				console.log('音频播放完毕');
				that.setData({playCurrect:-1});
      })
		},
		// 从本地加载缓存
	loadAbcLocal() {
		const cache = wx.getStorageSync('yinbaoabcData') || {};
		if (cache.data && cache.version) {
			this.setData({
				abcArr: cache.data || [],
				localVersion: cache.version
			},()=>{
				this.showLetter();
			});
			console.log('====abcArr==',this.data.abcArr);
		}
	},
	getAbc: function(){
		var data = {};
		app.requestData('/yinbiao/getABC','GET', data, (res) => {
				console.log('===res===',res);
				if (res.data.changed) {
					// 数据有更新
					const newData = {
						version: res.data.version,
						data: res.data.data,
						timestamp: Date.now()
					};
					wx.setStorageSync('yinbaoabcData', newData);
					this.setData({
						abcArr: res.data.data,
						localVersion: res.data.version
					},()=>{
						console.log('====abcArr==',this.data.abcArr);
						this.showLetter();
					});
				}
				// 无更新时保持本地数据
			},
			(err) => {
				console.error('请求失败', err);
			}
		);
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
			app.gotoPage("/pages/yinbiao/pingdu");
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
					that.setData({scrollTop:data.height});
				}
			}).exec();
			query.select('.swipernav').boundingClientRect(data => {
				if (data) {
					that.setData({navHeight:data.height});
				}
			}).exec();
			query.select('.abcTitle').boundingClientRect(data => {
				if (data) {
					let sHeight = windowInfo.windowHeight - that.data.scrollTop - that.data.navHeight - data.height;
					that.setData({scrollHeight: sHeight});
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