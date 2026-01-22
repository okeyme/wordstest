// pages/picture/index.js
const app = getApp()
const webAudio = wx.createInnerAudioContext({
	useWebAudioImplement: true
});
Page({

    /**
     * 页面的初始数据
     */
    data: {
			headerName:'看图学词',
			serverHost: 'https://bossbell.com/miniprogram/',
			scrollTop: 0,
			classArr:[{id:'10',name:'食物',pic:'shiwuqimin.png'},{id:'3',name:'动物',pic:'a-cowanimal.png'},{id:'19',name:'植物',pic:'flower4.png'},{id:'17',name:'颜色',pic:'Colors.png'},{id:'11',name:'蔬菜水果',pic:'shucaishuiguo.png'},{id:'8',name:'人体服装',pic:'maoshan-wpstupian.png'},{id:'7',name:'日常生活',pic:'kafei.png'},{id:'6',name:'交通工具',pic:'a-ditiejiaotonggongju.png'},{id:'16',name:'学习教育',pic:'wodexuexi.png'},{id:'14',name:'文体娱乐',pic:'tiyu.png'},{id:'18',name:'职业身份',pic:'gongwenbao.png'},{id:'5',name:'人物成员',pic:'jiatingchengyuan.png'},{id:'1',name:'方位场所',pic:'weizhi.png'},{id:'4',name:'国家名称',pic:'WORLD.png'},{id:'2',name:'地理自然',pic:'jingdianshanjingqu.png'},{id:'9',name:'时令季节',pic:'mianxingchonglangban.png'},{id:'15',name:'星期月份',pic:'riqi.png'},{id:'12',name:'数字',pic:'shuzi.png'},{id:'13',name:'天气',pic:'tianqi.png'},{id:'-1',name:'其它',pic:'shouye.png'}],
			cid:0,
			picArr:[],
			listArr:[],
			webAudioStatus:false,
			wordItemActive:false,
			exampleAudioStatus:false,
			audioIndex:0,
			pid:0
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
			let cid = options.cid;
			this.setData({cid:cid});
			this.checkCategory();
		},
		detailWord: function(e){
			let id = e.currentTarget.dataset.id;
			let index = e.currentTarget.dataset.index;
			this.data.pid = id;
			this.data.audioIndex = index;
			this.setData({wordItemActive:true});
			this.showPopup();
		},
		showPopup: function(){
			this.setData({audioIndex:this.data.audioIndex, pid:this.data.pid});
			this.popupAudio();
		},
		popupClose: function(){
			this.data.audioIndex = 0;
			this.setData({
				wordItemActive: false
			});
		},
		popupPrev: function(){
			let eq = this.data.audioIndex;
			if(eq>0) eq = eq-1
			else{
				wx.showToast({
					title: '已是第一个',
					icon: 'none',
					duration: 2000
				})
				return;
			}
			this.data.audioIndex = eq;
			this.data.pid = this.data.listArr[eq];
			this.showPopup();
		},
		popupNext: function(){
			let eq = this.data.audioIndex;
			if(eq<(this.data.listArr.length-1)) eq = eq+1
			else{
				wx.showToast({
					title: '已是最后一个',
					icon: 'none',
					duration: 2000
				})
				return;
			}
			this.data.audioIndex = eq;
			this.data.pid = this.data.listArr[eq];
			this.showPopup();
		},
		popupAudio: function(){
			this.audioPlay();
		},
		wordAudio:function(e){
			this.popupClose();
      var obj = e.currentTarget;
			let index = obj.dataset.index;
			this.data.audioIndex = index;
			this.audioPlay();
		},
		exampleAduio: function(e){
			var that = this;
			let exampleObj = e.currentTarget.dataset;
			let exampleIndex = exampleObj.index;
			var obj = this.data.picArr['list'][this.data.pid]
			let src = 'https://bossbell.com/';
			src = src+obj.audio_example;
			that.setData({exampleAudioStatus:true});
      webAudio.src = src;
      webAudio.play();
      webAudio.onPlay(()=>{
      })
      webAudio.onEnded(()=>{
				that.setData({exampleAudioStatus: false});
      })
		},
		audioPlay: function () {
			var that = this;
			var obj = this.data.picArr['list'][this.data.pid]
			let src = 'https://bossbell.com/'+obj.audio_replay;
			let word_id =  obj.word_id;
			//that.setData({ audioIndex: that.data.audioIndex});
      webAudio.src = src;
			webAudio.play();
			this.setData({webAudioStatus:true});
      webAudio.onPlay(()=>{
				console.log('音频开始播放');
      })
      webAudio.onEnded(()=>{
				console.log('音频播放完毕');
				that.setData({webAudioStatus:false});
      })
		},
		showList: function(){
			console.log(this.data.picArr);
			var picarr = this.data.picArr;
			var listarr = picarr['classid'][this.data.cid];
			this.setData({listArr:listarr});
		},
		checkCategory: function(){
			var that = this;
    //查有没有缓存 token, 缓存可能被清空
			wx.getStorage({
				key: 'picture',
				success(res) {
					that.setData({picArr:res.data});
					that.showList();
				},
				// 没有缓存token, 需要登录
				fail(e) {
					console.log("not picture...");
					that.getCategory();
				}
			})
		},
		getCategory: function(){
			var that = this;
			wx.request({
				url: that.data.serverHost + '?ac=getpicture',
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
						console.log(res.data.data);
						that.setData({
							picArr: res.data.data
						});
						wx.setStorage({
							key: 'picture',
							data: res.data.data
						});
						that.showList();
					} else {
						console.log("我的picture获取失败");
					}
				},
				fail(e) {
					//console.log(e);
					console.log("我的picture获取失败2");
				}
			})
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
			const query = wx.createSelectorQuery();
			query.select('.header').boundingClientRect(data => {
				if (data) {
					that.setData({scrollTop:data.height});
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
			webAudio.stop();
			this.data.webAudioStatus = false;
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