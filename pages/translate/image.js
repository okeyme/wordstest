// pages/translate/image.js
const app = getApp();
const util = require('../../utils/util.js');
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
			tempFilePath:'',
			tiptxt: '拍照或从手机相册中选择图片',
			from: '',
			to: '',
			result: [],
			resultMsg: '',
			audioIndex: -1,
			audioidx: -1,
			audioType: 1,
			webAudioStatus: false,
			oldImagePath: '',
			ImageHistory: [],
			HistoryTime: [],
			cropX: 0,
			cropY: 0,
			cropWidth: 100,
			cropHeight: 100
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
				key: 'ImageHistory',
				success(res) {
					console.log("有ImageHistory...");
					console.log(res.data);
					var arr = res.data;
					let tarr = [];
					for(let key in arr){
						tarr[key]= arr[key][0].createtime;
					}
					console.log(tarr);
					that.setData({ImageHistory:res.data, HistoryTime:tarr});
				},
				// 没有缓存token, 需要登录
				fail(e) {
					console.log("not ImageHistory...");
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
				var obj = this.data.result[this.data.audioIndex];
			}else{
				var obj = this.data.ImageHistory[this.data.audioidx][this.data.audioIndex];
			}
			let src = 'https://dict.youdao.com/dictvoice?audio=test&type=1';
			if(obj.lang=='en'){
				src='https://dict.youdao.com/dictvoice?audio='+obj.context+'&type=1';
			}else{
				src='https://dict.youdao.com/dictvoice?audio='+obj.tranContent+'&type=1';
			}
			that.setData({audioidx:that.data.audioidx, audioIndex: that.data.audioIndex});
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
		toTranslate: function(content,from,to){
			var that = this;
			wx.request({
				url: that.data.serverHost + '?ac=imagetranslate',
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
					console.log(res);
					if (res.data.code == 10000) {
						let resarr = res.data.data;
						resarr = JSON.parse(resarr);
						let list = [];
						if(resarr.errorCode==0){
							if(resarr.hasOwnProperty('resRegions')){
								var resRegions = resarr['resRegions'];
								console.log(resRegions);
								that.data.oldImagePath = that.data.tempFilePath;
								that.setData({result:resRegions, translateStatus:0});
								that.checkHistory();
								let createtime = util.recordTime(new Date());
								for(let key in resRegions){
									resRegions[key]['createtime'] = createtime;
								}
								var ImageHistory = that.data.ImageHistory;
								if(ImageHistory.length>=5){
									ImageHistory.pop();
								}
								ImageHistory.unshift(resRegions);
								wx.setStorage({
									key: 'ImageHistory',
									data: ImageHistory
								});
							}
						}else{
							that.setData({resultMsg:'查询出错，请反馈给客服。',translateStatus:0});
						}
						
					} else {
						console.log("查询翻译成功");
					}
				},
				fail(e) {
					//console.log(e);
					app.showToast("查询翻译失败");
				}
			})
		},
		doTranslate: function(){
			var that = this;
			if(this.data.tempFilePath==''){
				app.showToast('请选择要翻译的图片或拍照');
				return;
			}
			let tempFilePath = this.data.tempFilePath;
			if(this.data.oldImagePath==tempFilePath){
				return;
			}
			this.setData({translateStatus:1});
			wx.getFileSystemManager().readFile({ // 读取本地文件内容
				filePath: tempFilePath,
				encoding: 'base64', //编码格式
				success(res) {
					let base64 = 'data:image/png;base64,'+res.data;
					that.toTranslate(res.data,'auto','auto');
				},
				fail(e) {
					app.showToast("图片转码失败，请重新上传图片");
				}
			})
		},
		chooseImage: function(){
			var that = this;
			wx.chooseMedia({
				count: 1,
				mediaType: ['image'],
				sourceType: ['album', 'camera'],
				camera: 'back',
				success(res) {
					let tempFilePath = res.tempFiles[0].tempFilePath;
					that.setData({tempFilePath:tempFilePath, tiptxt:'点击图片可更换'});
					/*
					wx.cropImage({
						src: tempFilePath, // 图片路径
						cropScale: '1:1', // 裁剪比例
						success: function (res) {
							if (!/(\.jpg|\.png|\.jpeg)$/.test(res.tempFilePath.toLowerCase())) {
								wx.showToast({
									title: '请上传jpg、png或jpeg格式的图片',
									icon: 'none',
								});
								return;
							}
							var croptempFilePaths = res.tempFilePath;
							console.log('裁剪图',croptempFilePaths)
							that.setData({tempFilePath:croptempFilePaths, tiptxt:'点击图片可更换'});
							
						}
					})*/
				}
			})
		},
		getTextarea: function(e){
			let value = e.detail.value;
			this.data.txtValue = value;
		},
		changeLanguage: function(){
			let pickerIndex = this.data.pickerIndex;
			let arr = [pickerIndex];
			this.setData({ pickerIndex:pickerIndex, pickerValue:arr, pickerShow: !this.data.pickerShow});
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