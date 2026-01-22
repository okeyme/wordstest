// 定义Storage操作类
class wxc {
  // 获取存储的数据
  static get(key) {
    return new Promise((resolve, reject) => {
      wx.getStorage({
        key: key,
        success: res => resolve(res.data),
        fail: err => reject(err)
      })
    });
  }
 
  // 设置存储的数据
  static set(key, data) {
    return new Promise((resolve, reject) => {
      wx.setStorage({
        key: key,
        data: data,
        success: res => resolve(res),
        fail: err => reject(err)
      })
    });
  }
 
  // 清除存储的数据
  static clear(key) {
    return new Promise((resolve, reject) => {
      wx.removeStorage({
        key: key,
        success: res => resolve(res),
        fail: err => reject(err)
      })
    });
	}
}
module.exports = wxc;
 
// 使用示例
/*Storage.set('userInfo', { name: '张三', age: 30 }).then(res => {
  console.log('存储成功', res);
}).catch(err => {
  console.error('存储失败', err);
});
 
Storage.get('userInfo').then(data => {
  console.log('获取数据成功', data);
}).catch(err => {
  console.error('获取数据失败', err);
});
 
Storage.clear('userInfo').then(res => {
  console.log('清除成功', res);
}).catch(err => {
  console.error('清除失败', err);
});*/