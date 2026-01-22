// pages/picture/index.js
const app = getApp()
Page({

    /**
     * 页面的初始数据
     */
    data: {
			headerName:'看图学词',
			serverHost: 'https://bossbell.com/miniprogram/',
			scrollHeight: 300,
			scrollTop: 0,
			classArr:[{id:'10',name:'食物',pic:'shiwuqimin.png'},{id:'3',name:'动物',pic:'a-cowanimal.png'},{id:'19',name:'植物',pic:'flower4.png'},{id:'17',name:'颜色',pic:'Colors.png'},{id:'11',name:'蔬菜水果',pic:'shucaishuiguo.png'},{id:'8',name:'人体服装',pic:'maoshan-wpstupian.png'},{id:'7',name:'日常生活',pic:'kafei.png'},{id:'6',name:'交通工具',pic:'a-ditiejiaotonggongju.png'},{id:'16',name:'学习教育',pic:'wodexuexi.png'},{id:'14',name:'文体娱乐',pic:'tiyu.png'},{id:'18',name:'职业身份',pic:'gongwenbao.png'},{id:'5',name:'人物成员',pic:'jiatingchengyuan.png'},{id:'1',name:'方位场所',pic:'weizhi.png'},{id:'4',name:'国家名称',pic:'WORLD.png'},{id:'2',name:'地理自然',pic:'jingdianshanjingqu.png'},{id:'9',name:'时令季节',pic:'mianxingchonglangban.png'},{id:'15',name:'星期月份',pic:'riqi.png'},{id:'12',name:'数字',pic:'shuzi.png'},{id:'13',name:'天气',pic:'tianqi.png'},{id:'-1',name:'其它',pic:'shouye.png'}]
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {

    },
		golist: function(e){
			let index = e.currentTarget.dataset.index;
			app.gotoPage("/pages/picture/list?cid="+index);
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
			const windowInfo = wx.getWindowInfo()
			const query = wx.createSelectorQuery();
			query.select('.header').boundingClientRect(data => {
				if (data) {
					let sHeight = windowInfo.windowHeight - data.height - 50;
					that.setData({scrollTop:data.height, scrollHeight: sHeight});
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