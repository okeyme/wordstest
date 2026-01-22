const app = getApp();
import wordDataManager from '../../utils/wordDataManager';

Page({
  data: {
    vgId: 0,
    loading: false,
    localVersion: 0,
    unitList: [],
    list: [],
    idlist: [],
    catelist: [],
    learn_time: 0,
    itemTranslate: [],

    // 分页相关
    pageSize: 15,
    currentPage: 1,
    totalWords: 0,
    hasMore: true,
    isLoadingMore: false,
    isRefreshing: false,
    
    // 单词数据
    allErrorWords: [],
    displayWords: [],
    recordlist: [], // 保持向后兼容
    
    // 缓存相关
    cacheTimestamp: null,
		cacheVersion: 0,
		
		// 滑动删除相关
    touchStartX: 0,           // 触摸开始X坐标
    touchStartY: 0,           // 触摸开始Y坐标
    currentIndex: -1,         // 当前滑动的索引
    deleteWidth: 120,         // 删除按钮宽度(rpx)
    isSwiping: false,         // 是否正在滑动
    swipedIndex: -1,          // 已滑出删除按钮的索引
    slideX: 0,                // 当前滑动距离
    isDeleting: false,        // 是否正在删除
    isTouchMoving: false      // 是否正在触摸移动
  },

  onLoad(options) {
    this.setData({
      vgId: app.globalData.userVersion.vg_id
    }, () => {
      // 1. 先尝试加载缓存
      this.loadCachedData();
      // 2. 异步获取最新数据
      this.loadErrorCollection(true);
    });
    
    // 监听错词更新事件
    app.on('errorCollectionUpdated', this.onErrorCollectionUpdated);
  },

  // 加载缓存数据
  loadCachedData() {
    const cacheKey = `wordCollection_${this.data.vgId}_error`;
    const localCache = wx.getStorageSync(cacheKey);
    
    if (localCache && localCache.words && localCache.words.length > 0) {
      console.log('使用缓存数据展示首屏');
      
      this.setData({
        allErrorWords: localCache.words,
        totalWords: localCache.words.length,
        cacheTimestamp: localCache.timestamp,
        cacheVersion: localCache.version || 0,
        recordlist: localCache.words // 保持向后兼容
      }, () => {
        // 更新显示数据（第一页）
        this.updateDisplayWords();
      });
    }
  },

  // 加载错词本（支持分页）
  async loadErrorCollection(forceRefresh = false) {
    // 如果是刷新，重置分页状态
    if (forceRefresh) {
      this.setData({
        currentPage: 1,
        hasMore: true,
        isRefreshing: true
      });
    }
    
    const { vgId, currentPage, pageSize } = this.data;
    
    try {
      // 从wordDataManager获取完整错词列表
      wordDataManager.getErrorCollection(vgId, (result) => {
        this.setData({ 
          isRefreshing: false,
          isLoadingMore: false 
        });
        
        if (!result.error && result.words) {
          const allWords = result.words;
          
          this.setData({
            allErrorWords: allWords,
            totalWords: allWords.length,
            hasMore: currentPage * pageSize < allWords.length,
            recordlist: allWords // 保持向后兼容
          }, () => {
            // 更新显示数据
            this.updateDisplayWords();
          });
          
          // 如果是远程数据，更新缓存信息
          if (result.fromRemote) {
            this.setData({
              cacheTimestamp: Date.now()
            });
          }
          
          console.log(`✅ 错词本加载完成: 共 ${allWords.length} 个单词`);
        } else {
          app.showToast("加载失败");
        }
      });
      
    } catch (error) {
      console.error('加载错词本失败:', error);
      this.setData({ 
        isRefreshing: false,
        isLoadingMore: false 
      });
      app.showToast("加载失败");
    }
  },

  // 更新显示单词（根据当前页码）
  updateDisplayWords() {
    const { allErrorWords, currentPage, pageSize } = this.data;
    
    // 计算起始位置
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    // 获取当前页的单词
    const currentPageWords = allErrorWords.slice(startIndex, endIndex);
    
    // 如果是第一页，直接替换；否则追加
    if (currentPage === 1) {
      this.setData({
        displayWords: currentPageWords
      });
    } else {
      this.setData({
        displayWords: [...this.data.displayWords, ...currentPageWords]
      });
    }
    
    console.log(`📄 第${currentPage}页: 显示${currentPageWords.length}个单词`);
  },

  // 加载更多（上拉触底）
  loadMoreWords() {
    const { isLoadingMore, hasMore, currentPage, allErrorWords, pageSize } = this.data;
    
    // 检查是否正在加载或没有更多数据
    if (isLoadingMore || !hasMore) {
      return;
    }
    
    // 计算是否还有更多数据
    const nextPage = currentPage + 1;
    const totalPages = Math.ceil(allErrorWords.length / pageSize);
    
    if (nextPage > totalPages) {
      this.setData({ hasMore: false });
      return;
    }
    
    console.log(`⬇️ 加载第${nextPage}页数据`);
    
    this.setData({
      isLoadingMore: true,
      currentPage: nextPage
    }, () => {
      // 更新显示数据
      this.updateDisplayWords();
      
      // 检查是否还有更多
      const remaining = allErrorWords.length - (nextPage * pageSize);
      if (remaining <= 0) {
        this.setData({ hasMore: false });
      }
      
      // 延迟一小段时间后取消加载状态
      setTimeout(() => {
        this.setData({ isLoadingMore: false });
      }, 300);
    });
  },

  // 上拉触底事件
  onReachBottom() {
    console.log('触底，加载更多');
    this.loadMoreWords();
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log('下拉刷新');
    this.setData({ isRefreshing: true });
    this.loadErrorCollection(true);
  },

  // 手动刷新
  manualRefresh() {
    console.log('手动刷新');
    this.setData({ isRefreshing: true });
    this.loadErrorCollection(true);
  },

  // 错词更新事件处理
  onErrorCollectionUpdated: function(data) {
    if (data && data.vgId == this.data.vgId) {
      console.log('错词有更新，重新加载');
      
      // 清除缓存
      const cacheKey = `wordCollection_${data.vgId}_error`;
      wx.removeStorageSync(cacheKey);
      
      // 重新加载数据（强制刷新）
      this.setData({ isRefreshing: true });
      this.loadErrorCollection(true);
    }
  },

  // 移除错词
  removeErrorWord(e) {
    const wc_id = e.currentTarget.dataset.wc_id;
    
    wordDataManager.removeFromErrorCollection(this.data.userId, this.data.vgId, wc_id, (result) => {
      if (result.success) {
        // 更新页面数据
        this.loadErrorCollection(true);
        wx.showToast({
          title: '已移除',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: '移除失败',
          icon: 'none'
        });
      }
    });
  },

  goThisWord: function(e) {
		const { index } = e.currentTarget.dataset;
		const displayWord = this.data.displayWords[index];
		
		if (!displayWord) return;
		
		// 获取所有错词单词的ID列表
		const idlist = this.data.allErrorWords.map(word => word.wc_id);
		
		// 找到当前单词在完整列表中的索引（用于wordlearn页面定位）
		const wordIndex = this.data.allErrorWords.findIndex(word => word.wc_id === displayWord.wc_id);
		
		// 构建跳转URL
		let url = `/pages/wordlist/wordlearn?wc_id=${displayWord.wc_id}&revise=1`;
		
		// 添加idlist参数
		if (idlist.length > 0) {
			url += `&idlist=${idlist.join(",")}`;
		}
		
		// 添加wordIndex参数（如果需要）
		url += `&wordIndex=${wordIndex}`;
		
		console.log('跳转到学习页参数:', { 
			wc_id: displayWord.wc_id, 
			wordIndex, 
			idlistLength: idlist.length 
		});
		
		app.gotoPage(url);
	},

  removewordError: function(e) {
    const { index, wc_id } = e.currentTarget.dataset;
    const { vgId } = this.data;
    
    wx.showModal({
      title: '确认移除吗？',
      confirmText: '确认',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          const data = { vgId: vgId, wc_id: wc_id };
          
          app.requestData('/word/removewordError', 'POST', data, (res) => {
            if (res && res.data.code === 0) {
              // 清除缓存并重新加载
              const cacheKey = `wordCollection_${vgId}_error`;
              wx.removeStorageSync(cacheKey);
              
              // 重新加载数据
              this.setData({ isRefreshing: true });
              this.loadErrorCollection(true);
              
              app.showToast('移除成功');
            } else {
              app.showToast('移除失败');
            }
          });
        }
      }
    });
  },

  onUnload() {
    // 移除监听
    app.off('errorCollectionUpdated', this.onErrorCollectionUpdated);
  },

  onReady() {
    // 确保页面可以下拉刷新
   // wx.startPullDownRefresh && wx.startPullDownRefresh();
  },

  onShow() {
    // 页面显示时检查是否有更新
    this.checkForUpdates();
  },

  // 检查更新
  checkForUpdates() {
    const { cacheTimestamp } = this.data;
    if (cacheTimestamp) {
      const now = Date.now();
      const timeDiff = now - cacheTimestamp;
      const TEN_MINUTES = 10 * 60 * 1000;
      
      // 如果缓存超过10分钟，静默刷新
      if (timeDiff > TEN_MINUTES) {
        console.log('缓存已过期，静默刷新');
        this.loadErrorCollection(true);
      }
    }
  },

  onHide() {},

  onShareAppMessage() {
    return {
      title: '我的错词本',
      path: '/pages/wordlist/worderror'
    };
	},
	
	// ==================== 触摸事件处理 ====================
  
  // 触摸开始
  onTouchStart(e) {
    // 如果正在删除，阻止触摸
    if (this.data.isDeleting) return;
    
    const { clientX, clientY } = e.touches[0];
    const index = e.currentTarget.dataset.index;
    
    // 如果已经有滑出的项，点击其他地方先收起
    if (this.data.swipedIndex !== -1 && this.data.swipedIndex !== index) {
      this.resetSwipe();
    }
    
    this.setData({
      touchStartX: clientX,
      touchStartY: clientY,
      currentIndex: index,
      isSwiping: false,
      isTouchMoving: false
    });
  },

  // 触摸移动
  onTouchMove(e) {
		if (this.data.isDeleting) return; // 正在删除时阻止滑动
		
		const { clientX, clientY } = e.touches[0];
		const index = e.currentTarget.dataset.index;
		
		// 计算移动距离
		const deltaX = clientX - this.data.touchStartX;
		const deltaY = clientY - this.data.touchStartY;
		
		// 如果是垂直滚动，不处理滑动删除
		if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 5) {
			// 垂直滚动，重置已滑出的项
			if (this.data.swipedIndex !== -1) {
				this.resetSwipe();
			}
			this.setData({ isTouchMoving: false });
			return;
		}
		
		// 如果是水平滑动
		if (Math.abs(deltaX) > 5) {
			// 在小程序中，我们不能使用 e.preventDefault()
			// 但是我们可以通过其他方式阻止默认行为
			this.setData({ isTouchMoving: true });
		}
		
		// 限制滑动方向：只允许向左滑动（deltaX为负数）
		// 向右滑动（正数）应该恢复位置
		let slideX = 0;
		if (deltaX < 0) {
			// 向左滑动，计算滑动距离
			const maxSlide = -this.data.deleteWidth;
			slideX = Math.max(maxSlide, deltaX);
		}
		
		// 只更新当前项的滑动位置
		if (this.data.currentIndex === index) {
			this.setData({ 
				slideX: slideX,
				isSwiping: Math.abs(slideX) > 10
			});
		}
	},
	// 在 worderror.js 中添加一个专门处理水平滑动的方法
	onHorizontalTouchMove(e) {
		if (this.data.isDeleting) return;
		
		const { clientX, clientY } = e.touches[0];
		const index = e.currentTarget.dataset.index;
		
		// 计算移动距离
		const deltaX = clientX - this.data.touchStartX;
		const deltaY = clientY - this.data.touchStartY;
		
		// 如果主要是水平滑动，就处理滑动删除
		if (Math.abs(deltaX) > Math.abs(deltaY)) {
			// 阻止事件冒泡，防止页面滚动
			// 在小程序中，我们不需要调用 e.preventDefault()
			
			// 限制滑动方向：只允许向左滑动（deltaX为负数）
			let slideX = 0;
			if (deltaX < 0) {
				// 向左滑动，计算滑动距离
				const maxSlide = -this.data.deleteWidth;
				slideX = Math.max(maxSlide, deltaX);
			}
			
			// 只更新当前项的滑动位置
			if (this.data.currentIndex === index) {
				this.setData({ 
					slideX: slideX,
					isSwiping: Math.abs(slideX) > 10,
					isTouchMoving: true
				});
			}
		}
	},

  // 触摸结束
  onTouchEnd(e) {
    if (this.data.isDeleting) return;
    
    const index = e.currentTarget.dataset.index;
    const currentSlideX = this.data.slideX;
    const threshold = this.data.deleteWidth / 2; // 阈值：删除按钮宽度的一半
    
    if (currentSlideX <= -threshold) {
      // 滑动超过阈值，锁定删除按钮位置
      this.setData({
        swipedIndex: index,
        slideX: -this.data.deleteWidth
      });
    } else {
      // 滑动不足，恢复原位
      this.resetSwipe();
    }
    
    this.setData({ 
      isSwiping: false,
      isTouchMoving: false
    });
  },

  // 重置滑动状态
  resetSwipe() {
    this.setData({
      slideX: 0,
      swipedIndex: -1,
      currentIndex: -1
    });
  },

  // 点击删除按钮
  onDeleteClick(e) {
    if (this.data.isDeleting) return;
    
    const { index, wc_id } = e.currentTarget.dataset;
    const word = this.data.displayWords[index];
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除单词 "${word.word}" 吗？`,
      confirmText: '删除',
      confirmColor: '#FF4444',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.deleteWord(wc_id, index);
        } else {
          // 取消删除时，收起删除按钮
          this.resetSwipe();
        }
      }
    });
  },

  // 执行删除操作
  deleteWord(wc_id, index) {
    this.setData({ isDeleting: true });
    
    const { vgId, displayWords } = this.data;
    const data = { vgId: vgId, wc_id: wc_id };
    
    // 先移除本地显示（给一个删除动画时间）
    setTimeout(() => {
      const updatedDisplayWords = [...displayWords];
      updatedDisplayWords.splice(index, 1);
      
      this.setData({
        displayWords: updatedDisplayWords,
        isDeleting: false
      });
      
      // 调用删除接口
      app.requestData('/word/removewordError', 'POST', data, (res) => {
        if (res && res.data.code === 0) {
          // 清除缓存并重新加载完整列表
          const cacheKey = `wordCollection_${vgId}_error`;
          wx.removeStorageSync(cacheKey);
          
          // 重新加载数据
          this.loadErrorCollection(true);
        } else {
          wx.showToast({
            title: '删除失败，请重试',
            icon: 'none'
          });
          // 恢复显示
          this.loadErrorCollection(true);
        }
      });
      
      wx.showToast({
        title: '删除成功',
        icon: 'success',
        duration: 1500
      });
    }, 300);
  },

  // 点击单词内容（跳转到学习页）
  onItemClick(e) {
    // 如果有滑动，先重置
    if (this.data.swipedIndex !== -1) {
      this.resetSwipe();
      return;
    }
    
    // 防止触摸移动时的误点击
    if (this.data.isTouchMoving) {
      return;
    }
    
    const { index } = e.currentTarget.dataset;
    this.goThisWord({ currentTarget: { dataset: { index } } });
  },

  // 页面触摸开始（点击空白处收起删除按钮）
  onPageTouchStart(e) {
    if (this.data.swipedIndex !== -1) {
      this.resetSwipe();
    }
  },
});