const app = getApp();
import wordDataManager from '../../utils/wordDataManager';

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
			wordWrite:{name:'单词听写',txt:'开始听写',url:'gowordWrite'},
			wordAnipop:{name:'单词消消乐',txt:'开始消消乐',url:'gowordAnipop'},
			wordTranslate:{name:'看词择义',txt:'开始练习',url:'gowordTranslate'},
			wordAudio:{name:'看词选音',txt:'开始练习',url:'gowordAudio'},
			wordSpell:{name:'滚动拼词',txt:'开始练习',url:'gowordSpell'},
			translateWord:{name:'看义选词',txt:'开始练习',url:'gotranslateWord'},
			translateAudio:{name:'看义选词',txt:'开始练习',url:'gotranslateAudio'},
			translateSpell:{name:'看义拼词',txt:'开始练习',url:'gotranslateSepll'},
			listenWord:{name:'听音选词',txt:'开始练习',url:'golistenWord'},
			listenTranslate:{name:'听音选词',txt:'开始练习',url:'golistenTranslate'},
      listenSpell:{name:'听音选词',txt:'开始练习',url:'golistenSpell'},
      wordSpeak:{name:'发音测评',txt:'开始测评',url:'gowordSpeak'},
			default:{name:'单词学习',txt:'开始学习',url:'gowordLearn'}
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
			this.loadUnitList();
		})
	},
	loadUnitList() {
    this.setData({ loading: true });
    wordDataManager.getUnitList(this.data.vgId, (unitList) => {
      this.setData({ 
        unitList: unitList,
        loading: false
      });
    });
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
	retunUnitId:function(){
		let unitList = this.data.unitList;
		let selectList = this.data.selectList;
		if(selectList.length==0){
			app.showToast('请选择单元');return;
		}
		let unitIdArray = [];
		selectList.forEach(index=>{
			unitIdArray.push(unitList[index].category_id);
		})
		let idstr = unitIdArray.join(",");
		console.log('====idstr===',idstr);
		if(idstr==''){
			app.showToast('出错，单元数据为空！');return;
		}
		return idstr;
	},
	gowordWrite:function(){
		let idstr = this.retunUnitId();
		let url = "/pages/wordlist/wordwrite?unitId="+idstr;
		app.gotoPage(url);
	},
	gowordAnipop:function(){
		let idstr = this.retunUnitId();
		let url = "/pages/wordlist/wordanipop?unitId="+idstr;
		app.gotoPage(url);
	},
	gowordTranslate:function(){
		let idstr = this.retunUnitId();
		let url = "/pages/wordlist/wordtranslate?unitId="+idstr;
		app.gotoPage(url);
	},
	gowordAudio:function(){
		let idstr = this.retunUnitId();
		let url = "/pages/wordlist/wordaudio?unitId="+idstr;
		app.gotoPage(url);
	},
	gowordSpell:function(){
		let idstr = this.retunUnitId();
		let url = "/pages/wordlist/wordspell?unitId="+idstr;
		app.gotoPage(url);
	},
	gotranslateWord:function(){
		let idstr = this.retunUnitId();
		let url = "/pages/wordlist/translateword?unitId="+idstr;
		app.gotoPage(url);
	},
	gotranslateAudio:function(){
		let idstr = this.retunUnitId();
		let url = "/pages/wordlist/translateaudio?unitId="+idstr;
		app.gotoPage(url);
	},
	gotranslateSepll:function(){
		let idstr = this.retunUnitId();
		let url = "/pages/wordlist/translatespell?unitId="+idstr;
		app.gotoPage(url);
	},
	golistenWord:function(){
		let idstr = this.retunUnitId();
		let url = "/pages/wordlist/listenword?unitId="+idstr;
		app.gotoPage(url);
	},
	golistenTranslate:function(){
		let idstr = this.retunUnitId();
		let url = "/pages/wordlist/listentranslate?unitId="+idstr;
		app.gotoPage(url);
	},
	golistenSpell:function(){
		let idstr = this.retunUnitId();
		let url = "/pages/wordlist/listenspell?unitId="+idstr;
		app.gotoPage(url);
  },
  gowordSpeak:function(){
		let idstr = this.retunUnitId();
		let url = "/pages/wordlist/wordspeak?unitId="+idstr;
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