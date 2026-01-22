App({
  globalData: {
		requestRetryCount: 0,
		maxRequestRetries: 3,
		serverName: '云单词速记',
    serverHost: 'https://w.360e.cn/miniapi/Public',
    cdnHost: 'https://bossbell.com',
    token: null,
    userVersion: {
      'nickname': '用户昵称',
      'headimgurl': 'https://w.360e.cn/miniapi/Public/images/noheadimgurl.jpg',
      'stage': 0,
      'version_id': 1,
      'vg_id': 0,
      'version_name': '选择教材',
      'picurl': '/uploads/versionimage/renjiao-2024-3b.jpg',
      'wordscount': 0
		},
		inviteCode:null,
		userInfo: null,
		is_new_user:false,
		member_status:{
			'is_member': 0,
			'expire_time':0,
			'first_member_gift': 0,
			'expire_date': ''
		},
		is_member_valid: false,     // 新增：会员是否有效
    eventBus: {
      subscribers: {}
		},
		isLogging: false,  // 新增：防止重复登录
		loginPromise: null, // 新增：登录Promise缓存
		
		// 新增的请求队列管理属性
		isRefreshingToken: false,
		pendingRequests: [],
		requestQueue: [],
		tokenRefreshPromise: null,
		
		// 新增：防止重复跳转
		isRedirecting: false,
		
		// 新增：防止重复获取用户教材
		isGettingUserVersion: false
  },

  // 初始化自动登录
  onLaunch() {
		const launchOption = wx.getLaunchOptionsSync();
		// 检查是否有invite_code参数
    if (launchOption.query && launchOption.query.invite_code) {
      console.log('启动时获取到邀请码:', launchOption.query.invite_code);
      this.globalData.inviteCode = launchOption.query.invite_code; // 存入全局数据
		}
		this.autoLogin();
  },

  // 核心请求方法（支付流程关键）
  requestData(url, method, data, successCallback, failCallback) {
    const that = this;
    
    // 如果正在刷新 token，将请求加入队列
    if (this.globalData.isRefreshingToken) {
        console.log('Token刷新中，请求加入队列:', url);
        this.globalData.pendingRequests.push({
            url, method, data, successCallback, failCallback
        });
        return;
    }
    
    // 内部执行请求的函数
    function executeRequest() {
        const header = {
            'Authorization': 'Bearer ' + that.globalData.token,
            'Content-Type': 'application/json'
        };
        
        // 特殊处理：支付请求需要原始数据格式
        if(method === 'POST'){
            if(!url.includes('/payment/')){
                data = JSON.stringify(data);
            }
        }
        
        wx.request({
            url: that.globalData.serverHost + url,
            method: method,
            header: header,
            data: data,
            success: (res) => {
                console.log(`[${method}] ${url} 响应:`, res);
                
                // Token 过期处理
                if ((res?.data?.code === 10200 || res?.statusCode === 401) && 
                    !url.includes('/token/refresh') && 
                    !url.includes('/auth/login')) {
                    console.log('Token 过期，加入刷新队列:', url);
                    // 将当前请求加入待处理队列
                    that.globalData.pendingRequests.push({
                        url, method, data, successCallback, failCallback
                    });
                    
                    // 触发 token 刷新（但只触发一次）
                    if (!that.globalData.isRefreshingToken) {
                        that.globalData.isRefreshingToken = true;
                        that.refreshToken(() => {
                            // 刷新成功后重试所有待处理请求
                            that.retryPendingRequests();
                        });
                    }
                } 
                // 支付相关错误特殊处理
                else if (url.includes('/payment/') && res?.data?.code !== 0) {
                    failCallback && failCallback(res.data);
                } 
                // 通用错误处理
                else if (res?.data?.code !== undefined && res.data.code !== 0) {
                    failCallback && failCallback(res.data);
                } 
                // 成功处理
                else {
                    successCallback && successCallback(res.data);
                }
            },
            fail: (err) => {
                console.error(`${url} 请求失败:`, err);
                that.checkNetworkStatus().then((hasNetwork) => {
                    if (!hasNetwork) {
                        failCallback && failCallback(err);
                    } else {
                        that.globalData.requestRetryCount++;
                        failCallback && failCallback(err);
                    }
                });
            }
        });
    }
    
    // 执行请求（带token有效性检查）
    if (that.globalData.token) {
        executeRequest();
    } else {
        this.userLogin({
            success: () => executeRequest(),
            fail: failCallback
        });
    }
},

  /**
   * 刷新 token 并重试请求（支付流程关键）
   */
  refreshToken: function(callback) {
    const that = this;
    
    // 如果已经有刷新请求在进行，直接返回 Promise
    if (this.globalData.tokenRefreshPromise) {
        console.log('刷新请求已在进行中，等待结果...');
        return this.globalData.tokenRefreshPromise.then(callback);
    }
    
    const refreshToken = wx.getStorageSync('refreshToken');
    
    if (!refreshToken) {
        console.log('没有 refreshToken，需要重新登录');
        this.clearAllTokens();
        this.tokenRefreshPromise = new Promise((resolve, reject) => {
            this.userLogin({
                success: () => {
                    that.globalData.tokenRefreshPromise = null;
                    resolve();
                    callback && callback();
                },
                fail: (err) => {
                    that.globalData.tokenRefreshPromise = null;
                    reject(err);
                }
            });
        });
        return this.tokenRefreshPromise;
    }
    
    console.log('开始刷新 token...');
    
    this.tokenRefreshPromise = new Promise((resolve, reject) => {
        wx.request({
            url: that.globalData.serverHost + '/token/refresh',
            method: 'POST',
            header: {'Content-Type': 'application/json'},
            data: JSON.stringify({ refreshToken: refreshToken }),
            success: (res) => {
                console.log('token 刷新结果:', res.data);
                
                if (res.data.code === 0) {
                    // 刷新成功
                    const newToken = res.data.data.token;
                    const newRefreshToken = res.data.data.refreshToken;
                    that.saveToken(newToken, newRefreshToken);
                    that.globalData.tokenRefreshPromise = null;
                    resolve();
                    callback && callback();
                } else {
                    // 刷新 token 失败
                    console.log('刷新失败，需要重新登录');
                    that.clearAllTokens();
                    that.userLogin({
                        success: () => {
                            that.globalData.tokenRefreshPromise = null;
                            resolve();
                            callback && callback();
                        },
                        fail: (err) => {
                            that.globalData.tokenRefreshPromise = null;
                            reject(err);
                        }
                    });
                }
            },
            fail: (err) => {
                console.error('刷新 token 请求失败:', err);
                that.clearAllTokens();
                that.userLogin({
                    success: () => {
                        that.globalData.tokenRefreshPromise = null;
                        resolve();
                        callback && callback();
                    },
                    fail: (err) => {
                        that.globalData.tokenRefreshPromise = null;
                        reject(err);
                    }
                });
            }
        });
    });
    
    return this.tokenRefreshPromise;
	},
	// 清除所有Token和用户缓存数据
	clearAllTokens: function() {
		console.log('清除所有Token缓存数据');
		
		// 清除Token相关缓存
		wx.removeStorageSync('token');
		wx.removeStorageSync('refreshToken');
		
		// 重置全局Token
		this.globalData.token = null;
		
		// 清除用户相关缓存（可选，根据需求决定）
		wx.removeStorageSync('userInfo');
		wx.removeStorageSync('userVersion');
		wx.removeStorageSync('member_status');
		wx.removeStorageSync('last_data_update');
		
		// 重置全局数据
		this.globalData.userInfo = null;
		this.globalData.userVersion = {
			'nickname': '用户昵称',
			'headimgurl': 'https://w.360e.cn/miniapi/Public/images/noheadimgurl.jpg',
			'stage': 0,
			'version_id': 1,
			'vg_id': 0,
			'version_name': '选择教材',
			'picurl': '/uploads/versionimage/renjiao-2024-3b.jpg',
			'wordscount': 0
		};
		this.globalData.member_status = {
			'is_member': 0,
			'expire_time': 0,
			'first_member_gift': 0,
			'expire_date': ''
		};
		this.globalData.is_member_valid = false;
		
		console.log('所有Token和用户数据已清除');
	},
	// 重试待处理请求
	retryPendingRequests: function() {
		const that = this;
		const pendingRequests = [...this.globalData.pendingRequests];
		
		console.log(`开始重试 ${pendingRequests.length} 个待处理请求`);
		
		// 清空待处理队列
		this.globalData.pendingRequests = [];
		this.globalData.isRefreshingToken = false;
		
		// 逐个重试待处理请求
		pendingRequests.forEach(request => {
				setTimeout(() => {
						that.requestData(
								request.url, 
								request.method, 
								request.data, 
								request.successCallback, 
								request.failCallback
						);
				}, 100); // 添加延迟避免并发
		});
	},
	// 自动登录流程
	autoLogin() {
		console.log('=== autoLogin ===');
		
		// 防止重复自动登录
		if (this.globalData.isLogging) {
			console.log('自动登录正在进行中，跳过');
			return;
		}
		
		// 重置刷新状态
		this.globalData.isRefreshingToken = false;
		this.globalData.pendingRequests = [];
		this.globalData.tokenRefreshPromise = null;
		
		const cachedUserInfo = wx.getStorageSync('userInfo');
		if (cachedUserInfo) {
			this.globalData.userInfo = cachedUserInfo;
			console.log('从缓存加载 userInfo');
		}
		
		// 尝试从缓存加载数据
		this.loadUserData();
		
		const token = wx.getStorageSync('token');
		this.globalData.token = token;
		
		console.log('===token===', token ? '存在' : '不存在');
		
		if (token) {
			// 简化：直接尝试获取用户数据，如果 token 过期会在请求中处理
			console.log('有 token，直接加载用户数据');
			this.loadUserVersion(() => {
				// 触发登录完成事件
				this.emit('loginCompleted', {
					userInfo: this.globalData.userInfo,
					userVersion: this.globalData.userVersion,
					member_status: this.globalData.member_status,
					is_member_valid: this.globalData.is_member_valid,
				});
			});
		} else {
			// 没有token，需要登录
			console.log('没有token，开始登录');
			this.userLogin({}, this.globalData.inviteCode);
		}
	},	
  /*autoLogin() {
		// 尝试从缓存加载会员状态
		const cachedMember = wx.getStorageSync('member_status');
		if (cachedMember) {
			this.globalData.member_status = cachedMember;
			this.globalData.is_member_valid = this.isMemberValid();
		}
		
		console.log('===member_status==', this.globalData.member_status);
		
		const userInfo = wx.getStorageSync('userInfo');
		if (userInfo) {
			this.globalData.userInfo = userInfo;
		}
		
		// 加载本地token
		const token = wx.getStorageSync('token');
		this.globalData.token = token;
		console.log('===token===',token);
		if (token) {
			// 检查token有效性
			this.checkToken(token, () => {
				this.loadUserVersion();
			});
		} else {
			// 没有token，需要登录
			this.userLogin({}, this.globalData.inviteCode);
		}
	},*/

  // Token有效性检查
	checkToken(token, callback) {
		const that = this;
		
		// 首先简单验证token格式
		if (!token || typeof token !== 'string' || token.length < 10) {
			console.warn('Token格式无效，需要重新登录');
			that.userLogin({
				success: () => callback && callback(),
				fail: () => callback && callback()
			});
			return;
		}
		
		wx.request({
			url: that.globalData.serverHost + '/token/check',
			method: 'POST',
			header: {'Content-Type': 'application/json'},
			data: JSON.stringify({ token: token }),
			success: (res) => {
				if (res.data && res.data.code === 0) {
					// Token 有效
					callback && callback();
				} else {
					// Token 无效或过期
					console.log('Token检查失败，尝试刷新:', res.data);
					// 调用新版本的 refreshToken
					that.refreshToken(callback);
				}
			},
			fail: (err) => {
				console.error('Token检查请求失败:', err);
				// 网络错误，尝试使用缓存的token继续
				callback && callback();
			}
		});
	},

  // 刷新Token
 /* refreshToken(callback) {
		const that = this;
		const refreshToken = wx.getStorageSync('refreshToken');
		
		if (!refreshToken) {
			// 没有refreshToken，需要重新登录
			console.log('==g开始重新登录=:');
			that.userLogin({
				success: () => callback && callback(),
				fail: (err) => {
					console.error('自动登录失败:', err);
					callback && callback();
				}
			});
			return;
		}
		
		wx.showLoading({
			title: '登录状态更新中',
			mask: true
		});
		
		wx.request({
			url: that.globalData.serverHost + '/token/refresh',
			method: 'POST',
			header: {'Content-Type': 'application/json'},
			data: JSON.stringify({ refreshToken: refreshToken }),
			success: (res) => {
				wx.hideLoading();
				if (res.data.code === 0) {
					// 刷新成功
					that.saveToken(res.data.data.token, res.data.data.refreshToken);
					callback && callback();
				} else {
					// 刷新失败，需要重新登录
					console.error('Token刷新失败:', res.data);
					that.userLogin({
						success: () => callback && callback(),
						fail: (err) => {
							console.error('自动登录失败:', err);
							callback && callback();
						}
					});
				}
			},
			fail: (err) => {
				wx.hideLoading();
				console.error('Token刷新请求失败:', err);
				// 网络错误，需要重新登录
				that.userLogin({
					success: () => callback && callback(),
					fail: (err) => {
						console.error('自动登录失败:', err);
						callback && callback();
					}
				});
			}
		});
	},
*/
	// 完整登录流程
	userLogin(options = {}, inviteCode = null) {
		const that = this;
		const { success, fail } = options;
		
		// 防止重复登录
		if (that.globalData.isLogging) {
			console.log('登录正在进行中，跳过重复登录');
			return;
		}
		
		that.globalData.isLogging = true;
		console.log('=== 开始登录流程 ===');
		
		wx.login({
			success: ({ code }) => {
				wx.getUserInfo({
					success: ({ userInfo }) => {
						that.globalData.userInfo = userInfo;
						console.log('=====not token userLogin,that.globalData.userInfo===',that.globalData.userInfo);
						
						const loginData = {
							code: code, 
							userInfo: userInfo
						};
						
						if (inviteCode) {
							loginData.invite_code = inviteCode;
							that.globalData.inviteCode = null;
						}
						
						wx.request({
							url: that.globalData.serverHost + '/auth/login',
							method: 'POST',
							header: {'Content-Type': 'application/json'},
							data: JSON.stringify(loginData),
							success: (res) => {
								console.log('====login res.data.data==',res);
								if (res.data.code === 0) {
									that.saveToken(res.data.data.token, res.data.data.refreshToken);
									userInfo['user_no'] = res.data.data.user_no;
									that.globalData.userInfo = userInfo;
									that.globalData.is_new_user = res.data.data.is_new_user;
									that.globalData.member_status = res.data.data.member_status;
									that.globalData.is_member_valid = that.isMemberValid();
									wx.setStorageSync('userInfo', userInfo);
									that.updateMemberStatus(res.data.data.member_status);
									
									// 立即设置数据更新时间戳
									wx.setStorageSync('last_data_update', Date.now());
									
									//更新教材状态
									that.getUserVersion(() => {
										that.globalData.isLogging = false;
										success && success();
										that.emit('loginCompleted', {
											userInfo: that.globalData.userInfo,
											userVersion: that.globalData.userVersion,
											member_status: that.globalData.member_status,
											is_member_valid: that.globalData.is_member_valid,
										});
									});
								} else {
									that.globalData.isLogging = false;
									fail && fail(res.data);
								}
							},
							fail: (err) => {
								that.globalData.isLogging = false;
								fail && fail(err);
							}
						});
					},
					fail: () => {
						that.globalData.isLogging = false;
						wx.showToast({ title: '请授权登录' });
						fail && fail({ message: '用户拒绝授权' });
					}
				});
			},
			fail: (err) => {
				that.globalData.isLogging = false;
				fail && fail(err);
			}
		});
	},
  /*userLogin(options = {}, inviteCode = null) {
    const that = this;
    const { success, fail } = options;
    
    wx.login({
      success: ({ code }) => {
        wx.getUserInfo({
          success: ({ userInfo }) => {
						that.globalData.userInfo = userInfo;
						
						// 准备登录数据，包含邀请码
						const loginData = {
							code: code, 
							userInfo: userInfo
						};
						
						// 如果有邀请码，添加到登录数据中
						if (inviteCode) {
							loginData.invite_code = inviteCode;
							// 使用后清空，避免重复使用
							that.globalData.inviteCode = null;
						}
            
            wx.request({
              url: that.globalData.serverHost + '/auth/login',
              method: 'POST',
              header: {'Content-Type': 'application/json'},
              data: JSON.stringify(loginData),
              success: (res) => {
								console.log('====login res.data.data==',res);
                if (res.data.code === 0) {
									that.saveToken(res.data.data.token, res.data.data.refreshToken);
									userInfo['user_no'] = res.data.data.user_no;
									that.globalData.userInfo = userInfo;
									that.globalData.is_new_user = res.data.data.is_new_user;
									that.globalData.member_status = res.data.data.member_status;
									that.globalData.is_member_valid = that.isMemberValid();
                  wx.setStorageSync('userInfo', userInfo);
                  that.updateMemberStatus(res.data.data.member_status);
									
                  //更新教材状态
                  that.loadUserVersion(() => {
                    success && success();
                    that.emit('loginCompleted', {
                      userInfo: that.globalData.userInfo,
											userVersion: that.globalData.userVersion,
											member_status: that.globalData.member_status, // 添加这行
    									is_member_valid: that.globalData.is_member_valid, // 添加这行
                    });
                  });
                } else {
                  fail && fail(res.data);
                }
              },
              fail
            });
          },
          fail: () => {
            wx.showToast({ title: '请授权登录' });
            fail && fail({ message: '用户拒绝授权' });
          }
        });
      },
      fail
    });
  },*/
	// 新增方法：带邀请码的登录
	loginWithInviteCode: function(inviteCode) {
		this.userLogin({}, inviteCode);
	},
  // 获取用户教材
  loadUserVersion: function(callback) {
    const userVersion = wx.getStorageSync('userVersion');
    if (userVersion) {
			console.log('===cache userVersion===',userVersion);
      this.globalData.userVersion = userVersion;
      this.emit('userVersionUpdated', userVersion);
      this.checkUserVersion();
      callback && callback();
    } else {
			console.log('====get UserVersion===');
      this.getUserVersion(callback);
    }
  },

  // 从服务器获取用户教材
  getUserVersion: function(callback) {
    const that = this;
    
    // 如果已经在获取中，直接等待回调
    if (this.globalData.isGettingUserVersion) {
        console.log('userVersion 获取中，等待完成...');
        setTimeout(() => {
            that.getUserVersion(callback);
        }, 100);
        return;
    }
    
    this.globalData.isGettingUserVersion = true;
    
    console.log('获取用户教材信息');
    this.requestData('/version/userversion', 'GET', {}, (res) => {
        that.globalData.userVersion = res.data;
        that.checkUserVersion();
        wx.setStorageSync('userVersion', res.data);
        that.emit('userVersionUpdated', res.data);
        that.globalData.isGettingUserVersion = false;
        callback && callback();
    }, (err) => {
        that.globalData.isGettingUserVersion = false;
        callback && callback();
    });
	},
	// 更新用户学习单词数（总学习数和今日学习数）
  updateUserWordCount: function(is_word, is_revise, day_word_count, day_revise_count) {
		try {
			const userVersion = wx.getStorageSync('userVersion');
			if (userVersion) {
				// 更新总计数（累计）
				if (is_word == 1) {
					this.globalData.userVersion.word_count = (this.globalData.userVersion.word_count || 0) + 1;
				}
				if (is_revise == 1) {
					this.globalData.userVersion.revise_count = (this.globalData.userVersion.revise_count || 0) + 1;
				}
				
				// 更新当日计数（使用服务器返回的最新值）
				if (day_word_count !== undefined && day_word_count !== null) {
					this.globalData.userVersion.day_word_count = day_word_count;
				}
				if (day_revise_count !== undefined && day_revise_count !== null) {
					this.globalData.userVersion.day_revise_count = day_revise_count;
				}
				
				// 同步到缓存
				wx.setStorageSync('userVersion', this.globalData.userVersion);
				/*
				console.log('app.js学习记录更新成功:', {
					word_count: this.globalData.userVersion.word_count,
					revise_count: this.globalData.userVersion.revise_count,
					day_word_count: this.globalData.userVersion.day_word_count,
					day_revise_count: this.globalData.userVersion.day_revise_count
				});*/
				
				// 触发数据更新事件，通知其他页面
				this.emit('wordCountUpdated', {
					word_count: this.globalData.userVersion.word_count,
					revise_count: this.globalData.userVersion.revise_count,
					day_word_count: this.globalData.userVersion.day_word_count,
					day_revise_count: this.globalData.userVersion.day_revise_count
				});
				
				return true;
			} else {
				console.warn('userVersion 不存在，无法更新学习记录');
				return false;
			}
		} catch (error) {
			console.error('更新学习记录失败:', error);
			return false;
		}
	},
  // 事件总线方法
  on(eventName, callback) {
    if (!this.globalData.eventBus.subscribers[eventName]) {
      this.globalData.eventBus.subscribers[eventName] = [];
    }
    this.globalData.eventBus.subscribers[eventName].push(callback);
  },
  
  off(eventName, callback) {
    const subscribers = this.globalData.eventBus.subscribers[eventName];
    if (subscribers) {
      this.globalData.eventBus.subscribers[eventName] = subscribers.filter(
        sub => sub !== callback
      );
    }
  },

  // 触发事件（添加支付相关事件）
  emit(eventName, data) {
    const subscribers = this.globalData.eventBus.subscribers[eventName];
    if (subscribers) {
      subscribers.forEach(callback => callback(data));
    }
  },

  // 保存Token
  saveToken(token, refreshToken) {
    this.globalData.token = token;
    wx.setStorageSync('token', token);
    wx.setStorageSync('refreshToken', refreshToken);
  },
  
  // 支付成功通知
  notifyPaymentSuccess() {
		// 清理缓存，强制从服务器获取最新数据
		this.clearMemberCache();

    this.emit('paymentSuccess', {
      timestamp: Date.now(),
      message: '会员开通成功'
		});
		
		// 立即获取最新会员状态
		this.refreshMemberStatus();
		wx.setStorageSync('payment_success_time', Date.now());
		console.log('支付成功，已设置同步标记');
	},
	// 刷新会员状态
	refreshMemberStatus: function() {
		const that = this;
		this.requestData('/member/getStatus', 'POST', {}, (res) => {
				if (res.data) {
						that.updateMemberStatus(res.data);
						that.saveUserData(); // 保存到缓存
				}
		});
	},
	// 教材设置成功后的处理
	onVersionSetSuccess: function() {
		this.clearUserCache(); // 清理教材缓存
		this.getUserVersion(); // 重新获取教材信息
	},
	showToast: function(title){
		wx.showToast({
			title: title,
			icon: 'none',
			duration: 2000
		})
	},
	showError: function(eMsg = '程序出错~'){
		this.showToast(eMsg);
	},
	gotoPage: function(pageurl){
		wx.navigateTo({
			url: pageurl // 这里是需要跳转到的页面路径
		});
	},
	gotoBack: function() {
		wx.navigateBack({
			delta: 1 // 返回的页面数，如果 delta 大于现有页面数，则返回到首页
		})
	},
	gotoHome: function() {
		wx.navigateBack({
			delta: 10 // 返回的页面数，如果 delta 大于现有页面数，则返回到首页
		})
	},
  // 安全请求封装
  secureRequest(options) {
    const header = { 
      'Authorization': 'Bearer ' + this.globalData.token,
      'Content-Type': 'application/json'
    };
    return new Promise((resolve, reject) => {
      wx.request({
        ...options,
        header,
        success: (res) => res.data.code === 0 ? resolve(res.data) : reject(res),
        fail: reject
      });
    });
	},
	
	// 添加网络状态检查方法
	checkNetworkStatus() {
		return new Promise((resolve) => {
			wx.getNetworkType({
				success: (res) => {
					const networkType = res.networkType;
					if (networkType === 'none') {
						wx.showModal({
							title: '网络连接失败',
							content: '请检查您的网络连接',
							showCancel: false
						});
						resolve(false);
					} else {
						resolve(true);
					}
				},
				fail: () => resolve(true) // 如果获取网络状态失败，默认继续
			});
		});
	},
  
  checkUserVersion: function() {
    if (this.globalData.userVersion.vg_id == 0) {
      wx.navigateTo({
        url: '/pages/version/index'
      });
    }
	},
	// 添加会员状态检查方法
	isMemberValid: function() {
		const member = this.globalData.member_status;
		if (member && member.is_member === 1) {
			const now = Math.floor(Date.now() / 1000);
			// 添加空值检查
			if (!member.expire_time || member.expire_time <= 0) {
				return false;
			}
			return now < member.expire_time - 10;
		}
		return false;
	},

	// 更新会员状态（登录/支付成功后调用）
	updateMemberStatus: function(newStatus) {
		this.globalData.member_status = newStatus;
		this.globalData.is_member_valid = this.isMemberValid();
		
		// 存储到缓存（7天有效期）
		wx.setStorageSync('member_status', newStatus);
		// 更新数据时间戳
		wx.setStorageSync('last_data_update', Date.now());
		
		// 触发会员状态更新事件
    this.emit('memberStatusUpdated', newStatus);
    console.log('===memberStatusUpdated发送===');
	},
  accessVIPContent: function() {
    if (!this.globalData.member_status.is_member) {
      wx.showModal({
        title: '会员专享',
        content: '此功能需要会员权限，立即开通？',
        success: (res) => { 
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/my/member' });
          }else{
						this.gotoBack();
					}
        }
      });
      return false;
    }
    return true;
	},
	 // 添加检查会员状态的方法（可选）
	 checkMemberStatus() {
    return this.globalData.is_member_valid;
	},
	getCacheKey: function(key) {
			//const userNo = this.globalData.userInfo?.user_no || 'unknown';
			//return `${key}_${userNo}_v2`; // 添加用户编号和版本号
			return key;
	},
	// 增强的缓存保存方法
	saveUserData: function() {
		//if (this.globalData.userInfo?.user_no) {
				const cacheKey = this.getCacheKey('userVersion');
				wx.setStorageSync(cacheKey, this.globalData.userVersion);
				
				const memberKey = this.getCacheKey('member_status');
				wx.setStorageSync(memberKey, this.globalData.member_status);
				
				// 添加数据更新时间戳
				wx.setStorageSync('last_data_update', Date.now());
	//}
	},

	// 增强的缓存加载方法
	loadUserData: function() {
		//const userNo = this.globalData.userInfo?.user_no;
	//	if (userNo) {
				const cacheKey = this.getCacheKey('userVersion');
				const userVersion = wx.getStorageSync(cacheKey);
				
				const memberKey = this.getCacheKey('member_status');
				const memberStatus = wx.getStorageSync(memberKey);
				
				if (userVersion && userVersion.vg_id && userVersion.version_name) {
					this.globalData.userVersion = userVersion;
				}
				if (memberStatus && typeof memberStatus.is_member !== 'undefined') {
					this.globalData.member_status = memberStatus;
					this.globalData.is_member_valid = this.isMemberValid();
				}
		//}
	},

	// 清理用户缓存
	clearUserCache: function() {
		wx.removeStorageSync('userVersion');
		wx.removeStorageSync('last_data_update');
	},
	clearMemberCache: function() {
		wx.removeStorageSync('member_status');
		wx.removeStorageSync('last_data_update');
	},

	// 检查数据新鲜度
	checkDataFreshness: function() {
		const lastUpdate = wx.getStorageSync('last_data_update') || 0;
		const now = Date.now();
		const tenMinutes = 10 * 60 * 1000; // 10分钟
		
		// 如果超过10分钟没有更新数据，标记需要刷新
		if (now - lastUpdate > tenMinutes) {
				this.emit('dataRefreshRequired');
		}
	},
});