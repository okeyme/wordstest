const app = getApp();
import wordDataManager from '../../utils/wordDataManager';
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		vgId:0,
		loading: false,
		localVersion: 0,
		unitList:[],
		list: [],
		idlist:[],
		catelist:[],

		recordlist:[],
    learn_time: 0
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		this.setData({
			vgId: app.globalData.userVersion.vg_id,
      learn_time: options.learn_time
    }, () => {
			// 创建异步操作链
			this.loadWordData();
  	});
	},
	loadWordData() {
    wordDataManager.getWordData(this.data.vgId, (result) => {
      if (!result) return;
      this.setData({
        unitList: result.unitList || this.data.unitList,
        list: result.list || this.data.list,
        localVersion: result.version || this.data.localVersion
      }, () => {
				this.getRecord(this.data.learn_time); // 渲染日历
        if (result.fromRemote) {
          console.log('已更新最新数据');
        } else if (result.fromCache) {
          console.log('使用本地缓存数据');
        }
      });
    });
 },
	getRecord: function(learn_time){
		let days = this.data.currentDay;
		var data = {vgId: app.globalData.userVersion.vg_id,learn_time:learn_time,revise:1};
		app.requestData('/word/getRecord','GET', data, (res) => {
				if (res) {
					var recordlist = res.data.data.recordlist;
			
					this.setData({
						recordlist: res.data.data.recordlist,
					});
				}
				// 无更新时保持本地数据
			},
			(err) => {
				console.error('请求失败', err);
			}
		);
	},
	goThisWord: function(e){
		const { index } = e.currentTarget.dataset;
		var recordlist = this.data.recordlist;
		var idlist = [];
		recordlist.forEach(item => {
			idlist.push(item.wc_id);
		});
		let url = "/pages/wordlist/wordlearn?idlist="+idlist.join(",")+"&wordIndex="+index;
		app.gotoPage(url);
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