// pages/yinbiao/yinbiao.js
const app = getApp()
const webAudio = wx.createInnerAudioContext({
	useWebAudioImplement: true
});
Page({

    /**
     * 页面的初始数据
     */
    data: {
			headerName:'国际音标',
			serverHost: 'https://bossbell.com/miniprogram/',
			scrollHeight: 300,
			scrollTop: 0,
			yinbiaoArr:[],
			yinbiaodetailArr:[],
			currectDetailArr:[],
			rename:'ai',
			yblist:[],
			isPlaying: false,
			localVersion:0
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
			this.data.yinbiao = options.yinbiao;
			this.loadYinbiaoDetailLocal();
			this.getYinbiaoDetail();
		},
		debugEvent: function(e) {
			console.log('dataset from WXS:', e);
		},
		playWordSound: function(e) {
			const word = e.word; // 从WXS传递过来的单词
			
			console.log('播放单词发音:', word);
			return;
			
			// 创建音频上下文
			const innerAudioContext = wx.createInnerAudioContext();
			
			// 设置音频源 - 根据你的实际情况修改路径
			// 方式1: 使用网络音频
			innerAudioContext.src = `https://your-audio-server.com/words/${word}.mp3`;
			
			// 方式2: 使用本地音频（需要将音频文件放在小程序目录中）
			// innerAudioContext.src = `/audio/words/${word}.mp3`;
			
			// 播放音频
			innerAudioContext.play();
			
			// 音频播放事件
			innerAudioContext.onPlay(() => {
				console.log('开始播放发音');
				wx.showToast({
					title: `播放: ${word}`,
					icon: 'none',
					duration: 1000
				});
			});
			
			// 音频播放结束事件
			innerAudioContext.onEnded(() => {
				console.log('发音播放结束');
				innerAudioContext.destroy(); // 销毁音频实例
			});
			
			// 音频播放错误事件
			innerAudioContext.onError((res) => {
				console.error('播放失败:', res);
				wx.showToast({
					title: '播放失败',
					icon: 'none',
					duration: 2000
				});
				innerAudioContext.destroy();
			});
		},
		prev: function(){
			const {yinbiaodetailArr,yinbiao} = this.data;
			var that = this;
			var yblist = Object.keys(yinbiaodetailArr);
			let eq = yblist.indexOf(yinbiao);
			if(eq>0){
			 eq=eq-1;
			 let yinbiao = yblist[eq];
			 this.data.yinbiao = yinbiao;
			 this.currectYinbiao();
			}else{
				app.showToast('已经是第一个');return;
			}
		},
		next: function(){
			const {yinbiaodetailArr,yinbiao} = this.data;
			var that = this;
			var yblist = Object.keys(yinbiaodetailArr);
			let eq = yblist.indexOf(yinbiao);
			if(eq<yblist.length-1){
			 eq=eq+1;
			 let yinbiao = yblist[eq];
			 this.data.yinbiao = yinbiao;
			 this.currectYinbiao();
			}else{
				app.showToast('已经是最后一个');return;
			}
		},
		audioPlay: function () {
			var that = this;
			var currectDetailArr = this.data.currectDetailArr;
			let audio = 'http://w.360e.cn/yinbiao/audio/'+currectDetailArr['signinf_audio'];
			that.setData({isPlaying:true});
      webAudio.src = audio;
			webAudio.play();
      webAudio.onPlay(()=>{
				console.log('音频开始播放');
      })
      webAudio.onEnded(()=>{
				console.log('音频播放完毕');
				that.setData({isPlaying:false});
      })
		},
		currectYinbiao: function(){
			var currectDetailArr = this.data.yinbiaodetailArr[this.data.yinbiao];
			var signinf_audio = currectDetailArr['signinf_audio'];
			var rename = signinf_audio.replace(".mp3","");
			this.setData({currectDetailArr:currectDetailArr,headerName:this.data.yinbiao,yinbiao:this.data.yinbiao, rename:rename});
			this.audioPlay();
		},
				// 从本地加载缓存
	loadYinbiaoLocal() {
		const cache = wx.getStorageSync('yinbaofayinData') || {};
		if (cache.data && cache.version) {
			this.setData({
				yinbiaoArr: cache.data || [],
				localVersion: cache.version
			},()=>{
			});
			console.log('====yinbiaoArr==',this.data.yinbiaoArr);
		}
	},
	getYinbiao: function(){
		var data = {};
		app.requestData('/yinbiao/getYinbiao','GET', data, (res) => {
				console.log('===res===',res);
				if (res.data.changed) {
					// 数据有更新
					const newData = {
						version: res.data.version,
						data: res.data.data,
						timestamp: Date.now()
					};
					wx.setStorageSync('yinbaofayinData', newData);
					this.setData({
						yinbiaoArr: res.data.data,
						localVersion: res.data.version
					},()=>{
						console.log('====yinbiaoArr==',this.data.yinbiaoArr);
					});
				}
				// 无更新时保持本地数据
			},
			(err) => {
				console.error('请求失败', err);
			}
		);
	},
	loadYinbiaoDetailLocal() {
		const cache = wx.getStorageSync('yinbaofayinDetailData') || {};
		if (cache.data && cache.version) {
			this.setData({
				yinbiaodetailArr: cache.data || [],
				localVersion: cache.version
			},()=>{
				this.currectYinbiao();
			});
			console.log('====yinbaofayinDetailData==',this.data.yinbiaoArr);
		}
	},
	getYinbiaoDetail: function(){
		var data = {};
		app.requestData('/yinbiao/getYinbiaoDetail','GET', data, (res) => {
				console.log('===res===',res);
				if (res.data.changed) {
					// 数据有更新
					const newData = {
						version: res.data.version,
						data: res.data.data,
						timestamp: Date.now()
					};
					wx.setStorageSync('yinbaofayinDetailData', newData);
					this.setData({
						yinbiaodetailArr: res.data.data,
						localVersion: res.data.version
					},()=>{
						console.log('====yinbaofayinDetailData==',this.data.yinbiaoArr);
						this.currectYinbiao();
					});
				}
				// 无更新时保持本地数据
			},
			(err) => {
				console.error('请求失败', err);
			}
		);
	},
		checkyinbiao: function(){
			var that = this;
    //查有没有缓存 token, 缓存可能被清空
			wx.getStorage({
				key: 'yinbiaodetail',
				success(res) {
					console.log(res.data);
					that.setData({yinbiaodetailArr:res.data});
					that.currectYinbiao();
				},
				// 没有缓存token, 需要登录
				fail(e) {
					console.log("not yinbiaodetail...");
					that.getyinbiao();
				}
			})
		},
		getyinbiao: function(){
			var that = this;
			wx.request({
				url: that.data.serverHost + '?ac=getyinbiaodetail',
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
							yinbiaodetailArr: res.data.data
						});
						wx.setStorage({
							key: 'yinbiaodetail',
							data: res.data.data
						});
						that.currectYinbiao();
					} else {
						console.log("我的yinbiaodetail获取失败");
					}
				},
				fail(e) {
					//console.log(e);
					console.log("我的yinbiaodetail获取失败2");
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
					that.setData({scrollTop:data.height});
				}
			}).exec();
			query.select('.playlist').boundingClientRect(data => {
				if (data) {
					that.setData({playlistTop: data.height});
				}
			}).exec();
		},
		doyinbiaolist: function(){
			var yinbiaoArr = this.data.yinbiaoArr['yinbiao'];
			var yblist = [];
			for(let keys in yinbiaoArr){
				for(let k in yinbiaoArr[keys]){
					var yb = yinbiaoArr[keys][k];
					yblist.push(yb[0]);
				}
			}
			this.setData({yblist:yblist});
		},
		checkyinbiaolist: function(){
			var that = this;
    //查有没有缓存 token, 缓存可能被清空
			wx.getStorage({
				key: 'yinbiaolearn',
				success(res) {
					console.log(res.data);
					that.setData({yinbiaoArr:res.data});
					that.doyinbiaolist();
				},
				// 没有缓存token, 需要登录
				fail(e) {
					console.log("not yinbiao...");
					that.getyinbiaolist();
				}
			})
		},
		getyinbiaolist: function(){
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
						that.doyinbiaolist();
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
		gotoYinbiao: function(){
			app.gotoPage("/pages/yinbiao/yinbiao");
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