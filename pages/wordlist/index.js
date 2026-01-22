const app = getApp();
import wordDataManager from '../../utils/wordDataManager';
const webAudio = wx.createInnerAudioContext({
	useWebAudioImplement: true
});
const CACHE_KEY = 'wordlistData';

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
		wc_id: -1,
		//弹窗数据
		currentTab:0,
		vgId:0,
		loading: false,
		localVersion: 0,
		unitList:[],           // 单元列表
    currentUnitData: {     // 当前单元数据
      list: [],
      unitInfo: {}
    },
		list: [],
		catelist:[],
		wordRecordList:[],
		itemWidth:[],
		scrollLeft: 0,
		modelList:{
			wordWrite:{name:'单词听写',txt:'开始听写',url:'gowordWrite'},
			wordAnipop:{name:'单词消消乐',txt:'开始消消乐',url:'gowordAnipop'},
			wordTranslate:{name:'看词择义',txt:'开始练习',url:'gowordTranslate'},
			wordAudio:{name:'看词选音',txt:'开始练习',url:'gowordAudio'},
			translateWord:{name:'看义选词',txt:'开始练习',url:'gotranslateWord'},
			default:{name:'单词学习',txt:'开始学习',url:'gowordLearn'}
		},
		model:'default',
		displayWord:false, //单词显隐
		displayTranslate:false, //词义显隐
		checkval:[],
		wordStatusList:[] //单词学习状态
	},
	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		this.setData({
			vgId: app.globalData.userVersion.vg_id
		})
		this.loadUnitList();
	},
	loadUnitList() {
    this.setData({ loading: true });
    wordDataManager.getUnitList(this.data.vgId, (unitList) => {
      this.setData({ 
        unitList: unitList,
        loading: false
      }, () => {
        // 加载第一个单元的单词数据
        if (unitList.length > 0) {
          this.loadUnitData(0);
        }
      });
    });
	},
	/**
   * 加载指定单元的单词数据
   */
  loadUnitData(tabIndex) {
    if (tabIndex >= this.data.unitList.length) return;
    
    const unitId = this.data.unitList[tabIndex].category_id;
    this.setData({ loading: true });
    
    // 直接使用 wordDataManager 加载单元数据
    wordDataManager.getUnitData(this.data.vgId, unitId, (result) => {
      this.setData({ loading: false });
      
      if (result.error) {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
        return;
      }
      
      this.setData({
        currentUnitData: {
          list: result.list || [],
          unitInfo: result.unitInfo || {}
        },
        currentTab: tabIndex,
        scrollLeft: this.calculateScrollLeft(tabIndex)
      }, () => {
				console.log('====list====',this.data.currentUnitData);
        // 预加载下一个单元
        this.preloadNextUnit(tabIndex);
        
        if (this.data.model === 'wordWrite') {
          this.loadAllcheckbox();
        }
        
        if (result.fromRemote) {
          console.log(`单元 ${unitId} 已更新最新数据`);
        } else if (result.fromCache) {
          console.log(`单元 ${unitId} 使用本地缓存数据`);
        }
      });
    });
  },

  /**
   * 预加载下一个单元
   */
  preloadNextUnit(currentTabIndex) {
    const nextTabIndex = currentTabIndex + 1;
    if (nextTabIndex < this.data.unitList.length) {
      const nextUnitId = this.data.unitList[nextTabIndex].category_id;
      wordDataManager.preloadNextUnit(this.data.vgId, nextUnitId, 0);
    }
  },
	wordAudio:function(e){
		var obj = e.currentTarget;
		let wc_id = obj.dataset.wc_id;
		this.data.wc_id = wc_id;
		this.audioPlay();
	},
	//播放音频
	audioPlay: function () {
		var that = this;
		var thisunitlist = this.data.currentUnitData.list;
		var wordItem = thisunitlist[this.data.wc_id];
		let src = wordItem.audio;
		let word_id =  wordItem.word_id;
		that.setData({ wc_id: that.data.wc_id});
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
		this.loadUnitData(index);
	},
  // 滑动内容区域切换
  swiperChange(e) {
		const index = e.detail.current;
    this.setData({
      currentTab: index,
      scrollLeft: this.calculateScrollLeft(index)
		});
		this.loadUnitData(index);
  },

  // 计算标签栏滚动位置
  calculateScrollLeft(index) {
		// 标签栏宽度的一半减去当前标签的一半位置，使当前标签居中显示
		var itemW = this.data.itemWidth;
		var itWidth = this.data.itemWidth[index];
		var widths = 0;
		for(let key in itemW){
			if(key<index) widths+=itemW[key];
		}
		var tabWidth = itWidth; // 每个标签的宽度，根据实际样式调整
		const windowInfo = wx.getWindowInfo()
    var windowWidth = windowInfo.windowWidth;
    return widths - windowWidth / 2 + tabWidth / 2;
	},

	loadAllcheckbox: function(){
		var unitlist = this.data.unitList[this.data.currentTab].list;
		this.data.checkval = unitlist;
	},
	goThisWord:function(e){
		var index = e.currentTarget.dataset.index;
		const unitId = this.data.unitList[this.data.currentTab].category_id;
		let url = "/pages/wordlist/wordlearn?unitId="+unitId+'&wc_id='+index;
		app.gotoPage(url);
	},
	displayWord:function(){
		this.setData({
			displayWord:!this.data.displayWord
		});
	},
	displayTranslate:function(){
		this.setData({
			displayTranslate:!this.data.displayTranslate
		});
	},
	/**==复选框操作=== */
	handleCheckboxChange:function(e){
		var checkval = e.detail.value;
		this.data.checkval = checkval;
	},
	gowordWrite:function(){
		var checkval = this.data.checkval;
		let valstr = checkval.join(",");
		let url = "/pages/wordlist/wordwrite?model="+this.data.model+"&unitIndex="+this.data.currentTab+"&wordIndex="+valstr;
		app.gotoPage(url);
	},
	gowordAnipop:function(){
		let url = "/pages/wordlist/wordanipop?model="+this.data.model+"&unitIndex="+this.data.currentTab;
		app.gotoPage(url);
	},
	gowordTranslate:function(){
		let url = "/pages/wordlist/wordtranslate?model="+this.data.model+"&unitIndex="+this.data.currentTab;
		app.gotoPage(url);
	},
	gowordAudio:function(){
		let url = "/pages/wordlist/wordaudio?model="+this.data.model+"&unitIndex="+this.data.currentTab;
		app.gotoPage(url);
	},
	gotranslateWord:function(){
		let url = "/pages/wordlist/translateword?model="+this.data.model+"&unitIndex="+this.data.currentTab;
		app.gotoPage(url);
	},
	gowordLearn:function(){
		const {currentUnitData,unitList,currentTab} = this.data;
		let list = currentUnitData.list;
		let keys = Object.keys(list);
		const unitId = unitList[currentTab].category_id;
		let url = "/pages/wordlist/wordlearn?unitId="+unitId+'&wc_id='+keys[0];
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
		var that = this;
		const query = wx.createSelectorQuery();
		query.selectAll('.tab-item').boundingClientRect((rects) => {
			if (rects.length) {
				// 1. 先获取并存储每个标签的宽度（此时 itemWidth 才真正有值）
				const tabWidths = rects.map((rect) => rect.width);
				that.setData({ itemWidth: tabWidths });
			}
		}).exec();
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