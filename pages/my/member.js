// member.js - 小程序会员页面
const app = getApp();

Page({
  data: {
    type:1,
    isLoading: false,      // 全局加载状态
    isMember: false,       // 会员状态
    currentOrderId: null,  // 当前订单ID
    membershipInfo: {
      plan_id: 1,
      price: 0.098,
      duration: '1年',
      description: '年度会员，享受全部特权'
    },
    btnDesc:'开通年度会员'
  },

  onLoad(options) {
    var type = options.type;
    this.data.type = type;
    if(this.data.type==2){
      this.setData({btnDesc:'续费年会员'});
    }
    this.checkMembershipStatus();
	},
	onUnload() {
	},
  // 检查会员状态
  checkMembershipStatus() {
    if(this.data.type==2) return;
    wx.showLoading({ title: '加载中...', mask: true });
    app.requestData('/member/getStatus', 'POST', {}, (res) => {
			wx.hideLoading();
			console.log('===res===',res);
      if (res.code === 0) {
        this.setData({ 
          isMember: res.data.is_member,
          // 显示剩余天数等更多信息
          membershipInfo: {
            ...this.data.membershipInfo,
            expire_date: res.data.expire_date || ''
          }
        });
      } else {
        wx.showToast({ title: res.data.message || '状态获取失败', icon: 'none' });
      }
    }, (err) => {
      wx.hideLoading();
      console.error('会员状态检查失败:', err);
      wx.showToast({ title: '网络异常', icon: 'none' });
    });
  },

  // 支付入口
  handlePay() {
    if (this.data.isMember) {
      wx.showToast({ title: '您已是会员', icon: 'none' });
      return;
    }
    
    this.setData({ isLoading: true });
    this.createPaymentOrder();
  },

  // 创建支付订单
  createPaymentOrder() {
    const { plan_id } = this.data.membershipInfo;
    
    app.requestData('/payment/createOrder', 'POST', { plan_id }, (res) => {
			console.log('===res createOrder===',res);
      if (res.code === 0) {
        const orderData = res.data;
        this.setData({ currentOrderId: orderData.orderId }); // 保存订单ID
        
        // 发起微信支付
        this.requestWechatPayment(orderData);
      } else {
        this.setData({ isLoading: false });
        wx.showModal({
          title: '订单创建失败',
          content: res.message || '请稍后重试',
          showCancel: false
        });
      }
    }, (err) => {
      this.setData({ isLoading: false });
      console.error('订单创建失败:', err);
      wx.showModal({
        title: '网络错误',
        content: '订单创建失败，请检查网络',
        showCancel: false
      });
    });
  },

  // 调用微信支付
  requestWechatPayment(orderData) {
    wx.requestPayment({
      timeStamp: orderData.timeStamp,
      nonceStr: orderData.nonceStr,
      package: orderData.package,
      signType: orderData.signType || 'MD5',
      paySign: orderData.paySign,
      success: (res) => {
        this.verifyPaymentResult(res);
      },
      fail: (err) => {
        this.setData({ isLoading: false });
        this.handlePaymentError(err);
      }
    });
  },

  // 验证支付结果（关键步骤）
  verifyPaymentResult(paymentRes) {
    const { currentOrderId } = this.data;
    
    app.requestData('/payment/confirmPayment', 'POST', { 
      orderId: currentOrderId,
      paymentResult: paymentRes 
    }, (res) => {
			console.log('====payment res===',res);
      this.setData({ isLoading: false });
      
      if (res.code === 0) {
				 // 支付成功处理
				 console.log('===res.data==',res.data);
				 if (res.data) {
					// 更新全局会员状态
					var memberStatus = res.data;
          app.updateMemberStatus(memberStatus);
          console.log('==member.js memberStatus更新 ==',memberStatus);
				 }
        this.setData({ isMember: true });
        wx.showToast({
          title: '开通成功!',
          icon: 'success',
          duration: 2000,
          success: () => {
            setTimeout(() => wx.navigateBack(), 2000);
          }
        });
      } else {
        // 支付验证失败
        wx.showModal({
          title: '验证失败',
          content: '请稍后在订单中心查看状态',
          confirmText: '查看订单',
          success: () => {
            wx.navigateTo({ url: '/pages/orders/orders' });
          }
        });
      }
    }, (err) => {
      this.setData({ isLoading: false });
      wx.showModal({
        title: '网络超时',
        content: '支付结果确认中，请稍后查看会员状态',
        showCancel: false
      });
    });
  },

  // 支付错误处理
  handlePaymentError(err) {
    const errMsg = err.errMsg || '';
    
    if (errMsg.includes('cancel')) {
      wx.showToast({ title: '支付已取消', icon: 'none' });
    } else {
      wx.showModal({
        title: '支付失败',
        content: errMsg || '支付过程中发生错误',
        confirmText: '重试支付',
        success: (res) => {
          if (res.confirm) this.handlePay();
        }
      });
    }
  },

  // 页面跳转
  goBack() {
    wx.navigateBack({ delta: 1 });
  }
});