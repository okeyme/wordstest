// pages/version/index.js
const app = getApp();
const wxc = app.globalData.wxc;
// pages/textbook/textbook.js
const CACHE_KEY = 'versionData';

Page({
  data: {
		windowHeight:0,
		scrollMarginTop:0,
		scrollHeight:0,
		currectStageID:0,
		currectVersionID:1,
		currectVg_id:0,
		gradeArr: ['年级','一年级','二年级','三年级','四年级','五年级','六年级','七年级','八年级','九年级','高一','高二','高三'],
			partArr: ['册序','上册','下册','全一册'],
		stage: [],
    list: [],
    loading: false,
		localVersion: 0,
		stagetab: ['小学','初中','高中','其它'],
		currentTab: 0,
		tabVersionID: 1,
    scrollLeft: 0
  },

  onLoad() {
		if(app.globalData.userVersion.version_id){
			var stage_id = app.globalData.userVersion.stage_id<0 ? 0 : app.globalData.userVersion.stage_id;
			var vg_id = app.globalData.userVersion.vg_id<0 ? 0 : app.globalData.userVersion.vg_id;
			this.setData({
				currentTab:stage_id,
				currectStageID:stage_id,
				currectVersionID:app.globalData.userVersion.version_id,
				currectVg_id:vg_id,
				tabVersionID:app.globalData.userVersion.version_id
			});
		}
		this.loadFromLocal(); // 先加载本地缓存
    this.fetchData();     // 再请求最新数据
  },
  // 从本地加载缓存
  loadFromLocal() {
    const cache = wx.getStorageSync(CACHE_KEY) || {};
    if (cache.data && cache.version) {
      this.setData({
				list: cache.data.list || [],
				stage: cache.data.stage || [],
				stagetab: cache.data.stagetab || [],
        localVersion: cache.version
			});
			this.delstage()
			console.log('====cache version list===',cache.data.list);
    }
  },

  // 请求服务器数据（带Token验证）
  fetchData() {
    this.setData({ loading: true });
		var data = {local_version: this.data.localVersion};
    app.requestData('/version/list','GET', data,
      (res) => {
				console.log('versionData====',res);
        this.setData({ loading: false });
        
        if (res.data.changed) {
          // 数据有更新
          const newData = {
            version: res.data.version,
            data: res.data.data,
            timestamp: Date.now()
          };
          wx.setStorageSync(CACHE_KEY, newData);
          
          this.setData({
						stagetab: res.data.data.stagetab,
						stage: res.data.data.stage,
            list: res.data.data.list,
            localVersion: res.data.version
					});
					this.delstage()
					console.log('stagetab===',this.data.stagetab);
					console.log('stage===',this.data.stage);
        }
        // 无更新时保持本地数据
      },
      (err) => {
        this.setData({ loading: false });
        console.error('请求失败，使用本地缓存', err);
      }
    );
	},
	delstage: function(){
		var stagetab = this.data.stagetab, stage = this.data.stage;
		stagetab.splice(3,1);
		stage.splice(3,1);
		this.setData({ stagetab: stagetab,stage:stage });
	},
	//点击左侧切换教材
	gotoVersion: function(e){
		/*let obj = e.currentTarget.dataset;
		let versionid = obj.versionid;
		this.setData({
			currectVersionID: versionid,
			scrollIntoViewId: 'version'+versionid
		});*/
		let obj = e.currentTarget.dataset;
		let versionid = obj.versionid;
		this.setData({
			tabVersionID: versionid
		});
	},
	//用户设置/切换教材
	changeVersion: function(e){
		if(this.data.loading) return false;
		wx.showLoading({ 
			title: '切换中...',
			mask: true // 防止触摸穿透
		})
		this.data.loading = true;
		var that = this;
		let obj = e.currentTarget.dataset;
		var vg_id = obj.vg_id;
		var vindex = obj.vindex;
		var version_id = obj.versionid;
		var stageindex = obj.stageindex;
		var wordscount = obj.wordscount;
		var data = {vg_id: vg_id,version_id:version_id,stage_id:stageindex,vg_word_count:wordscount};
		// 添加视觉反馈 - 高亮选中的教材
		/*this.setData({
			changingVersionId: vg_id
		});*/

    app.requestData('/version/set','POST', data,
      (res) => {
        if(res.code==0){
          var newUserVersion = res.data.data;
          if(vg_id>0){
            var varr = that.data.list[that.data.tabVersionID][vindex];
          }else{
            var varr = that.data.stage[stageindex][vindex];
          }
					var selectedVersion = { ...varr, ...newUserVersion };
					// ============ 重要：重置学习记录字段 ============
					selectedVersion.word_count = 0;
					selectedVersion.day_word_count = 0;
					selectedVersion.day_revise_count = 0;
					selectedVersion.revise_count = 0;
					// ============================================
          console.log('==selectedVersion==',selectedVersion);
          console.log('==res data==',res);
          // 更新全局数据
          app.globalData.userVersion = selectedVersion;
          wx.setStorageSync('userVersion', selectedVersion);
          // 强烈触发事件 - 添加额外标识
          app.emit('userVersionUpdated', {
            ...selectedVersion,
            _forceUpdate: Date.now() // 确保每次都是新对象
					});
          
          //清除老教材缓存数据
          const keysToRemove = ['wordRecordCount','wordDataCache','wordlistData', 'wordDetaildata', 'wordCollect','ListenlistData','ListenTextData'];
          // 循环删除每个缓存
          keysToRemove.forEach(key => {
            try {
              wx.removeStorageSync(key);
              console.log(`已删除缓存：${key}`);
            } catch (e) {
              console.error(`删除缓存${key}失败：`, e);
            }
          });

          wx.hideLoading();
          wx.showToast({ 
            title: '教材切换成功',
            icon: 'success'
          });
          setTimeout(() => {
            this.data.loading = false;
            app.gotoHome();
          }, 1500);
        }
      },
      (err) => {
				wx.hideLoading();
				this.data.loading = false;
				wx.showToast({ title: '切换失败', icon: 'error' });
				// 重置选中状态
				//this.setData({ changingVersionId: null });
      }
    );
	},
	/**==tab==* */
	// 点击标签切换
  switchTab(e) {
		var index = e.currentTarget.dataset.index;
		var stageindex = index;
		if(stageindex!=this.data.currectStageID){
			var thisversionid = this.data.stage.length>0 ? this.data.stage[stageindex][0].version_id : 0;
		}else{
			var thisversionid = this.data.currectVersionID;
		}
		this.setData({
			tabVersionID:thisversionid,
			currentTab: index
		});
  },
  // 滑动内容区域切换
  swiperChange(e) {
		const index = e.detail.current;
		var stageindex = index;
		if(stageindex!=this.data.currectStageID){
			var thisversionid = this.data.stage.length>0 ? this.data.stage[stageindex][0].version_id : 0;
		}else{
			var thisversionid = this.data.currectVersionID;
		}
		this.setData({
			tabVersionID:thisversionid,
			currentTab: index
		});
  },

  // 计算标签栏滚动位置
  calculateScrollLeft(index) {
		const windowInfo = wx.getWindowInfo();
    // 标签栏宽度的一半减去当前标签的一半位置，使当前标签居中显示
    const tabWidth = 120; // 每个标签的宽度，根据实际样式调整
    const windowWidth = windowInfo.windowWidth;
    return index * tabWidth - windowWidth / 2 + tabWidth / 2;
	},
		/**==/tab==* */
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
		goBack: function() {
			app.gotoBack();
		},
		goHome: function() {
			app.gotoHome();
		},
    onReady() {
			var that = this;
		/*	const windowInfo = wx.getWindowInfo()
			const query = wx.createSelectorQuery();
			query.select('.header').boundingClientRect(data => {
				if (data) {
					let sHeight = windowInfo.windowHeight - data.height;
					that.setData({windowHeight:windowInfo.windowHeight, scrollMarginTop:data.height,scrollHeight: sHeight});
				}
			}).exec();
			setTimeout(function(){
				that.setData({scrollIntoViewId:'version'+that.data.currectVersionID});
			},600);*/
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