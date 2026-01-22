// pages/listen/listen.js
const app = getApp();
const wxc = app.globalData.wxc;
const CACHE_KEY = 'ListenlistData';
const CACHE_KEY1 = 'ListenTextData';
const backgroundAudioManager = wx.getBackgroundAudioManager();
Page({

    /**
     * 页面的初始数据
     */
    data: {
			serverHost: 'https://bossbell.com/miniprogram/',
			scrollHeight: 1000,
			titleArr: [],
			audioArr: [],
			dataArr:'',
			catearray:'',
			backgroundAudioStatus: false,
			audioIndex: -1,
			unitIndex:0,
			autopage:false,
			duration: 0, // 音频总时长
			currentTime: 0, // 当前播放时长
			loading: false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
			var unitIndex = options.unitIndex;
			this.data.unitIndex = unitIndex;
			this.loadFromLocal();
			this.fetchData();
			this.loadListenTitleLocal();
			this.fetchListenTitleData();
		},
		// 从本地加载缓存
	loadFromLocal() {
		const cache = wx.getStorageSync(CACHE_KEY) || {};
		if (cache.data && cache.version) {
			this.setData({
				unitList: cache.data.unitList || [],
				list: cache.data.list || [],
				localVersion: cache.version
			});
		}
	},

	// 请求服务器数据（带Token验证）
	fetchData() {
		this.setData({ loading: true });
		var data = {vgId: app.globalData.userVersion.vg_id, local_version: this.data.localVersion};
		app.requestData('/listen/getUnit','GET', data,(res) => {
				this.setData({ loading: false });
				console.log('res===',res);
				if (res.data.changed) {
					// 数据有更新
					const newData = {
						version: res.data.version,
						data: res.data.data,
						timestamp: Date.now()
					};
					wx.setStorageSync(CACHE_KEY, newData);
					
					this.setData({
						unitList: res.data.data.unitList,
						list: res.data.data.list,
						localVersion: res.data.version
					});
				}
				// 无更新时保持本地数据
			},
			(err) => {
				this.setData({ loading: false });
				console.error('请求失败，使用本地缓存', err);
			}
		);
	},
	// 从本地加载缓存
	loadListenTitleLocal() {
		wx.removeStorageSync(CACHE_KEY1);
		const cache = wx.getStorageSync(CACHE_KEY1) || {};
		if (cache.data && cache.version) {
			console.log('====cache.data==',cache.data);
			this.setData({
				list: cache.data.list || [],
				localVersion: cache.version
			});
			var listarr = cache.data.list;
			let titlestr = listarr.title;
			let titleArr = titlestr.split("#");
			let audiostr = listarr.audio;
			let audioArr = audiostr.split("#");
			this.setData({
				titleArr: titleArr,
				audioArr: audioArr,
				localVersion: res.data.version
			});
		}
	},

	// 请求服务器数据（带Token验证）
	fetchListenTitleData() {
		this.setData({ loading: true });
		var data = {vgId: app.globalData.userVersion.vg_id, local_version: this.data.localVersion};
		console.log('====data==',data);
		app.requestData('/listen/getListenTitle','GET', data,(res) => {
				this.setData({ loading: false });
				console.log('listen text res===',res);
				if (res.data.changed) {
					// 数据有更新
					const newData = {
						version: res.data.version,
						data: res.data.data,
						timestamp: Date.now()
					};
					wx.setStorageSync(CACHE_KEY1, newData);
					var listarr = res.data.data.list;
					let titlestr = listarr.title;
					let titleArr = titlestr.split("#");
					let audiostr = listarr.audio;
					let audioArr = audiostr.split("#");
					this.setData({
						titleArr: titleArr,
						audioArr: audioArr,
						localVersion: res.data.version
					});
				}
				// 无更新时保持本地数据
			},
			(err) => {
				this.setData({ loading: false });
				console.error('请求失败，使用本地缓存', err);
			}
		);
	},
		checkListenList: function(){
			var that = this;
		//查有没有缓存 token, 缓存可能被清空
			wxc.get('newlistenlist'+app.globalData.vg_id).then(res=>{
				let dataArr = res;
				that.data.dataArr = dataArr;
				let versionNumber = dataArr.version;
				that.checkListenList2(versionNumber);
			}).catch(err=>{
				that.getListenList();
			});
		},
		checkListenList2: function(versionNumber){
			var that = this;
			console.log('==checknewlisten==');
			app.requestHttp({ac:'checknewlisten',vg_id: app.globalData.vg_id,versionNumber:versionNumber}).then(res=>{
				console.log('code=',res.data.code);
				if(res.data.code==10000){
					that.getListenList();
				}else{
						var listarr = that.data.dataArr;
						let titlestr = listarr.title;
						let titleArr = titlestr.split("#");
						let audiostr = listarr.audio;
						let audioArr = audiostr.split("#");
						that.setData({
							titleArr: titleArr,
							audioArr: audioArr
						});
				}
			}).catch(err=>{
				that.getListenList();
			});
		},
		getListenList: function(){
			var that = this;
			wx.request({
				url: that.data.serverHost + '?ac=getnewlisten',
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
						var listarr = res.data.data;
						let titlestr = listarr.title;
						let titleArr = titlestr.split("#");
						let audiostr = listarr.audio;
						let audioArr = audiostr.split("#");
						that.setData({
							titleArr: titleArr,
							audioArr: audioArr
						});
						wx.setStorage({
							key: 'newlistenlist'+app.globalData.vg_id,
							data: listarr
						});
						console.log(listarr);
					} else {
						console.log("我的newListenList获取失败");
					}
				},
				fail(e) {
					//console.log(e);
					console.log("我的newListenList获取失败2");
				}
			})
		},
		playAudio: function(e){
			let index = e.currentTarget.dataset.index;
			this.data.audioIndex = index;
			this.backgroundAudioManagerPlay();
		},
		playAudio2: function(){
			var that = this;
			if(this.data.audioIndex==-1){
				this.data.audioIndex = 0;
			}
			if(this.data.backgroundAudioStatus){
				backgroundAudioManager.pause();
				backgroundAudioManager.onPause(()=>{
					that.setData({ backgroundAudioStatus:!that.data.backgroundAudioStatus});
				});
			}else{
				this.backgroundAudioManagerPlay();
			}
		},
		backgroundAudioManagerAuto: function(){
			var that = this;
			if(this.data.backgroundAudioStatus){
				backgroundAudioManager.pause();
				backgroundAudioManager.onPause(()=>{
					that.data.backgroundAudioStatus = false;
					that.setData({ backgroundAudioStatus:that.data.backgroundAudioStatus});
				});
			}else{
				this.backgroundAudioManagerPlay();
			}
		},
		backgroundAudioManagerPlay: function(){
			var that = this;
			var audioIndex = this.data.audioIndex; 
			var audio = this.data.audioArr[audioIndex];
			audio = 'https://w.360e.cn/uploads/2024listen/'+audio;
			var title = this.data.titleArr[audioIndex];
			backgroundAudioManager.title = title;
			backgroundAudioManager.singer = '同步英语';
			backgroundAudioManager.src = audio;
			let coverImage = '';	
			backgroundAudioManager.coverImgUrl = coverImage;
			
			that.setData({ audioIndex: audioIndex, backgroundAudioStatus:true, loading:true});

			// 播放模式设置为列表循环
			backgroundAudioManager.onPlay(() => {
				// 当播放开始时，可以处理一些逻辑
				that.setData({ loading:false});
			});
			backgroundAudioManager.onError((res) => {
				// 当播放出错时，可以处理一些逻辑
				that.data.audioIndex = that.data.audioIndex+1;
			});
			backgroundAudioManager.onStop(() => {
				// 当播放停止时，可以处理一些逻辑
				that.data.backgroundAudioStatus = false;
				that.setData({  backgroundAudioStatus:that.data.backgroundAudioStatus});
			});
			backgroundAudioManager.onEnded(() => {
				that.setData({  backgroundAudioStatus:that.data.backgroundAudioStatus});
				if(that.data.autopage){
					that.backgroundAudioManagerNext();
				}else{
					that.setData({ backgroundAudioStatus: false });
				}
			});
			// 音频播放错误监听
			backgroundAudioManager.onError((err) => {
				console.error(err);
				that.data.audioIndex = that.data.audioIndex+1;
				// 错误处理逻辑
			});
			backgroundAudioManager.play();
			this.updateTime();
		},
		backgroundAudioManagerNext: function(){
			var that = this;
			if(this.data.audioIndex<this.data.audioArr.length-1){
					this.data.audioIndex = this.data.audioIndex+1;
					that.backgroundAudioManagerPlay();
			}else{
				this.data.audioIndex = this.data.audioArr.length-1;
				that.data.backgroundAudioStatus = false;
			}
		},
		backgroundAudioManagerPrev: function(){
			var that = this;
			if(this.data.audioIndex>0){
				this.data.audioIndex = this.data.audioIndex-1;
				that.backgroundAudioManagerPlay();
			}else{
				this.data.audioIndex = 0;
				that.data.backgroundAudioStatus = false;
			}
		},
		// 更新播放时间
		updateTime: function() {
			var that = this;
			var myAudio = this.data.myAudio;
			backgroundAudioManager.onTimeUpdate(() => {
				that.setData({
					duration: backgroundAudioManager.duration,
					currentTime: backgroundAudioManager.currentTime
				});
			});
		},
		autoPage: function(){
			if(this.data.autopage===false){
				wx.showToast({
					title: '自动连播已开启',
					icon: 'none',
					duration: 2000
				})
				this.setData({ autopage: true });
			}else{
				wx.showToast({
					title: '自动连播已关闭',
					icon: 'none',
					duration: 2000
				})
				this.setData({ autopage: false });
			}
		},
		onProgressChange: function(e){
			let progress = e.detail.value;
			console.log('progress='+progress);
			this.seek(progress);
		},

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
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
						that.setData({scrollTop:data.height});
					}
				}).exec();
				query.select('.playlist').boundingClientRect(data => {
					if (data) {
						let sHeight = windowInfo.windowHeight - data.height;
						that.setData({scrollHeight: sHeight-10});
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