const app = getApp();
import wordDataManager from '../../utils/wordDataManager';
const webAudio = wx.createInnerAudioContext({
	useWebAudioImplement: true
});
const CACHE_KEY = 'wordlistData';
const CACHE_KEY1 = 'recordlistData';

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		wordRecord:[],
		webAudioStatus: false,
		showWord:true,
		showTranslate: true,
		backgroundAudioStatus: false,
		audioIndex: -1,
		//弹窗数据
		vgId:0,
		loading: false,
		localVersion: 0,
		unitList:[],
		list: [],
		idlist:[],
		catelist:[],
		recordlist:[],
		DateTimeList:[],
		DateTime:[],
		MonthTime:[],
		itemWidth:[],
		currentTab:0,
		scrollLeft: 0
	},
	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		this.setData({
			vgId: app.globalData.userVersion.vg_id
		})
		this.getLast30Days();
		this.loadWordData();
		this.loadlocalRecord();
	},
	loadWordData() {
    wordDataManager.getWordData(this.data.vgId, (result) => {
      if (!result) return;
      this.setData({
        unitList: result.unitList || this.data.unitList,
        list: result.list || this.data.list,
        localVersion: result.version || this.data.localVersion
      }, () => {
        if (result.fromRemote) {
          console.log('已更新最新数据');
        } else if (result.fromCache) {
          console.log('使用本地缓存数据');
        }
      });
    });
 },
	wordAudio:function(e){
		var obj = e.currentTarget;
		let index = obj.dataset.index;
		this.data.audioIndex = index;
		this.audioPlay();
	},
	//播放音频
	audioPlay: function () {
		var that = this;
		var thisunitlist = this.data.unitList[this.data.currentTab].list;
		var thiswordKey = thisunitlist[this.data.audioIndex];
		var wordItem = this.data.list[thiswordKey];
		let src = wordItem.audio;
		let word_id =  wordItem.word_id;
		that.setData({ audioIndex: that.data.audioIndex});
		webAudio.src = src;
		webAudio.play();
		webAudio.onPlay(()=>{
			that.setData({ webAudioStatus: true});
		})
		webAudio.onEnded(()=>{
			that.setData({ webAudioStatus: false});
		})
	},

// 点击标签切换
	switchTab(e) {
		var index = e.currentTarget.dataset.index;
    this.setData({
      currentTab: index,
      scrollLeft: this.calculateScrollLeft(index)
    });
	},
  // 滑动内容区域切换
  swiperChange(e) {
		const index = e.detail.current;
    this.setData({
      currentTab: index,
      scrollLeft: this.calculateScrollLeft(index)
    });
  },

  // 计算标签栏滚动位置
  calculateScrollLeft(index) {
		// 标签栏宽度的一半减去当前标签的一半位置，使当前标签居中显示
		var tabWidth = 58; // 每个标签的宽度，根据实际样式调整
		var widths = tabWidth*index;
		const windowInfo = wx.getWindowInfo()
		var windowWidth = windowInfo.windowWidth;
		if(index>0){
			return widths - windowWidth / 2 + tabWidth / 2;
		}else{
			return 0;
		}
	},
	// 从本地加载缓存
	loadlocalRecord() {
		return new Promise((resolve, reject) => {
			const cache = wx.getStorageSync(CACHE_KEY1) || {};
			if (cache.data && cache.version) {
				var recordlist = cache.data.recordlist;
					console.log('loacl_recordlist=',recordlist);
					this.setData({
						recordlist: cache.data.recordlist,
						DateVersion: cache.version,
						DateTimeList:cache.datetime
					},resolve);
				
			}else{
				resolve();
			}
			this.getRecord();
		});
	},
	getRecord: function(){
		var date = this.getCurrentDate();
		var DateVersion = this.data.DateVersion;
		//if(date==DateVersion) { console.log('====exist===='); return false;}
		console.log('====aaaaaa====');
		var data = {vgId: this.data.vgId};
		console.log('===data',data);
		app.requestData('/word/getRecord','GET', data, (res) => {
				if (res) {
					console.log('res=====',res);
					var recordlist = res.data.recordlist;
					const newData = {
						version: date,
						data: res.data.data,
						datetime:res.data.datetime,
						timestamp: Date.now()
					};
					wx.setStorageSync(CACHE_KEY1, newData);

					this.setData({
						recordlist: res.data.data.recordlist,
						DateVersion: date,
						DateTimeList: res.data.data.datetime
					});
					console.log('DateTimeList===',res.data.datetime);
				}
				// 无更新时保持本地数据
			},
			(err) => {
				console.error('请求失败', err);
			}
		);
	},
	getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份从0开始，所以+1
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
	},
	getLast30Days: function() {
    const DateTime = [],MonthTime = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
        const pastDate = new Date(today);
        pastDate.setDate(today.getDate() - i);
				const year = pastDate.getFullYear();
        // 获取月和日，注意月份是从0开始的
				const month = pastDate.getMonth() + 1;
				const months = String(pastDate.getMonth() + 1).padStart(2, '0');
        const day = pastDate.getDate();
        
				// 组合成 M-D 格式
				DateTime.push(`${year}-${months}-${day}`);
        MonthTime.push(`${month}-${day}`);
    }
    this.setData({DateTime:DateTime,MonthTime:MonthTime});
	},
	goThisWord: function(e){
		const { index } = e.currentTarget.dataset;
		const {DateTimeList,MonthTime,currentTab} = this.data;
		var date = MonthTime[currentTab];
		var idlist = DateTimeList[date];
		let url = "/pages/wordlist/wordlearn?revise=1&wordIndex="+index+"&idlist="+idlist.join(",");
		app.gotoPage(url);
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
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady() {
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