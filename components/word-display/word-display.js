Component({
	options: {
    // 开启全局样式继承，让 app.wxss 中的 .flex、.text-center 等类生效
    addGlobalClass: true
  },
  properties: {
    // 单词
    word: {
      type: String,
      value: ''
    },
    
    // 音标
    phonogram: {
      type: String,
      value: ''
    },
    
    // 释义
    translation: {
      type: String,
      value: ''
    },
    
    // 单词字母数组
    wordLetter: {
      type: Array,
      value: []
    },
    
    // 是否显示收藏按钮
    showCollect: {
      type: Boolean,
      value: true
    },
    
    // 是否显示详情按钮
    showDetail: {
      type: Boolean,
      value: true
    },
    
    // 是否显示释义
    showTranslation: {
      type: Boolean,
      value: true
    },
    
    // 是否正在播放
    isPlaying: {
      type: Boolean,
      value: false
    },
    
    // 激活的字母索引
    activeIndex: {
      type: Number,
      value: -1
    },
    
    // 是否已收藏
    isCollect: {
      type: Boolean,
      value: false
    }
  },

  data: {
    // 组件内部数据
  },

  methods: {
    // 播放音频
    onPlayAudio() {
      this.triggerEvent('playaudio');
    },
    
    // 收藏
    onCollect() {
      this.triggerEvent('collect');
    },
    
    // 查看详情
    onDetail() {
      this.triggerEvent('detail');
    }
  }
});