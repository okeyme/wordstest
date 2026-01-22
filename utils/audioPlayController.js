/**
 * 音频播放控制器
 * 用于统一管理音频播放，防止重叠播放等问题
 */

class AudioPlayController {
  constructor() {
    this.isPlaying = false;
    this.currentQueue = null;
    this.currentIndex = -1;
    this.currentType = null;
    this.onEndCallback = null;
    this.audioContext = wx.createInnerAudioContext();
  }

  /**
   * 播放单个音频
   * @param {string} src 音频地址
   * @param {Function} onStart 开始回调
   * @param {Function} onEnd 结束回调
   * @returns {boolean} 是否成功开始播放
   */
  playSingle(src, onStart, onEnd) {
    // 停止当前播放
    this.stop();
    
    if (!src) {
      console.warn('音频地址为空');
      return false;
    }
    
    try {
      this.audioContext.src = src;
      this.isPlaying = true;
      
      if (onStart) onStart();
      
      this.audioContext.play();
      
      this.audioContext.onEnded(() => {
        this.isPlaying = false;
        if (onEnd) onEnd();
        this._cleanup();
      });
      
      this.audioContext.onError((err) => {
        console.error('音频播放失败:', err);
        this.isPlaying = false;
        if (onEnd) onEnd(err);
        this._cleanup();
      });
      
      return true;
    } catch (error) {
      console.error('播放音频出错:', error);
      this.isPlaying = false;
      return false;
    }
  }

  /**
   * 播放音频队列
   * @param {Array} items 音频项目数组
   * @param {string} type 类型 ('phonogram' 或 'syllable')
   * @param {Function} onItemStart 每个项目开始回调 (index, item)
   * @param {Function} onComplete 完成回调
   * @returns {boolean} 是否成功开始播放
   */
  playQueue(items, type, onItemStart, onComplete) {
    // 停止当前播放
    this.stop();
    
    if (!items || !items.length) {
      console.warn('音频队列为空');
      return false;
    }
    
    try {
      this.currentQueue = items;
      this.currentType = type;
      this.currentIndex = 0;
      this.onEndCallback = onComplete;
      this.isPlaying = true;
      
      this._playNextInQueue(onItemStart);
      return true;
    } catch (error) {
      console.error('播放音频队列出错:', error);
      this._cleanup();
      return false;
    }
  }

  /**
   * 播放队列中的下一个
   */
  _playNextInQueue(onItemStart) {
    if (!this.currentQueue || this.currentIndex >= this.currentQueue.length) {
      this._queueComplete();
      return;
    }

    const item = this.currentQueue[this.currentIndex];
    
    // 跳过特殊字符
    if (item === '#' || item === '@') {
      this.currentIndex++;
      setTimeout(() => this._playNextInQueue(onItemStart), 100);
      return;
    }

    const audioUrl = this.currentType === 'phonogram' 
      ? `https://w.360e.cn/yinbiao/ybsound/${item}.mp3`
      : `https://w.360e.cn/uploads/yinbiaomp3/${item}.mp3`;

    // 触发项目开始回调
    if (onItemStart) onItemStart(this.currentIndex, item);

    this.audioContext.src = audioUrl;
    this.audioContext.play();

    this.audioContext.onEnded(() => {
      this.currentIndex++;
      setTimeout(() => this._playNextInQueue(onItemStart), 100);
    });
    
    this.audioContext.onError((err) => {
      console.error('队列音频播放失败:', err);
      this.currentIndex++;
      setTimeout(() => this._playNextInQueue(onItemStart), 100);
    });
  }

  /**
   * 队列播放完成
   */
  _queueComplete() {
    this.isPlaying = false;
    if (this.onEndCallback) {
      this.onEndCallback();
    }
    this._cleanup();
  }

  /**
   * 清理状态
   */
  _cleanup() {
    this.currentQueue = null;
    this.currentIndex = -1;
    this.currentType = null;
    this.onEndCallback = null;
  }

  /**
   * 停止播放
   */
  stop() {
    if (this.audioContext) {
      this.audioContext.stop();
      this.audioContext.offEnded();
      this.audioContext.offError();
    }
    this.isPlaying = false;
    this._cleanup();
  }

  /**
   * 是否正在播放
   * @returns {boolean}
   */
  getIsPlaying() {
    return this.isPlaying;
  }

  /**
   * 销毁
   */
  destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.destroy();
    }
  }
}

export default AudioPlayController;