Component({
  // 接收从页面传递的参数
  properties: {
    // 搜索的单词
    searchWord: {
      type: String,
      value: '',
      observer: function(newVal) {
        if (newVal) {
          this.searchWordDetail(newVal);
        }
      }
    },
    // 控制组件显示/隐藏
    visible: {
      type: Boolean,
      value: false,
      observer: function(newVal) {
        console.log('弹窗显示状态：', newVal);
        if (newVal && this.data.searchWord) {
          // 如果显示且有单词，触发搜索
          this.searchWordDetail(this.data.searchWord);
        }
      }
    },
    // 用户信息
    userId: {
      type: Number,
      value: 0
    }
  },
  data: {
    app: null, // 缓存app实例
    // 单词详情
    wordDetail: {
      word: '',
      phonogram_en: '',
      en_audio: '',
      translate: '',
      affix: '',
      affix_gz: '',
      example_ids: []
    },
    // 音频控制
    audioContext: null,
    // 加载状态
    loading: false,
    // 当前播放的例句索引
    playingExampleIndex: -1
  },
  lifetimes: {
    attached() {
      const app = getApp();
      this.setData({app});
      // 初始化音频上下文
      const audioContext = wx.createInnerAudioContext();
      // 监听音频播放错误
      audioContext.onError((err) => {
        console.error('音频播放错误：', err);
        wx.showToast({
          title: '播放失败',
          icon: 'none'
        });
      });
      
      // 监听音频播放结束
      audioContext.onEnded(() => {
        this.setData({ 
          playingExampleIndex: -1 
        });
      });
      
      this.setData({ audioContext });
    },
    detached() {
      // 组件卸载时销毁音频上下文，避免内存泄漏
      const { audioContext } = this.data;
      if (audioContext) {
        audioContext.destroy();
      }
    },
  },
  methods: {
    // 搜索单词详情
    searchWordDetail(word) {
      if (!word.trim()) {
        return;
      }
      
      const { app, userId } = this.data;
      this.setData({ loading: true });
      
      const data = { 
        word: word,
        userId: userId || app.globalData.userInfo?.id || 0
      };
      
      // 调用word.php中的wordsearch方法
      app.requestData('/word/wordsearch', 'POST', data, 
        (res) => {
          if (res && res.data && res.data.data && res.data.data.data) {
            const wordData = res.data.data.data[0]; // 取第一个结果
            if (wordData) {
              this.setData({
                wordDetail: wordData,
                loading: false
              });
              console.log('单词详情加载成功:', wordData);
            } else {
              this.setData({ loading: false });
              wx.showToast({
                title: '未找到该单词',
                icon: 'none'
              });
            }
          } else {
            this.setData({ loading: false });
            wx.showToast({
              title: '加载失败',
              icon: 'none'
            });
          }
        },
        (err) => {
          console.error('请求失败', err);
          this.setData({ loading: false });
          wx.showToast({
            title: '网络错误',
            icon: 'none'
          });
        }
      );
    },
    
    // 播放单词发音
    playWordAudio() {
      const { wordDetail, audioContext } = this.data;
      if (!wordDetail.en_audio) {
        wx.showToast({
          title: '暂无发音',
          icon: 'none'
        });
        return;
      }
      
      audioContext.src = wordDetail.en_audio;
      audioContext.play();
    },
    
    // 播放例句发音
    playExampleAudio(e) {
      const index = e.currentTarget.dataset.index;
      const { wordDetail, audioContext } = this.data;
      const example = wordDetail.example_ids[index];
      
      if (!example || !example.example_audio) {
        wx.showToast({
          title: '暂无发音',
          icon: 'none'
        });
        return;
      }
      
      this.setData({ playingExampleIndex: index });
      audioContext.src = example.example_audio;
      audioContext.play();
    },
    
    // 查看完整详情（跳转到单词详情页）
    goToWordDetail() {
      const { wordDetail } = this.data;
      if (!wordDetail.word) return;
      
      // 先关闭弹窗
      this.closeModal();
      
      // 延迟跳转，确保弹窗关闭动画完成
      setTimeout(() => {
        const app = getApp();
        // 这里可以根据实际需要跳转到相应的详情页
        // app.gotoPage(`/pages/index/searchdetail?word=${wordDetail.word}`);
        wx.showToast({
          title: '跳转到详情页',
          icon: 'none'
        });
      }, 300);
    },
    
    // 复制单词
    copyWord() {
      const { wordDetail } = this.data;
      wx.setClipboardData({
        data: wordDetail.word,
        success: () => {
          wx.showToast({
            title: '已复制',
            icon: 'success'
          });
        }
      });
    },
    
    // 复制翻译
    copyTranslation() {
      const { wordDetail } = this.data;
      // 清理HTML标签，获取纯文本翻译
      const cleanTranslation = wordDetail.translate
        .replace(/<br>/g, '\n')
        .replace(/<[^>]+>/g, '');
      
      wx.setClipboardData({
        data: cleanTranslation,
        success: () => {
          wx.showToast({
            title: '已复制',
            icon: 'success'
          });
        }
      });
    },
    
    // 关闭弹窗（通知页面更新状态）
    closeModal() {
      // 停止音频播放
      const { audioContext } = this.data;
      if (audioContext) {
        audioContext.stop();
      }
      
      // 重置数据
      this.setData({
        playingExampleIndex: -1,
        wordDetail: {
          word: '',
          phonogram_en: '',
          en_audio: '',
          translate: '',
          affix: '',
          affix_gz: '',
          example_ids: []
        }
      });
      
      this.triggerEvent('close'); // 触发自定义事件
    }
  }
})