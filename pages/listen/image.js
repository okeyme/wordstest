// pages/listen/image.js
const app = getApp();
const wxc = app.globalData.wxc;
Page({

    /**
     * 页面的初始数据
     */
    data: {
			serverHost: 'https://bossbell.com/miniprogram/',
			scrollHeight: 1000,
			scrollTop: 0,
			dataArr: '',
			audio: null,
			catearray:null,
			categoryDirShow: false,
			cid:null,
			idlist: '',
			listenList: null,
			listenObj:[{'title':'当前页码','text':'本页字幕内容等待更新'}],
			autopage: false,
			duration: 0, // 音频总时长
			currentTime: 0, // 当前播放时长
			isPlaying: false, // 播放状态
			currentAudioIndex: 0, // 当前播放音频的索引
			myAudio: null,
			showPlayThisRow: false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
			this.data.cid = options.cid;
			if(options.hasOwnProperty('autopage')){
				console.log('接收到autopage='+options.autopage);
				this.setData({autopage:options.autopage});
			}
			const TokenStatus = setInterval(()=>{
				if(app.globalData.token!=''){
					clearInterval(TokenStatus);
					this.checkListen();
					this.checkCategory();
				}
			},100)
		},
	
	// 播放音频
  playAudio: function() {
		var that = this;
		var myAudio = this.data.myAudio;
		if(myAudio!==null){
			myAudio.destroy();
		}
		myAudio = wx.createInnerAudioContext({useWebAudioImplement: true});
		this.data.myAudio = myAudio;
		var list = this.data.listenList;
		let index = this.data.currentAudioIndex;
		var obj = list[index];
		//设置课文
		that.setData({
			listenObj:list[index]
		});
		//设置音频
		let audioSrc = obj.audio;
		console.dir(obj);
    myAudio.title = obj.title;
    myAudio.src = audioSrc;
    myAudio.play();
    this.setData({ isPlaying: true, currentAudioIndex:index });
    // 更新时间
		this.updateTime();
		//监听结束
		myAudio.onPlay(()=>{
			wx.setKeepScreenOn({
				keepScreenOn: true
			});
		});
		myAudio.onPause(() => {
			console.log('音频被暂停/其它程序打断');
			that.setData({ isPlaying: false });
		});
		myAudio.onEnded(()=>{
			console.log('音频播放完毕');
			if(that.data.autopage){
				that.nextAudio();
			}else{
				that.setData({ isPlaying: false });
				wx.setKeepScreenOn({
					keepScreenOn: false
				});
			}
		})
  },
  // 更新播放时间
  updateTime: function() {
		var that = this;
		var myAudio = this.data.myAudio;
    myAudio.onTimeUpdate(() => {
      that.setData({
        duration: myAudio.duration,
        currentTime: myAudio.currentTime
      });
    });
  },
  // 上一首
  prevAudio: function() {
		var that = this;
		var list = this.data.listenList;
    let index = this.data.currentAudioIndex - 1;
    if (index < 0) {
			let idListArr = that.data.idlist.split(",");
			let idIndex = idListArr.indexOf(this.data.cid);
			if(idIndex==0){ //第一个单元，再回到单元列表
				wx.showModal({
					title:'提示',
					content:'已是第一页，是否返回单元列表？',
					showCancel:true,
					cancelText:'否',
					confirmText:'是',
					success:function(res){
						if (res.confirm) {
							wx.navigateTo({
								url: '/pages/category/listen' 
							});
						}
					}
				});
			}else{
				let prev_cid = idListArr[idIndex-1];
				wx.navigateTo({
					url: '/pages/listen/image?cid='+prev_cid+'&autopage='+that.data.autopage
				});
			}
			return;
		}
		this.data.currentAudioIndex = index;
		this.playAudio();
  },
  // 下一首
  nextAudio: function() {
		var that = this;
		var list = this.data.listenList;
		let index = this.data.currentAudioIndex + 1;
		console.log('list lenght='+list.length);
		if (index >= list.length) {
			let idListArr = that.data.idlist.split(",");
      let idIndex = idListArr.indexOf(this.data.cid);
			if(idIndex==idListArr.length-1){ //最后一个单元，再回到单元列表
				wx.showModal({
					title:'提示',
					content:'已是最后一页，是否返回单元列表？',
					showCancel:true,
					cancelText:'否',
					confirmText:'是',
					success:function(res){
						if (res.confirm) {
							wx.navigateTo({
								url: '/pages/category/listen' 
							});
						}
					}
				});
			}else{
				let next_cid = idListArr[idIndex+1];
				wx.navigateTo({
					url: '/pages/listen/image?cid='+next_cid+'&autopage='+that.data.autopage
				});
			}
			return;
		}
		this.data.currentAudioIndex = index;
		this.playAudio();
  },
  // 播放或暂停
  togglePlay: function() {
		var myAudio = this.data.myAudio;
    if (this.data.isPlaying) {
      myAudio.pause();
    } else {
      myAudio.play();
    }
    this.setData({ isPlaying: !this.data.isPlaying });
	},
	seekAudio: function(progress){
		if(!this.data.isPlaying){
			this.playAudio();
		}
		this.data.myAudio.seek(progress);
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
	checkListen: function(){
			var that = this;
		//查有没有缓存 token, 缓存可能被清空
			wxc.get('listenList'+that.data.cid).then(res=>{
				let dataArr = res;
				that.data.dataArr = dataArr;
				let versionNumber = dataArr.version;
				that.checkListen2(versionNumber);
			}).catch(err=>{
				that.getListenlist();
			});
	},
	checkListen2: function(versionNumber){
		app.requestHttp({ac:'checklistenlist',vg_id: app.globalData.vg_id,cid: that.data.cid,versionNumber:versionNumber}).then(res=>{
			if(res.data.code=='10000'){
				that.getListenlist();
			}else{
				console.log("有listenList...");
				var list = res.data.data.data;
				that.setData({
						listenList:list
				});
				that.playAudio();
			}
		}).catch(err=>{

		});
	},
	getListenlist: function(){
		var that = this;
		app.requestHttp({ac:'getlistenlist',vg_id: app.globalData.vg_id,cid: that.data.cid}).then(res=>{
			if (res.data.code == 10000) {
				console.log(res.data.data);
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
			let timer = e.currentTarget.dataset.timer;
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
			url: '/pages/listen/image?cid='+cid+'&autopage='+that.data.autopage // 这里是需要跳转到的页面路径
		});
	},
	gotoListen: function(e){
		let index = e.currentTarget.dataset.index;
		this.data.currentAudioIndex = index-1;
		this.nextAudio();
		this.setData({categoryDirShow: false});
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
			let versionNumber = res.version;
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
					that.setData({scrollHeight: sHeight});
				}
			}).exec();
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
		this.destroyAudio();
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