Component({
  properties: {
    src: String,
    autoPlay: {
      type: Boolean,
      value: false
    }
  },

  data: {
    isPlaying: false,
    audioContext: null
  },

  lifetimes: {
    attached() {
      this.data.audioContext = wx.createInnerAudioContext();
    },

    detached() {
      if (this.data.audioContext) {
        this.data.audioContext.stop();
        this.data.audioContext.destroy();
      }
    }
  },

  methods: {
    play() {
      if (!this.properties.src) return;
      
      const { audioContext } = this.data;
      audioContext.src = this.properties.src;
      audioContext.play();
      
      this.setData({ isPlaying: true });
      
      audioContext.onEnded(() => {
        this.setData({ isPlaying: false });
      });
      
      audioContext.onError(() => {
        this.setData({ isPlaying: false });
        wx.showToast({ title: '播放失败', icon: 'none' });
      });
    },

    stop() {
      if (this.data.audioContext) {
        this.data.audioContext.stop();
        this.setData({ isPlaying: false });
      }
    }
  }
});