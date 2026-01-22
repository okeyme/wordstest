const app = getApp();
const CACHE_KEY = 'ListenlistData';

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		//弹窗数据
		vgId:0,
		loading: false,
		localVersion: 0,
		unitList:[],
		list: [],
		modelList:{
			default:{name:'听课文',txt:'开始听力',url:'gowordLearn'}
		},
		model:'default',
		selectList:[]
	},
	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		let model = 'default';
		if(options.hasOwnProperty("model")){
			model = options.model;
		}
		this.setData({
			vgId: app.globalData.userVersion.vg_id,
			model:model
		},()=>{
			this.loadFromLocal(); // 先加载本地缓存
			this.fetchData();     // 再请求最新数据
		})
	},

	selectCategory: function(e) {
		var index = e.currentTarget.dataset.index;
		var selectList = this.data.selectList;
		var position = selectList.indexOf(index);
		if(position>=0){
			selectList.splice(position,1);
		}else{
			selectList.push(index);
		}
    this.setData({
			selectList: selectList
		});
		console.log('===selectList===',selectList);
	},
	// 从本地加载缓存
	loadFromLocal() {
		const cache = wx.getStorageSync(CACHE_KEY) || {};
		if (cache.data && cache.version) {
			this.setData({
				unitList: cache.data.unitList || [],
				list: cache.data.list || [],
				localVersion: cache.version
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
						localVersion: res.data.version
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
	goListen:function(e){
		var index = e.currentTarget.dataset.index;

		let listenTextArr = [43,45,47,49,51,53,55,57,59,61,71,72,73,74,75,76,77,78,9,11,13,15,63,64,65,66,67,68,69,70,1,3,5,7,343,345,347,349,209,210,211,212,213,214,215,216,482,484,486,488,124,126,128,130,132,134,29,31,33,35,217,218,219,220,221,222,223,224,199,200,201,202,203,204,205,206,207,208,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,266,267,268,269,270,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,56,58,60,62,302,303,304,305,306,307,308,309,310,311,312,313,324,326,328,330,332,334,44,46,48,50,52,54,85,87,89,91,10,12,14,16,344,346,348,350,320,322,319,321,2,4,6,8,483,485,487,489,225,227,229,17,19,21,24,25,27,18,20,22,23,26,28,226,228,230,160,162,125,127,129,131,133,135,30,32,34,36,86,88,90,92,323,325,327,329,331,333,112,114,116,118,120,122,113,115,117,119,121,123,37,38,39,40,41,42,160,161,162,163,164,290,291,292,293,294,295,296,297,298,299,300,301];
		let listenTTSArr = [79,80,81,82,83,84,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159];
		let url = '/pages/listen/image?unitIndex='+index;
		let vg_id = parseInt(app.globalData.userVersion.vg_id);
		if(listenTextArr.indexOf(vg_id)!==-1){
			url = '/pages/listen/text?unitIndex='+index;
		}else if(listenTTSArr.indexOf(vg_id)!==-1){
			url = '/pages/listen/listen?unitIndex='+index;
		}else{
			url = '/pages/listen/title?unitIndex='+index;
		}
		app.gotoPage(url);
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