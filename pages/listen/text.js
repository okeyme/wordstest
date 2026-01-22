// pages/listen/text.js
const app = getApp();
const wxc = app.globalData.wxc;
const CACHE_KEY = 'ListenlistData';
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
			cid:null,
			unitList:[],
			list:[],
			idlist: '',
			unitIndex:0,
			listenList: null,
			listenObj:[{'title':'当前页码','text':'本页字幕内容等待更新'}],
			textArr: null,
			textLenArr: null,
			tranArr: null,
			timeArr: null,
			autopage: false,
			duration: 0, // 音频总时长
			currentTime: 0, // 当前播放时长
			isPlaying: false, // 播放状态
			currentAudioIndex: 0, // 当前播放音频的索引
			myAudio: null,
			showPlayThisRow: false,
			endtimer:0
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
			var that = this;
		  var unitIndex = options.unitIndex;
			if(options.hasOwnProperty('autopage')){
				console.log('接收到autopage='+options.autopage);
				this.setData({autopage:options.autopage});
			}
			this.setData({
				unitIndex:unitIndex,
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
					this.nextAudio();
				}else{
					this.setData({ isPlaying: false });
					wx.setKeepScreenOn({
						keepScreenOn: false
					});
				}
			});
			
			// 监听错误
			this.data.audioContext.onError((err) => {
				console.error('音频播放错误:', err);
			/*	wx.showToast({
					title: '播放失败，请重试',
					icon: 'none'
				});*/
			});
		},
	// 暂停播放
	pausePlay() {
		if (!this.data.isPlaying) return;
		this.setData({ isPlaying: false });
		this.data.audioContext.pause();
	},
	// 播放当前单词
	playAudio() {
		const { listenObj,list,idlist,unitIndex,unitList } = this.data;
		const audioContext = this.data.audioContext;
		//audioContext.currentTime = 0;
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
		var endtimer = this.data.endtimer;
    audioContext.onTimeUpdate(() => {
      that.setData({
        duration: audioContext.duration,
        currentTime: audioContext.currentTime
			});
			//console.log('endtimer===',endtimer);
			//console.log('currentTime===',audioContext.currentTime);
			/*if(endtimer>0 && audioContext.currentTime>=endtimer){
				this.pausePlay();
			}*/
    });
  },
  // 上一首
  prevAudio: function() {
		const { list,idlist,unitIndex,unitList,listenIndex } = this.data;
		if(listenIndex<=0){
			app.showToast('已是本单元第1页');
		}else{
			this.setData({
				listenIndex:listenIndex-1
			},()=>{
				this.loadtext();
			});
		}
  },
  // 下一首
  nextAudio: function() {
		const { list,idlist,unitIndex,unitList,listenIndex } = this.data;
		if(listenIndex>=idlist.length-1){
			app.showToast('本单元已播完');
		}else{
			this.setData({
				listenIndex:listenIndex+1
			},()=>{
				this.loadtext();
			});
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
			wx.showToast({
				title: '自动翻页已开启',
				icon: 'none',
				duration: 2000
			})
			this.setData({ autopage: true });
		}else{
			wx.showToast({
				title: '自动翻页已关闭',
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
	loadtext:function(){
		this.pausePlay();
		const {unitIndex,unitList,list,listenIndex} = this.data;
		var idlist = unitList[unitIndex].list;
		var listenObj = list[idlist[listenIndex]];
		let txt = listenObj.text;
		console.log('txt===',txt);
		let tarr = txt.split("(#)");
		let textArr = [], textLenArr=[], cc=0;
		for(let i in tarr){
			if(tarr[i]!=''){
				let tv = tarr[i].trim();
				tv = tv.replace(/\s/g,'(##)');
				var tvarr = tv.split("(##)");
				textArr[i] = tvarr;
				textLenArr[i] = cc+tvarr.length;
				cc = cc + tvarr.length
			}
		}
		console.log('words_starttime===',listenObj.words_starttime);
		let timeArr = listenObj.words_starttime.split(",");
		let transarr = listenObj.translate.split("#");
		console.log('textArr===',textArr);
		console.log('timeArr===',timeArr);
		console.log('textLenArr===',textLenArr);
		console.log('tranArr===',transarr);
		this.setData({
			idlist:idlist,
			listenObj:listenObj,
			textArr:textArr,
			timeArr:timeArr,
			textLenArr:textLenArr,
			tranArr: transarr,
			showPlayThisRow:false
		},()=>{
			this.playAudio();
		});
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
	checkListen: function(){
		var that = this;
		//查有没有缓存 token, 缓存可能被清空
		wxc.get('listenList'+that.data.cid).then(res=>{
			let dataArr = res;
			that.data.dataArr = dataArr;
			let versionNumber = dataArr.version;
			that.checkListen2(versionNumber);
		}).catch(error=>{
			that.getListenlist();
		});
	},
	checkListen2: function(versionNumber){
		var that = this;
		app.requestHttp({ac:'checklistenlist',vg_id:app.globalData.vg_id,cid:that.data.cid,versionNumber:versionNumber}).then(res=>{
			if(res.data.code=='10000'){
				that.getListenlist();
			}else{
				var list = that.data.dataArr;
				that.setData({
						listenList:list
				});
				that.playAudio();
			}
		}).catch(err=>{
			that.getListenlist();
		});
	},
	getListenlist: function(){
			var that = this;
			app.requestHttp({ac:'getlistenlist',vg_id: app.globalData.vg_id,cid: that.data.cid}).then(res=>{
				if (res.data.code == 10000) {
					var list = res.data.data.data;
					that.setData({
						listenList:list
					});
					wx.setStorage({
						key: 'listenList'+that.data.cid,
						data: res.data.data
					});
					that.playAudio();
				} else {
					console.log("listenList获取失败");
				}
			}).catch(err=>{
				app.showError("listenList获取失败2");
			});
	},
	showPlayThisRow: function(){
		this.setData({showPlayThisRow: !this.data.showPlayThisRow});
	},
	playThisRow: function(e){
		if(this.data.showPlayThisRow){
			let parent = e.currentTarget;
			let timer = parent.dataset.timer;
			let endtimer = parent.dataset.endtimer;
			endtimer = parseFloat(endtimer / 1000).toFixed(5);
			this.data.endtimer = endtimer;
			//console.log('timer='+timer);
			timer = parseFloat(timer);
			timer = parseFloat(timer / 1000).toFixed(5);
			console.log('timer='+timer);
			this.seekAudio(timer);
		}
	},
	getCategoryDir: function(){
		this.setData({categoryDirShow: true, cid:this.data.cid});
	},
	gotoCategory: function(e){
		var that = this;
		let cid = e.currentTarget.dataset.cid;
		if(cid==this.data.cid){ return;}
		this.destroyAudio();
		wx.navigateTo({
			url: '/pages/listen/text?cid='+cid+'&autopage='+that.data.autopage // 这里是需要跳转到的页面路径
		});
	},
	gotoListen: function(e){
		const {idx,index} = e.currentTarget.dataset;
		this.setData({listenIndex:idx,unitIndex:index,categoryDirShow: false},()=>{
			this.loadtext();
		});
	},
	closeCategoryDir: function(){
		this.setData({categoryDirShow: false});
	},
	checkCategory: function(){
		var that = this;
	//查有没有缓存 token, 缓存可能被清空
		wxc.get('listencatearray'+app.globalData.vg_id).then(res=>{
			let catearray = res.data;
			that.data.catearray = catearray;
			console.log('catearray',catearray);
			let versionNumber = res.data.version;
			let idarr = Object.keys(catearray.data.data);
			let idlist = idarr.join(",");
			that.checkCategory2(versionNumber);
			that.setData({catearray:catearray,idlist:idlist});
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
				var idlist = that.data.idlist;
				that.setData({catearray:res,idlist:idlist});
			}
		}).catch(err=>{
			that.getCategory();
		});
	},
	getCategory: function(){
		var that = this;
		app.requestHttp({ac:'getlistencategory',vg_id: app.globalData.vg_id}).then(res=>{
			if (res.data.code == 10000) {
				let idarr = Object.keys(res.data.data.data);
				let idlist = idarr.join(",");
				that.setData({
					catearray: res.data.data.data,
					idlist:idlist
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