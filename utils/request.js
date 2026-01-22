const app = getApp()
// 从本地加载缓存
function loadUnitFromLocal(CACHE_KEY) {
	const cache = wx.getStorageSync(CACHE_KEY) || {};
	if (cache.data && cache.version) {
		var data = {
			unitList: cache.data.unitList || [],
			list: cache.data.list || [],
			localVersion: cache.version
		};
		return data;
	}
}

// 请求服务器数据（带Token验证）
function fetchUnitData(CACHE_KEY,localVersion) {
	var data = {vgId: app.globalData.userVersion.vg_id, local_version: localVersion};
	app.requestData('/word/getUnit','GET', data,(res) => {
			this.setData({ loading: false });
			console.log('res===',res);
			if (res.changed) {
				// 数据有更新
				const newData = {
					version: res.version,
					data: res.data,
					timestamp: Date.now()
				};
				wx.setStorageSync(CACHE_KEY, newData);
				
				var data = {
					unitList: res.data.unitList,
					list: res.data.list,
					localVersion: res.version
				};
				return data;
			}
			// 无更新时保持本地数据
		},
		(err) => {
			console.error('请求失败，使用本地缓存', err);
		}
	);
}

module.exports = {
  loadUnitFromLocal,fetchUnitData
}