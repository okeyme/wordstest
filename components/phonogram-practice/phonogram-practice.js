Component({
	options: {
    // 开启全局样式继承，让 app.wxss 中的 .flex、.text-center 等类生效
    addGlobalClass: true
  },
  properties: {
    // 自然拼读数据
    phonogram: {
      type: Array,
      value: []
    },
    
    // 音节拼读数据
    syllablePhonogram: {
      type: Array,
      value: []
    },
    
    // 音节字母
    syllableLetters: {
      type: Array,
      value: []
    },
    
    // 音节音标映射
    syllablePhonogramMap: {
      type: Array,
      value: []
    },
    
    // 音标映射表
    phonogramMap: {
      type: Object,
      value: {}
    },
    
    // 单词字母
    wordLetters: {
      type: Array,
      value: []
    },
    
    // 激活索引
    activeIndex: {
      type: Number,
      value: -1
    },
    
    // 是否正在播放
    isPlaying: {
      type: Boolean,
      value: false
    },
    
    // 激活的组
    activeGroup: {
      type: Number,
      value: 0
    }
  },

  data: {
    // 组件内部状态
  },

  methods: {
    // 点击自然拼读单个音标
    onPhonogramTap(e) {
      const index = e.currentTarget.dataset.index;
      const item = this.data.phonogram[index];
      
      if (!item || item === '#') return;
      
      this.triggerEvent('letterplay', {
        index: index,
        symbol: this.data.phonogramMap[item],
        letter: this.data.wordLetters[index]
      });
    },

    // 点击音节拼读单个音节
    onSyllableTap(e) {
      const index = e.currentTarget.dataset.index;
      const item = this.data.syllablePhonogram[index];
      
      if (!item) return;
      
      this.triggerEvent('syllableplay', {
        index: index,
        symbol: item,
        text: this.data.syllableLetters[index]
      });
    },

    // 点击自然拼读全部播放
    onPhonogramAllTap() {
      this.triggerEvent('letterplayall');
    },

    // 点击音节拼读全部播放
    onSyllableAllTap() {
      this.triggerEvent('syllableall');
    }
  }
});