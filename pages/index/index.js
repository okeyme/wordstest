const app = getApp();
const wxc = app.globalData.wxc;
Page({
  data:{
		loading:true,
		hasInitialData: false, // 新增：标记是否已有初始数据
		isProcessingLogin: false, // 新增：标记是否正在处理登录
		syncTimer:null,
		serverHost: app.globalData.serverHost,
		scrollHeight: 500,
		setversionHeight:0,
		cdnHost: 'https://bossbell.com/',
		gradeArr: ['年级','一年级','二年级','三年级','四年级','五年级','六年级','七年级','八年级','九年级','高一','高二','高三'],
			partArr: ['册序','上册','下册','全一册'],
		userVersion: [],
		is_new_user:false,
		member_status:[],
    recordlist:[],
    word_count:0,  //本教材总学习单词数
		day_revise_count:0,//今日复习单词数
		day_word_count:0,//今日学习单词数
		showMemberExpTip:false,
		showMemberGiftTip:false,
		is_member_valid: false,
		lastVgId: 0, // 新增：记录上一次的教材ID，用于检测教材切换
		refreshTimeout:null
  },
  onLoad(options) {
		/*if (options && options.invite_code) {
			console.log('===index 收到邀请码:', options.invite_code);
			app.loginWithInviteCode(options.invite_code);
			// 使用带邀请码的登录
		} else {
			// 正常登录流程
			if (app.globalData.userVersion.vg_id > 0) {
				this.setData({
					userVersion: app.globalData.userVersion,
					is_new_user: app.globalData.is_new_user,
					member_status: app.globalData.member_status,
					is_member_valid: app.globalData.is_member_valid,
					loading: false
				});
			}
		}*/
    
    // 监听登录完成事件
		app.on('userVersionUpdated', this.handleVersionUpdate);
    app.on('loginCompleted', this.handleLoginComplete);
    app.on('memberStatusUpdated', this.handleMemberUpdate);
		app.on('paymentSuccess', this.handlePaymentSuccess);
		app.on('wordCountUpdated', this.handleWordCountUpdate);
		
		// 处理邀请码
    if (options && options.invite_code) {
      console.log('===index 收到邀请码:', options.invite_code);
      app.loginWithInviteCode(options.invite_code);
    } else {
      this.initData();
    }
	},
	initData: function() {
    console.log('=== initData ===');
    this.setData({ loading: true });
    
    // 如果已经有数据，直接使用
    if (app.globalData.userVersion && app.globalData.userVersion.vg_id > 0) {
      this.setDataFromGlobal();
    } else {
      // 否则等待登录事件
      console.log('等待登录事件...');
    }
  },

	 // 从全局数据设置页面数据
	 setDataFromGlobal: function() {
		console.log('=== setDataFromGlobal ===');
		if (this.data.hasInitialData) {
			//console.log('数据已初始化，跳过重复设置');
			return;
		}
		
		this.setData({
			userVersion: app.globalData.userVersion,
			word_count: app.globalData.userVersion.word_count,
			day_word_count: app.globalData.userVersion.day_word_count,
			day_revise_count: app.globalData.userVersion.day_revise_count,
			member_status: app.globalData.member_status,
			is_member_valid: app.globalData.is_member_valid,
			is_new_user: app.globalData.is_new_user,
			loading: false,
			hasInitialData: true
		});
		
		// 只在设置全局数据时调用一次
		this.loadLocalwordRecordCount();
	},

	refreshAllData: function() {
    const that = this;
    
    // 防抖处理：300ms 内只执行一次
    if (this.data.refreshTimeout) {
        clearTimeout(this.data.refreshTimeout);
    }
    
    this.data.refreshTimeout = setTimeout(() => {
        console.log('执行数据刷新');
        
        // 如果 token 无效，先不请求需要认证的接口
        if (!app.globalData.token) {
            console.log('token 无效，跳过需要认证的请求');
            that.setData({ loading: false });
            return;
        }
        
        // 只刷新必要的数据，避免并发请求
        that.refreshUserData().then(() => {
            that.setData({ 
                loading: false,
                userVersion: app.globalData.userVersion,
                member_status: app.globalData.member_status,
                is_member_valid: app.globalData.is_member_valid
            });
            that.loadLocalwordRecordCount();
        }).catch(err => {
            console.error('数据加载失败:', err);
            that.setData({ loading: false });
        });
    }, 300);
	},
	fetchUserVersion: function() {
    return new Promise((resolve, reject) => {
        console.log('获取教材信息');
        app.requestData('/version/userversion', 'GET', {}, (res) => {
            if (res.data) {
                app.globalData.userVersion = res.data;
                app.saveUserData(); // 保存到缓存
                console.log('教材信息获取成功');
                resolve(res.data);
            } else {
                reject(new Error('获取教材信息失败'));
            }
        }, reject);
    });
	},

	fetchMemberStatus: function() {
			return new Promise((resolve, reject) => {
					console.log('获取会员状态');
					app.requestData('/member/getStatus', 'POST', {}, (res) => {
							if (res.data) {
									app.updateMemberStatus(res.data);
									console.log('会员状态获取成功');
									resolve(res.data);
							} else {
									reject(new Error('获取会员状态失败'));
							}
					}, reject);
			});
	},
	// 修改为顺序请求，避免并发
	refreshUserData: function() {
		return new Promise((resolve, reject) => {
				console.log('顺序刷新用户数据');
				
				// 先获取用户教材信息
				this.fetchUserVersion()
						.then(() => {
								// 然后获取会员状态
								return this.fetchMemberStatus();
						})
						.then(() => {
								resolve();
						})
						.catch(reject);
		});
	},
	// 添加下拉刷新
	onPullDownRefresh: function() {
			this.refreshUserData().finally(() => {
					wx.stopPullDownRefresh();
			});
	},
	// 处理支付成功事件
	handlePaymentSuccess: function() {
		this.refreshAllData(); // 支付成功后刷新所有数据
	},

	// 处理数据刷新要求
	handleDataRefresh: function() {
		this.refreshAllData();
	},
	// 处理学习记录更新
	handleWordCountUpdate: function(data) {
		//console.log('首页收到学习记录更新:', data);
		this.setData({
			word_count: data.day_word_count || 0,
			day_revise_count: data.day_revise_count || 0,
			day_word_count: data.day_word_count || 0
		});
	},
  //优先从本地获取日历记录数
  loadLocalwordRecordCount: function() {
		console.log('=======今日学习记录开始=======');
		const userVersion = this.data.userVersion || app.globalData.userVersion;
		
		if (!userVersion) {
			console.warn('没有用户教材信息');
			return;
		}
		
		// 检查是否有必要的数据字段，或者数据明显异常（比如切换教材后）
		const needsRefresh = !userVersion.hasOwnProperty('day_word_count') || 
												!userVersion.hasOwnProperty('day_revise_count') ||
												(userVersion.vg_id && this.data.lastVgId && userVersion.vg_id !== this.data.lastVgId);
		
		if (needsRefresh) {
			const today = new Date();
			const year = today.getFullYear();
			const month = today.getMonth() + 1;
			const day = today.getDate();
			this.getDateTimeRecord(year, month, day);
			
			// 记录当前教材ID，用于检测教材切换
			if (userVersion.vg_id) {
				this.setData({ lastVgId: userVersion.vg_id });
			}
		} else {
			// 如果已有数据，直接更新显示
			this.setData({
				word_count: userVersion.word_count || 0,
				day_word_count: userVersion.day_word_count || 0,
				day_revise_count: userVersion.day_revise_count || 0
			});
		}
	},
	// 强制从服务器刷新学习记录（切换教材后使用）
	forceRefreshWordRecord: function() {
		console.log('强制刷新学习记录');
		const today = new Date();
		const year = today.getFullYear();
		const month = today.getMonth() + 1;
		const day = today.getDate();
		
		// 清除本地可能存在的学习记录缓存
		try {
			wx.removeStorageSync('wordRecordCount_' + app.globalData.userVersion.vg_id);
			console.log('已清除学习记录缓存');
		} catch (e) {
			console.log('清除学习记录缓存失败:', e);
		}
		
		// 立即从服务器获取
		this.getDateTimeRecord(year, month, day);
	},
	// 获取学习日历
	getDateTimeRecord: function(years, months, days) {
		console.log('====wordRecordCount==', years, months, days);
		
		// 确保有教材信息
		if (!app.globalData.userVersion || !app.globalData.userVersion.vg_id) {
			console.warn('没有教材信息，无法获取学习记录');
			return;
		}
		
		var data = {
			vgId: app.globalData.userVersion.vg_id, 
			years: years, 
			months: months, 
			days: days
		};
		
		app.requestData('/word/getDateTimeRecord', 'GET', data, 
			(res) => {
				if (res && res.data) {
					console.log('====wordRecordCount 响应===', res);
					var recordlist = res.data.data.recordlist;
					//console.log('====res recordlist===', recordlist);
					
					// 无论是否有数据，都更新学习记录
					let word_count = 0;
					let revise_count = 0;
					
					if (recordlist && Object.keys(recordlist).length > 0) {
						word_count = recordlist.word_count || 0;
						revise_count = recordlist.revise_count || 0;
					}
					
					let flag = app.updateUserWordCount(0, 0, word_count, revise_count);
					if (flag) {
						// 更新页面显示
						this.setData({
							userVersion: app.globalData.userVersion,
							word_count: app.globalData.userVersion.word_count || 0,
							day_word_count: app.globalData.userVersion.day_word_count || 0,
							day_revise_count: app.globalData.userVersion.day_revise_count || 0
						});
					}
				}
			},
			(err) => {
				console.error('获取学习记录失败', err);
				// 即使获取失败，也要确保显示重置后的0值
				this.setData({
					word_count: 0,
					day_word_count: 0,
					day_revise_count: 0
				});
			}
		);
	},

	// 新增：强制同步用户数据
	forceSyncUserData() {
    if (this.data.syncTimer) clearTimeout(this.data.syncTimer);
    
    this.data.syncTimer = setTimeout(() => {
      // 只有当数据明显过期时才同步
      const lastUpdate = wx.getStorageSync('last_data_update') || 0;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (now - lastUpdate > fiveMinutes) {
        this.refreshAllData();
      }
    }, 300);
  },
  
  onShow() {
		console.log('=== index onShow ===');
    // 轻量级数据同步，只在必要时
    if (!this.data.hasInitialData && app.globalData.userVersion && app.globalData.userVersion.vg_id > 0) {
      this.setDataFromGlobal();
		}
		// 检查数据新鲜度
		this.checkDataFreshness();
		// 如果教材已经更新，确保学习记录也更新
		if (this.data.userVersion && this.data.userVersion.vg_id > 0) {
			this.loadLocalwordRecordCount();
		}
	},
	onUnload() {
		console.log('=== index onUnload ===');
    // 移除事件监听
    app.off('memberStatusUpdated', this.handleMemberUpdate);
    app.off('userVersionUpdated', this.handleVersionUpdate);
    app.off('loginCompleted', this.handleLoginComplete);
		app.off('paymentSuccess', this.handlePaymentSuccess);
		app.off('wordCountUpdated', this.handleWordCountUpdate);
	},
	// 检查并更新教材信息
  checkAndUpdateVersion() {
    if (app.globalData.userVersion) {
      this.setData({
        userVersion: app.globalData.userVersion,
        loading: false
      });
    } else {
      // 如果没有教材信息，尝试加载
      app.loadUserVersion();
      this.setData({ loading: true });
    }
  },
	handleVersionUpdate: function(version) {
		console.log('收到教材更新事件', version);
		// 重置学习记录为0
		this.setData({
			userVersion: version,
			word_count: version.word_count || 0,
			day_word_count: version.day_word_count || 0,
			day_revise_count: version.day_revise_count || 0,
			loading: false
		});
		// 强制从服务器获取新的学习记录
		this.forceRefreshWordRecord();
	},
  // 处理登录完成事件
	handleLoginComplete: function(data) {
		console.log('=== handleLoginComplete ===', data);
		
		if (this.data.isProcessingLogin) {
			console.log('正在处理登录，跳过重复处理');
			return;
		}
		
		this.setData({ isProcessingLogin: true });
		
		setTimeout(() => {
			this.setDataFromGlobal(); // 这里会调用 loadLocalwordRecordCount
			app.checkUserVersion();
			this.setData({ isProcessingLogin: false });
		}, 100);
	},
	// 处理会员状态更新
  handleMemberUpdate: function(memberStatus) {
    this.setData({
      member_status: memberStatus,
      is_member_valid: app.isMemberValid()
    });
    
    // 处理会员过期提示
    this.checkMemberExpiration();
  },
  // 检查会员过期状态
  checkMemberExpiration: function() {
		const memberExpClosed = wx.getStorageSync('memberExpClosed') || false;
		const memberGiftClosed = wx.getStorageSync('memberGiftClosed') || false;

		if (!memberGiftClosed && app.globalData.member_status.first_member_gift==1) {
      this.setData({ showMemberGiftTip: true });
		}
    if (!this.data.is_member_valid && app.globalData.member_status.is_member === 1 && !memberExpClosed) {
      // 会员已过期
      this.setData({ showMemberExpTip: true });
    }
	},
	// 添加数据新鲜度检查
	checkDataFreshness() {
		const lastUpdate = wx.getStorageSync('last_data_update') || 0;
		const now = Date.now();
		const tenMinutes = 10 * 60 * 1000;
		
		if (lastUpdate > 0 && now - lastUpdate > tenMinutes) {
			console.log('首页数据已过期，刷新所有数据');
			this.refreshAllData();
		}
	},
	closeMemberExpTip:function(){
		this.setData({
      showMemberExpTip: false
    });
    // 可选：记录用户关闭状态（如存入本地缓存，避免再次弹出）
    wx.setStorageSync('memberExpClosed', true);
	},
	closeMemberGiftTip:function(){
		this.setData({
      showMemberExpTip: false
    });
    // 可选：记录用户关闭状态（如存入本地缓存，避免再次弹出）
    wx.setStorageSync('memberGiftClosed', true);
	},
	gologin:function(){
		let url = "/pages/login/index";
		app.gotoPage(url);
  },
	govip:function(){
		let url = "/pages/my/member";
		app.gotoPage(url);
  },
	golisten: function() {
		let vg_id = parseInt(app.globalData.userVersion.vg_id);
		if(vg_id>=542){
			var url = '/pages/listen/title';
		}else{
			var url = '/pages/listen/index';
		}
		app.gotoPage(url);
	},
	goyinbiao: function() {
		wx.navigateTo({
			url: '/pages/yinbiao/yinbiao' // 这里是需要跳转到的页面路径
		});
	},
	gopindu: function() {
		wx.navigateTo({
			url: '/pages/yinbiao/abc' // 这里是需要跳转到的页面路径
		});
	},
	gosearch: function() {
		wx.navigateTo({
			url: '/pages/index/search' // 这里是需要跳转到的页面路径
		});
	},
	goVersion: function() {
		wx.navigateTo({
			url: '/pages/version/index' // 这里是需要跳转到的页面路径
		});
	},
	gotoPlan: function() {
		wx.navigateTo({
			url: '/pages/my/myplan' // 这里是需要跳转到的页面路径
		});
	},
	goWordlist: function() {
		wx.navigateTo({
			url: '/pages/wordlist/index' // 这里是需要跳转到的页面路径
		});
	},
	goReviselist: function() {
		wx.navigateTo({
			url: '/pages/my/reviseword' // 这里是需要跳转到的页面路径
		});
	},
	goWordWrite: function() {
		wx.navigateTo({
			url: '/pages/wordlist/category?model=wordWrite' // 这里是需要跳转到的页面路径
		});
	},
	goWordAnipop: function() {
		wx.navigateTo({
			url: '/pages/wordlist/index?model=wordAnipop' // 这里是需要跳转到的页面路径
		});
	},
	goWordTranslate: function() {
		wx.navigateTo({
			url: '/pages/wordlist/index?model=wordTranslate' // 这里是需要跳转到的页面路径
		});
	},
	goTranslateWord: function() {
		wx.navigateTo({
			url: '/pages/wordlist/index?model=translateWord' // 这里是需要跳转到的页面路径
		});
	},
	goWordAudio: function() {
		wx.navigateTo({
			url: '/pages/wordlist/index?model=wordAudio' // 这里是需要跳转到的页面路径
		});
	},
	goDatetime: function() {
		wx.navigateTo({
			url: '/pages/my/datetime' 
		});
	},	
	gotraslate: function() {
		wx.navigateTo({
			url: '/pages/translate/index' 
		});
	},	
	onReady(){
		wx.updateShareMenu({
			withShareTicket: true,
			menus: ['shareAppMessage', 'shareTimeline'],
		});
	},
  onHide: function() {
	},
	onShareAppMessage: function (options) {
		// 返回分享的内容
		return {
			title: '云单词速记',
			path: '/pages/index/index',
			imageUrl: '' // 分享卡片的图片，可选
		};
	},
	btnShare: function () {
		// 显示分享按钮
		console.log('===share=');
		wx.showShareMenu({
			withShareTicket: true
		});
	},
	goToTargetMiniProgram() {
		wx.navigateToMiniProgram({
			appId: 'wx4b6745537b3211d9', // 仅需必填的 appId
			extraData: { foo: 'bar' },    // 可选参数
			success(res) {
				console.log('跳转到目标小程序首页成功', res)
			},
			fail(err) {
				console.error('跳转失败', err)
			}
		})
	}
})