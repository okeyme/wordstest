// pages/translate/index.js
const app = getApp();
const webAudio = wx.createInnerAudioContext({
	useWebAudioImplement: true
});
Page({

    /**
     * 页面的初始数据
     */
    data: {
			serverHost: 'https://bossbell.com/miniprogram/',
			scrollHeight: '200px',
			scrollTop: 0,
			webAudioStatus: false,
			audioIndex: -1,
			audioidx: -1,
			audioType: 1,
			pickerShow: false,
			pickerArray: ['自动检测语言','中 译 英','英 译 中'],
			pickerValue: [0],
			pickerIndex: 0,
			txtValue: '',
			from: '',
			to: '',
			translateArr: [],
			dataList: [],
			audioList: [],
			TextHistory:[]
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
			this.checkHistory();
		},
		checkHistory: function(){
			var that = this;
    //查有没有缓存 token, 缓存可能被清空
			wx.getStorage({
				key: 'TextHistory',
				success(res) {
					console.log("有TextHistory...");
					console.log(res.data);
					that.setData({TextHistory:res.data});
				},
				// 没有缓存token, 需要登录
				fail(e) {
					console.log("not TextHistory...");
				}
			})
		},
		wordAudio:function(e){
      var obj = e.currentTarget;
			let index = obj.dataset.index;
			this.data.audioIndex = index;
			this.data.audioidx = -1;
			this.data.audioType = 1;
			this.audioPlay();
		},
		wordAudio2:function(e){
      var obj = e.currentTarget;
			let index = obj.dataset.index;
			let idx = obj.dataset.idx;
			this.data.audioIndex = index;
			this.data.audioidx = idx;
			this.data.audioType = 2;
			this.audioPlay();
		},
		audioPlay: function () {
			var that = this;
			if(this.data.audioType==1){
				var obj = this.data.dataList[this.data.audioIndex];
			}else{
				var obj = this.data.TextHistory[this.data.audioidx][this.data.audioIndex];
			}
			let src = 'https://dict.youdao.com/dictvoice?audio=test&type=1';
			if(obj.lang=='zh-CHS2en'){
				src='https://dict.youdao.com/dictvoice?audio='+obj.translate+'&type=1';
			}else{
				src='https://dict.youdao.com/dictvoice?audio='+obj.content+'&type=1';
			}

			that.setData({audioidx:that.data.audioidx, audioIndex: that.data.audioIndex});
			if(this.data.audioType==1){
				that.setData({ audioIndex: that.data.audioIndex});
			}else{
				that.setData({audioidx:that.data.audioidx, audioIndex: that.data.audioIndex});
			}
      webAudio.src = src;
      webAudio.play();
      webAudio.onPlay(()=>{
				console.log('音频开始播放');
				that.data.webAudioStatus = true;
      })
      webAudio.onEnded(()=>{
				console.log('音频播放完毕');
				that.setData({ audioIndex: -1});
				that.data.webAudioStatus = false;
      })
		},
		showTranslate: function(){
			var that = this;
			var audioList = [];
			var tranArr = this.data.translateArr;
			var content = this.data.txtValue;
			content = content.trim();
			var from = this.data.from;
			var to = this.data.to;
			var explains = [];
			if(tranArr['errorCode']==0){
				let tarr = tranArr['translation'];
				let lang = tranArr['l'];
				for(let key in (tarr)){
					let arr = {content:content, translate:tarr[key], lang:lang};
					explains.push(arr);
				}
				//basic
				console.log(explains);
				that.setData({dataList:explains});
				//加历史
				var TextHistory = that.data.TextHistory;
				if(TextHistory.length>=5){
					TextHistory.pop();
				}
				TextHistory.unshift(explains);
				wx.setStorage({
					key: 'TextHistory',
					data: TextHistory
				});
			}else{
				//查询出错
			}
		},
		checkTranslate: function(content,from,to){
			var that = this;
    //查有没有缓存 token, 缓存可能被清空
			wx.getStorage({
				key: 'textTranslate',
				success(res) {
					console.log("有textTranslate...");
					console.log(res.data);
					that.data.translateArr = res.data;
					that.showTranslate();
				},
				// 没有缓存token, 需要登录
				fail(e) {
					console.log("not textTranslate...");
					that.toTranslate(content,from,to);
				}
			})
		},
		toTranslate: function(content,from,to){
			var that = this;
			wx.request({
				url: that.data.serverHost + '?ac=texttranslate',
				method: 'POST',
				data: {
					token: app.globalData.token,
					uid: app.globalData.uid,
					content: content,
					from: from,
					to: to
				},
				header: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				success(res) {
					if (res.data.code == 10000) {
						let arr = res.data.data;
						console.log(arr);
						that.data.translateArr = arr;
						that.showTranslate();
						wx.setStorage({
							key: 'textTranslate',
							data: res.data.data
						});
					} else {
						console.log("查询翻译成功");
					}
				},
				fail(e) {
					//console.log(e);
					console.log("查询翻译失败");
				}
			})
		},
		doTranslate: function(){
			var that = this;
			if(this.data.txtValue==''){
				app.showToast('请输入翻译内容');
				return;
			}
			var value = this.data.txtValue;
			that.toTranslate(value,'auto','auto');
		},
		getTextarea: function(e){
			let value = e.detail.value;
			this.setData({
				txtValue: value
			});
		},
		changeLanguage: function(){
			let pickerIndex = this.data.pickerIndex;
			this.setData({ pickerIndex:pickerIndex, pickerValue:[pickerIndex], pickerShow: !this.data.pickerShow});
		},
		onChangePicker: function(e){
			// 获取当前选中的值的索引
			let index = e.detail.value;
			// 根据索引获取对应的列表项
			this.data.pickerIndex = index;
		},
		showPicker: function(){
			this.setData({ pickerShow: !this.data.pickerShow});
		},
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {
		},
		gotextTranslate: function(){
			app.gotoPage("/pages/translate/index");
		},
		govoiceTranslate: function(){
			app.gotoPage("/pages/translate/voice");
		},
		goimageTranslate: function(){
			app.gotoPage("/pages/translate/image");
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