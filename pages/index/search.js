const app = getApp();
const SEARCH_BASIC_KEY = 'searchBasicData'; // 基础搜索缓存
const SEARCH_DETAIL_KEY = 'searchDetailData'; // 详情缓存
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		audioContext:null,
		isPlaying:-1,
    vgId:0,
    searchValue: '',      // 搜索输入框的值
    searchResult: [],     // 搜索结果
    showResult: false,   // 是否显示搜索结果
		searchHistory:null, //搜索历史
		// 新增：当前选中单词的ID，用于详情页
		selectedWordId: 0,
		selectedWord: ''
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
    this.setData({
			audioContext : wx.createInnerAudioContext(),
      vgId: app.globalData.userVersion.vg_id
		})
		
		// 监听音频播放结束事件
    this.data.audioContext.onEnded(() => {
			console.log('当前单词播放结束');
			this.setData({ isPlaying: -1 });
      // 如果需要在每个单词播放结束后立即切换到下一个，可以在这里调用
    });
    
    // 监听错误
    this.data.audioContext.onError((err) => {
      console.error('音频播放错误:', err);
      wx.showToast({
        title: '播放失败，请重试',
        icon: 'none'
      });
		});
		// 加载搜索历史记录
		this.loadSearchHistory();
	},
	wordAudio(e) {
		const {searchResult,audioContext} = this.data;
		var index = e.currentTarget.dataset.index;
		audioContext.src = searchResult[index].en_audio; // 设置音频源
		audioContext.play(); // 播放
		this.setData({ isPlaying: index});
	},
  // 输入框内容变化时触发
  onInputChange(e) {
    const value = e.detail.value.trim();
    this.setData({
      searchValue: value
    });

    // 可以在这里实现实时搜索（输入时就触发搜索）
    // 为了避免频繁触发，可以添加防抖处理
    if (value) {
      this.debounceSearch(value);
    } else {
      // 输入为空时清空结果
      this.setData({
        searchResult: [],
        showResult: false
      });
    }
	},
	clearSearch:function(){
		console.log('===aaaa==');
		this.setData({
			searchValue:'',
			searchResult: [],
			showResult: false
		});
	},
  // 防抖处理函数
  debounceSearch(value) {
    // 清除之前的定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    // 300毫秒后执行搜索，避免输入过程中频繁触发
    this.searchTimer = setTimeout(() => {
      this.doSearch(value);
    }, 500);
  },

  // 执行搜索逻辑
  doSearch(keyword) {
		var data = { word: keyword };
		// 使用新的基础搜索接口
		app.requestData('/word/searchBasic', 'POST', data, (res) => {
				if (res && res.data && res.data.data) {
						console.log('基础搜索结果:', res.data.data);
						
						// 只缓存基础数据
						const newData = {
								data: res.data.data,
								timestamp: Date.now()
						};
						wx.setStorageSync(SEARCH_BASIC_KEY, newData);
						
						this.setData({
								searchResult: res.data.data.data,
								showResult: true
						});
						
						// 保存搜索词到缓存
						this.saveSearchKeyword(keyword);
				}
		}, (err) => {
				console.error('搜索请求失败', err);
		});
	},

  // 点击搜索按钮或键盘回车时触发
  handleSearch() {
    const { searchValue } = this.data;
    if (searchValue.trim()) {
      this.doSearch(searchValue.trim());
    } else {
      // 提示用户输入搜索内容
      wx.showToast({
        title: '请输入搜索内容',
        icon: 'none',
        duration: 1500
      });
    }
  },

  // 清空输入框
  clearInput() {
    this.setData({
      searchValue: '',
      searchResult: [],
      showResult: false
    });
    // 清除定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  },
	goThisWord: function(e) {
		var index = e.currentTarget.dataset.index;
		var word = this.data.searchResult[index];
		
		if (!word || !word.id) {
				wx.showToast({
						title: '单词信息错误',
						icon: 'none'
				});
				return;
		}
		
		// 保存当前单词信息到全局或缓存
		app.globalData.selectedWord = {
				wordId: word.id,
				word: word.word,
				phonogram_en: word.phonogram_en,
				en_audio: word.en_audio,
				translate: word.translate
		};
		
		console.log(`/pages/index/searchdetail?wordId=${word.id}&word=${word.word}`);
		// 跳转到详情页，传递单词ID
		wx.navigateTo({
			url: `/pages/index/searchdetail?wordId=${word.id}&word=${word.word}`
		});
	},
	//历史记录点击搜索
	historySearch:function(e){
		console.log('事件触发了！e=', e);
		let keyword = e.currentTarget.dataset.keyword;
		this.setData({searchValue:keyword});
		console.log('keyword===',keyword);
		this.doSearch(keyword);
	},
	clearHistory: function(){
		const SEARCH_HISTORY_KEY = 'searchHistory';
		wx.removeStorageSync(SEARCH_HISTORY_KEY);
		// 更新页面数据
		this.setData({
			searchHistory: []
		});
		
		wx.showToast({
			title: '历史搜索已清除',
			icon: 'success',
			duration: 1500
		});
	},
	// 保存搜索词到缓存
	saveSearchKeyword(keyword) {
		const SEARCH_HISTORY_KEY = 'searchHistory';
		let searchHistory = wx.getStorageSync(SEARCH_HISTORY_KEY) || [];
		
		// 移除已存在的相同关键词（避免重复）
		searchHistory = searchHistory.filter(item => item !== keyword);
		
		// 添加到数组开头（最近搜索的排在最前面）
		searchHistory.unshift(keyword);
		
		// 只保留最近20条记录
		if (searchHistory.length > 20) {
			searchHistory = searchHistory.slice(0, 20);
		}
		
		// 保存到缓存
		wx.setStorageSync(SEARCH_HISTORY_KEY, searchHistory);
		console.log('搜索历史已保存:', searchHistory);
	},
	// 加载搜索历史记录
	loadSearchHistory() {
		const SEARCH_HISTORY_KEY = 'searchHistory';
		const searchHistory = wx.getStorageSync(SEARCH_HISTORY_KEY) || [];
		// 如果需要，可以将搜索历史显示在页面上
		if(searchHistory.length) this.setData({ searchHistory: searchHistory });
	},
	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady() {

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