Page({
  data: {
    list: [
      { text: '列表项 1' },
      { text: '列表项 2' },
      { text: '列表项 3' },
      { text: '列表项 4' },
      { text: '列表项 5' }
    ],
    itemTranslate: [], // 存储每个项的偏移量
    menuWidth: 360, // 菜单总宽度 (180*2)
    startX: 0,      // 触摸开始的X坐标
    currentIndex: -1 // 当前操作的索引
  },

  onLoad() {
    // 初始化偏移量数组
    const itemTranslate = new Array(this.data.list.length).fill(0);
    this.setData({ itemTranslate });
  },

  // 触摸开始
  touchStart(e) {
    // 关闭其他项的菜单
    if (this.data.currentIndex !== -1 && this.data.currentIndex !== e.currentTarget.dataset.index) {
      const itemTranslate = this.data.itemTranslate;
      itemTranslate[this.data.currentIndex] = 0;
      this.setData({ itemTranslate });
    }
    
    this.setData({
      startX: e.changedTouches[0].clientX,
      currentIndex: e.currentTarget.dataset.index
    });
  },

  // 触摸移动
  touchMove(e) {
    const currentIndex = this.data.currentIndex;
    if (currentIndex === -1) return;

    const moveX = e.changedTouches[0].clientX - this.data.startX;
    let translate = 0;

    // 只允许向左滑动（显示菜单）
    if (moveX < 0) {
      // 限制滑动最大距离为菜单宽度
      translate = Math.max(moveX, -this.data.menuWidth);
    }

    const itemTranslate = this.data.itemTranslate;
    itemTranslate[currentIndex] = translate;
    this.setData({ itemTranslate });
  },

  // 触摸结束
  touchEnd() {
    const currentIndex = this.data.currentIndex;
    if (currentIndex === -1) return;

    const itemTranslate = this.data.itemTranslate;
    const currentTranslate = itemTranslate[currentIndex];

    // 判断滑动距离是否超过菜单宽度的一半
    if (currentTranslate < -this.data.menuWidth / 2) {
      // 显示完整菜单
      itemTranslate[currentIndex] = -this.data.menuWidth;
    } else {
      // 隐藏菜单
      itemTranslate[currentIndex] = 0;
    }

    this.setData({ itemTranslate });
  },

  // 收藏操作
  handleCollect(e) {
    const index = e.currentTarget.dataset.index;
    wx.showToast({
      title: `已收藏 ${this.data.list[index].text}`,
      icon: 'none'
    });
    
    // 操作后关闭菜单
    const itemTranslate = this.data.itemTranslate;
    itemTranslate[index] = 0;
    this.setData({ itemTranslate });
  },

  // 删除操作
  handleDelete(e) {
    const index = e.currentTarget.dataset.index;
    const list = this.data.list;
    const itemTranslate = this.data.itemTranslate;
    
    // 删除该项
    list.splice(index, 1);
    itemTranslate.splice(index, 1);
    
    this.setData({
      list,
      itemTranslate
    });
    
    wx.showToast({
      title: '已删除',
      icon: 'none'
    });
  }
});
