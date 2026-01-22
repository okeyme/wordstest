// pages/listen/text.js
const app = getApp();
const wxc = app.globalData.wxc;
const CACHE_KEY = 'ListenTitleData';
Page({

    /**
     * 页面的初始数据
     */
    data: {
			unitList:[],
			list:[],
			idlist: '',
			unitIndex:0,
			listenIndex:0,
			audioContext:null,

			serverHost: 'https://bossbell.com/miniprogram/',
			scrollHeight: 1000,
			scrollTop: 0,
			dataArr:'',
			audio: null,
			catearray:null,
			categoryDirShow: false,
			unitList:[],
			list:[],
			autopage: false,
			duration: 0, // 音频总时长
			currentTime: 0, // 当前播放时长
			isPlaying: false, // 播放状态
			currentAudioIndex: 0 // 当前播放音频的索引
    },

    /**
     * 生命周期函数--监听页面加载
     */
	onLoad(options) {
		var that = this;
		this.setData({
			audioContext : wx.createInnerAudioContext()
		},()=>{
			this.loadFromLocal();
			this.fetchData();
		})

		// 监听音频播放结束事件
		this.data.audioContext.onEnded(() => {
			console.log('当前单词播放结束');
			this.setData({ currentTime:this.data.duration,isPlaying: false });
			// 如果需要在每个单词播放结束后立即切换到下一个，可以在这里调用
			if(this.data.autopage){
				console.log('====next===');
				this.nextAudio();
			}else{
				console.log('====ede===');
				this.setData({ isPlaying: false });
				wx.setKeepScreenOn({
					keepScreenOn: false
				});
			}
		});
	},
	playThis: function(e){
		const index = e.currentTarget.dataset.index;
		this.setData({currentAudioIndex:index});
		this.playAudio();
	},
	// 暂停播放
	pausePlay() {
		if (!this.data.isPlaying) return;
		this.setData({ isPlaying: false });
		this.data.audioContext.pause();
	},
	// 播放当前单词
	playAudio: function() {
		const { list,currentAudioIndex } = this.data;
		var listenObj = list[currentAudioIndex];
		const audioContext = this.data.audioContext;
		audioContext.currentTime = 0;
		audioContext.src = listenObj.audio; // 设置音频源
		audioContext.play(); // 播放
		this.setData({ isPlaying: true});
		this.updateTime();
		//监听结束
		audioContext.onPlay(()=>{
			wx.setKeepScreenOn({
				keepScreenOn: true
			});
		});
	},
  // 更新播放时间
  updateTime: function() {
		var that = this;
		var audioContext = this.data.audioContext;
    audioContext.onTimeUpdate(() => {
      that.setData({
        duration: audioContext.duration,
        currentTime: audioContext.currentTime
			});
    });
  },
  // 上一首
  prevAudio: function() {
		const { list,currentAudioIndex } = this.data;
		if(currentAudioIndex<=0){
			app.showToast('已是第1个听力');
		}else{
			this.setData({
				currentAudioIndex:currentAudioIndex-1
			});
			this.playAudio();
		}
  },
  // 下一首
  nextAudio: function() {
		const { list,currentAudioIndex } = this.data;
		if(currentAudioIndex>=list.length-1){
			app.showToast('已是最后1个听力');
		}else{
			this.setData({
				currentAudioIndex:currentAudioIndex+1
			});
			this.playAudio();
		}
  },
  // 播放或暂停
  togglePlay: function() {
		var audioContext = this.data.audioContext;
    if (this.data.isPlaying) {
      audioContext.pause();
    } else {
      audioContext.play();
    }
    this.setData({ isPlaying: !this.data.isPlaying });
	},
	seekAudio: function(progress){
		if(!this.data.isPlaying){
			this.playAudio();
		}
		this.data.audioContext.seek(progress);
	},
	autoPage: function(){
		if(this.data.autopage===false){
			app.showToast('自动连播已开启');
			this.setData({ autopage: true });
		}else{
			app.showToast('自动连播已关闭');
			this.setData({ autopage: false });
		}
	},
	onProgressChange: function(e){
		let progress = e.detail.value;
		this.seek(progress);
	},
	loadtext:function(){
		
	},
	// 从本地加载缓存
	loadFromLocal() {
		const cache = wx.getStorageSync(CACHE_KEY) || {};
		if (cache.data && cache.version) {
			this.setData({
				unitList: cache.data.unitList || [],
				list: cache.data.list || [],
				localVersion: cache.version
			},()=>{
				this.loadtext();
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
						localVersion: res.data.version,
					},()=>{
						this.loadtext();
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
	closeCategoryDir: function(){
		this.setData({categoryDirShow: false});
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

  },
	destroyAudio: function(){
		if(this.data.myAudio!==null){
			this.data.myAudio.stop();
			this.data.myAudio.destroy();
			this.data.myAudio = null;
		}
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
		this.pausePlay();
		this.data.audioContext.destroy();
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