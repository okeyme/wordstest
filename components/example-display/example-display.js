Component({
	options: {
		// 开启全局样式继承，让 app.wxss 中的 .flex、.text-center 等类生效
		addGlobalClass: true
	},
  properties: {
    // 例句数组
    examples: {
      type: Array,
      value: []
    },
    
    // 当前例句索引
    currentIndex: {
      type: Number,
      value: 0
    },
    
    // 是否正在播放
    isPlaying: {
      type: Boolean,
      value: false
    },
    
    // 激活的音频索引
    activeAudioIndex: {
      type: Number,
      value: -1
    }
  },

  data: {
    // 组件内部状态
  },
  methods: {
    // 例句轮播变化
    onSwiperChange(e) {
      const current = e.detail.current;
      this.triggerEvent('examplechange', { current });
    },

    // 播放例句音频
    onPlayExample(e) {
      const index = e.currentTarget.dataset.index;
      this.triggerEvent('playexample', { index });
    },

    // 打开跟读弹窗
    onOpenSpeak() {
      this.triggerEvent('openspeak');
    }
  }
});