//request
const app = getApp();
const request_serverHost = 'https://bossbell.com/miniprogram/index2.php';
function requestHttp(url,data={},token){
	var header = {};
	header['content-type'] = 'application/x-www-form-urlencoded';
	header['access_token'] = token;
	return new Promise((resolve, reject) => {
		wx.request({
				url: url,
				method: 'POST',
				data: data,
				header: header,
				success(res) {
					checkAuth(res); // 在此处统一拦截token过期，跳转到登录界面
					resolve(res);
					/*if (res.data.code === 10000) {
						resolve(res.data.data);
					} else {
						reject(res.data.msg);
					}*/
				},
				fail(e) {
					console.log('@@@@res22',res);
					reject(res);
				}
		})
	})
}

function checkAuth(res){
	var code = res.data.code;
	if(code==10001){ //注册新用户失败
		console.log('代码code='+code);
		app.gotoHome(); return;
	}else if (code == 10002) {
		console.log('代码code='+code);
		//未登录
		app.gotoHome(); return;
	}else if (code == 10003) { //token过期
		console.log('代码code='+code);
		return;
	}
}

function checkToken(token) {
	requestHttp(request_serverHost,{ac:'checktoken'},token).then(res => {
		// 处理响应数据
		if (res.data.code == 10000) {
			console.log("token未过期");
		} else {
			console.log("token已过期, 刷新token...");
			// 去后台刷新 token
			refreshToken();
		}
	}).catch(error => {
		// 处理错误
		userLogin();
	})
}

function refreshToken() {
	//查有没有缓存 refreshtoken, 缓存可能被清空
	wx.getStorage({
		key: 'refreshtoken',
		// 有refreshtoken, 到后台刷新 token
		success(res) {
			console.log("refreshtoken: " + res.data);
			refreshToken2(res.data);
		},
		// 没有缓存refreshtoken, 需要登录
		fail(e) {
			console.log("not saved refreshtoken, login...");
			userLogin();
		}
	})
}

//去后台刷新 token
function refreshToken2(refreshtoken) {
	requestHttp(request_serverHost,{ac:'refreshtoken'},refreshtoken).then(res => {
		// 处理响应数据
		if (res.data.code == 10000 && res.data.data.token) {
			app.globalData.token = res.data.data.token;
			app.saveStorage(token,res.data.data.token);
			/*
			console.log('新token='+res.data.data.token);
			that.saveToken(that,'token',res.data.data.token)
			that.globalData.token = res.data.data.token;
			that.saveToken(that,'uid',res.data.data.uid);
			that.globalData.token = res.data.data.token;
			that.globalData.uid = res.data.data.uid;*/
		} else {
			console.log("refresh token失败, 重新登录...");
			userLogin();
		}
	}).catch(error => {
		// 处理错误
		userLogin();
	})
}
// wx.login 获取 code,
// wx.getUserInfo 获取 encryptedData 和 iv
// 去后台换取 token
function userLogin() {
	console.log('===login====');
	// wx.login 获取 code,
	wx.login({
		success(res) {
			console.log(res);
			if (res.code) {
				console.log("code:" + res.code);
				userLogin2(res.code);
			} else {
				console.error("【wx login failed】");
			}
		},
		fail(e) {
			console.error(e);
			console.error("【wx login failed】");
		}
	})
}
// 检查授权, wx.getUserInfo
function userLogin2(code) {
	console.log('===login2====');
	// 检查是否授权
	wx.getSetting({
		success(res) {
			// 已经授权, 可以直接调用 getUserInfo 获取头像昵称
			if (res.authSetting['scope.userInfo']) {
				userLogin3(code);
			} else { //没有授权 
				if (wx.canIUse('button.open-type.getUserInfo')) {
					// 高版本, 需要转到授权页面 
					wx.navigateTo({
						url: '/pages/auth/index?code=' + code,
					});
					console.log('高版本，需要授权登录');
				} else {
					//低版本, 调用 getUserInfo, 系统自动弹出授权对话框
					userLogin3(code);
				}
			}
		}
	})
}
// wx.getUserInfo
function userLogin3(code) {
	wx.getUserInfo({
		success: function(res) {
			console.log(res);
			if (res.userInfo) {
				app.globalData.userInfo = res.userInfo;
			}
			if (code && res.encryptedData && res.iv) {
				userLogin4(code, res.encryptedData, res.iv);
			} else {
				console.error("【wx getUserInfo failed】");
			}
		},
		fail(e) {
			console.error(e);
			console.error("【wx getUserInfo failed】");
		}
	})
}
//去后台获取用户 token
function userLogin4(code, data, iv) {
	requestHttp(request_serverHost,{ac:'wxlogin',code: code,data: data,iv: iv},'').then(res => {
		// 处理响应数据
		  console.log(res)
			if (res.data.code == 10000) {
				if (res.data.data.token) {
					app.saveStorage('token',res.data.data.token);
					app.globalData.token = res.data.data.token;
				} else {
					console.error("【userLogin token failed】")
				}
				if (res.data.data.refreshtoken) {
					console.log(res.data.data.refreshtoken);
					app.saveStorage('refreshtoken',res.data.data.refreshtoken);
					app.data.refreshtoken = res.data.data.refreshtoken;
				} else {
					console.error("【userLogin refreshtoken failed】")
				}
			} else {
				console.error("【userLogin failed】")
			}
	}).catch(error => {
		// 处理错误
		console.error('#######app_res_error#####',error);
	})
}


module.exports = {
  requestHttp: requestHttp,
  checkAuth: checkAuth
}