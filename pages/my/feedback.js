const app = getApp();
Page({
  data: {
    description: '',    // 问题描述内容
    charCount: 0,       // 字符计数
    images: [],         // 已上传图片列表
    showSuccessModal: false  // 是否显示成功弹窗
  },

  // 监听输入内容变化
  onInput(e) {
    const value = e.detail.value;
    this.setData({
      description: value,
      charCount: value.length
    });
  },

  // 选择图片
  chooseImage() {
    const that = this;
    const remainCount = 3 - this.data.images.length;
    
    wx.chooseImage({
      count: remainCount,  // 最多可选择的图片数量
      sizeType: ['original', 'compressed'],  // 可以指定是原图还是压缩图
      sourceType: ['album', 'camera'],       // 可以指定来源是相册还是相机
      success(res) {
        // 返回选定照片的本地文件路径列表
        const tempFilePaths = res.tempFilePaths;
        
        // 将新选择的图片添加到已有的图片列表中
        const newImages = that.data.images.concat(tempFilePaths);
        
        that.setData({
          images: newImages
        });
      }
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images;
    
    // 从数组中移除对应的图片路径
    images.splice(index, 1);
    
    this.setData({
      images: images
    });
  },

  // 提交反馈
  submitFeedback() {
    const that = this;
    const { description, images } = this.data;
    
    // 简单验证
    if (!description.trim()) {
      wx.showToast({
        title: '请输入问题描述',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 这里可以添加图片上传到服务器的逻辑
    // 实际开发中，需要将图片上传到后端服务器，获取图片URL
    // 这里仅做模拟
    console.log('问题描述:', description);
    console.log('图片列表:', images);
    
    // 模拟提交成功
    setTimeout(() => {
      that.setData({
        showSuccessModal: true
      });
    }, 500);
  },

  // 关闭弹窗
  closeModal() {
    this.setData({
      showSuccessModal: false,
      description: '',
      charCount: 0,
      images: []
    });
    
    // 可以在这里添加返回上一页的逻辑
    // wx.navigateBack();
  }
})