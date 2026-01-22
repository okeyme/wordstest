// components/header/header.js
Component({
    /**
     * 组件的属性列表
     */
    properties: {
			headerName:{
				type: String,
				value: '同步英语'
			}
    },

    /**
     * 组件的初始数据
     */
    data: {

    },

    /**
     * 组件的方法列表
     */
    methods: {
			goBack: function() {
				wx.navigateBack({
					delta: 1 // 返回的页面数，如果 delta 大于现有页面数，则返回到首页
				})
			},
			goHome: function() {
				wx.navigateBack({
					delta: 10 // 返回的页面数，如果 delta 大于现有页面数，则返回到首页
				})
			},
		}
})
