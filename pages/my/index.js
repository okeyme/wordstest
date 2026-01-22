const app = getApp();
Page({
  data: {
		showTipModal: false, // 控制浮层显示/隐藏
		showKefuModal: false,
		userInfo:null,
    userVersion: [],
    member_status: [],
    is_member_valid: false, // 初始化为false
    loading: true // 添加加载状态
  },

  onLoad() {
		console.log('=== my/index onLoad ===');
    this.setData({ loading: true });
    
    // 监听会员状态更新事件
    app.on('memberStatusUpdated', this.handleMemberUpdate);
    app.on('loginCompleted', this.handleLoginComplete);
    app.on('paymentSuccess', this.handlePaymentSuccess);
    
    // 初始化数据
		this.initData();
  },
  onShow() {
    console.log('=== my/index onShow ===');
		// 检查数据是否需要更新
		this.checkDataFreshness();
		
		// 新增：检查是否已有用户数据但页面未更新
		if (!this.data.userInfo && app.globalData.userInfo) {
			// 确保事件监听存在
			//app.on('memberStatusUpdated', this.handleMemberUpdate);
			//app.on('loginCompleted', this.handleLoginComplete);
			//app.on('paymentSuccess', this.handlePaymentSuccess);
			
			console.log('onShow中发现全局用户数据，更新页面');
			this.setDataFromGlobal();
		}
  },
	onUnload() {
		console.log('=== my/index onUnload ===');
    // 移除事件监听
    app.off('memberStatusUpdated', this.handleMemberUpdate);
    app.off('loginCompleted', this.handleLoginComplete);
    app.off('paymentSuccess', this.handlePaymentSuccess);
    
    this.hideAddTip();
    this.hideKefuTip();
	},
	// 初始化数据
  initData() {
		console.log('=== my/index initData ===');
		
		// 如果有数据就直接使用
		if (app.globalData.userInfo && app.globalData.userVersion) {
			this.setDataFromGlobal();
		} else {
			// 否则显示loading，等待登录完成事件
			this.setData({ loading: true });
			if (this.data.loading && !app.globalData.userInfo) {
        this.setData({ loading: false });
        console.warn('用户数据初始化超时，可能需要重新登录');
        
        // 可以添加重试登录的逻辑
        this.retryLogin();
      }
		}
	},
	// 新增重试登录方法
	retryLogin: function() {
		const that = this;
		wx.showModal({
			title: '提示',
			content: '用户信息获取失败，是否重新登录？',
			success: function(res) {
				if (res.confirm) {
					that.setData({ loading: true });
					app.userLogin({
						success: function() {
							that.setDataFromGlobal();
						},
						fail: function() {
							that.setData({ loading: false });
						}
					});
				}
			}
		});
	},

  // 从全局数据设置页面数据
  setDataFromGlobal() {
    console.log('=== my/index setDataFromGlobal ===');
    
    this.setData({
      userInfo: app.globalData.userInfo,
      userVersion: app.globalData.userVersion,
      member_status: app.globalData.member_status,
      is_member_valid: app.isMemberValid ? app.isMemberValid() : false,
      loading: false
    });
    
    console.log('会员状态:', {
      member_status: this.data.member_status,
      is_member_valid: this.data.is_member_valid
    });
  },

  // 检查数据新鲜度
  checkDataFreshness() {
    const lastUpdate = wx.getStorageSync('last_data_update') || 0;
		const now = Date.now();
		const tenMinutes = 10 * 60 * 1000; // 10分钟
		
		// 只有在有有效的时间戳时才检查
		if (lastUpdate > 0 && now - lastUpdate > tenMinutes) {
			console.log('数据已过期，刷新会员状态');
			this.refreshMemberStatus();
		} else if (lastUpdate === 0) {
			console.log('首次加载，不检查数据新鲜度');
		}
	},
	// 刷新会员状态
  refreshMemberStatus() {
		// 显示加载提示
		wx.showLoading({
			title: '更新会员状态...',
		});
		
		const that = this;
		app.requestData('/member/getStatus', 'POST', {}, (res) => {
			wx.hideLoading();
			if (res.data) {
				app.updateMemberStatus(res.data);
				// app.updateMemberStatus 内部已经更新时间戳
				console.log('会员状态刷新完成');
			}
		}, (err) => {
			wx.hideLoading();
			console.error('刷新会员状态失败:', err);
		});
	},

  // 处理登录完成事件
  handleLoginComplete: function(data) {
		console.log('=== my/index handleLoginComplete ===', data);
		this.setDataFromGlobal();
	},

  // 处理会员状态更新
  handleMemberUpdate: function(memberStatus) {
		console.log('=== my/index handleMemberUpdate ===', memberStatus);
		
		// 只有当会员状态真正变化时才更新和输出详细日志
		const currentMemberStr = JSON.stringify(this.data.member_status);
		const newMemberStr = JSON.stringify(memberStatus);
		
		if (currentMemberStr !== newMemberStr) {
			this.setData({
				member_status: memberStatus,
				is_member_valid: app.isMemberValid ? app.isMemberValid() : false
			});
			
			console.log('会员状态已更新');
		}
	},

  // 处理支付成功事件
  handlePaymentSuccess: function() {
    console.log('=== my/index handlePaymentSuccess ===');
    // 支付成功后刷新会员状态
    this.refreshMemberStatus();
	},
	
	// 手动刷新会员状态（可以添加到页面中作为调试功能）
  refreshData: function() {
    this.setData({ loading: true });
    this.refreshMemberStatus();
    
    // 3秒后取消loading状态
    setTimeout(() => {
      this.setData({ loading: false });
    }, 3000);
  },

	/**====添加至桌面===* */
	// 点击“添加至桌面”按钮：显示提醒浮层
  showAddTip() {
    this.setData({
      showTipModal: true
    });

    // 5秒后自动隐藏浮层（给用户足够时间阅读）
    setTimeout(() => {
      if (this.data.showTipModal) { // 若用户未手动关闭，则自动关闭
        this.hideAddTip();
      }
    }, 5000);
  },

  // 点击“知道了”按钮或遮罩：隐藏浮层
  hideAddTip() {
    this.setData({
      showTipModal: false
    });
	},
	

	// ===客服=====
  showKefuTip() {
    this.setData({
      showKefuModal: true
    });
  },

  // 点击“知道了”按钮或遮罩：隐藏浮层
  hideKefuTip() {
    this.setData({
      showKefuModal: false
    });
  },

  // 页面隐藏时：自动关闭浮层（避免返回时浮层残留）
  onKefuHide() {
    this.hideKefuTip();
	},
	gotest:function(){
		let url = "/pages/wordlist/test";
		app.gotoPage(url);
  },
	gomemberConvert:function(){
		let url = "/pages/my/memberconvert";
		app.gotoPage(url);
  },
	goinvite:function(){
		let url = "/pages/my/invite";
		app.gotoPage(url);
  },
	btnHome:function(){
		let url = "/pages/wordlist/test";
		app.gotoPage(url);
  },
  govip:function(){
		let url = "/pages/my/member?type=1";
		app.gotoPage(url);
  },
  govip2:function(){
		let url = "/pages/my/member?type=2";
		app.gotoPage(url);
  },
	gowordError:function(){
		let url = "/pages/my/worderror";
		app.gotoPage(url);
	},
	gowordCollect:function(){
		let url = "/pages/my/wordcollect";
		app.gotoPage(url);
	},
	gowordDatetime:function(){
		let url = "/pages/my/datetime";
		app.gotoPage(url);
	},
	goFeedback:function(){
		let url = "/pages/my/feedback";
		app.gotoPage(url);
	},
});