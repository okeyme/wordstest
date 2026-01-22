import wordDataManager from '../../utils/wordDataManager';
import LearningRecordManager from '../../utils/learningRecordManager';

export default Behavior({
  data: {
    // 公共数据
    isPlaying: false,
    unitId: 0,
    wc_id: 0,
    vgId: 0,
    loading: false,
    list: [],
    wordItem: {},
    wordLetter: [],
    phonogram_letter: [],
    phonogram_map: { /* 音标映射表 */ },
    syllable_phonogram: [],
    syllable_phonogram_map: [],
    syllable_letters: [],
    letterIndex: -1,
    examples: [],
    exampleIndex: 0,
    wordCollect: [],
    audioContext: null,
    
    // 弹窗相关
    wordspeak_visible: false,
    wordspeak_word: '',
    wordspeak_audio: ''
  },

  lifetimes: {
    created() {
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
    /**
     * 公共初始化方法
     */
    async commonInit(options) {
      this.setData({
        vgId: getApp().globalData.userVersion.vg_id,
        unitId: options.unitId || 0,
        wc_id: options.wc_id || 0
      });
      
      await this.loadUnitData();
    },

    /**
     * 加载单元数据
     */
    loadUnitData() {
      const { vgId, unitId } = this.data;
      this.setData({ loading: true });
      
      return new Promise((resolve) => {
        wordDataManager.getUnitData(vgId, unitId, (result) => {
          this.setData({ loading: false });
          
          if (result.error) {
            wx.showToast({ title: '加载失败', icon: 'none' });
            resolve(false);
            return;
          }
          
          this.setData({
            list: result.list || []
          }, () => {
            this.loadWord();
            this.loadWordExample();
            resolve(true);
          });
        });
      });
    },

    /**
     * 加载当前单词
     */
    loadWord() {
      const { list, wc_id } = this.data;
      if (!list[wc_id]) return;
      
      const wordItem = list[wc_id];
      const wordLetter = wordItem.word.split('');
      
      this.setData({
        wordItem,
        wordLetter
      }, () => {
        this.processPhonogramData(wordItem);
        this.loadWordCollect();
      });
    },

    /**
     * 处理音标数据
     */
    processPhonogramData(wordItem) {
      // 处理自然拼读
      if (wordItem.phonogram_letters_ys && wordItem.word_letters) {
        const phonogram_letter = JSON.parse(wordItem.phonogram_letters_ys);
        const wordLetter = JSON.parse(wordItem.word_letters);
        this.setData({ phonogram_letter, wordLetter });
      }
      
      // 处理音节
      if (wordItem.syllable_phonogram && wordItem.syllable_letters) {
        const phonogramArr = JSON.parse(wordItem.syllable_phonogram);
        const pharr = phonogramArr[0].split('-');
        const phmaparr = phonogramArr[1].split('-');
        const larr = wordItem.syllable_letters.split('-');
        this.setData({
          syllable_phonogram: pharr,
          syllable_phonogram_map: phmaparr,
          syllable_letters: larr
        });
      }
    },

    /**
     * 加载单词例句
     */
    loadWordExample() {
      const { vgId, unitId, list, wc_id } = this.data;
      const wcIds = Object.keys(list);
      
      wordDataManager.getWordExamples(vgId, unitId, wcIds, (examplesResult) => {
        if (examplesResult.data && examplesResult.data[wc_id]) {
          this.setData({
            examples: examplesResult.data[wc_id].examples || []
          });
        }
      });
    },

    /**
     * 加载收藏状态
     */
    loadWordCollect() {
      const wordCollect = wx.getStorageSync('wordCollect') || [];
      this.setData({ wordCollect });
    },

    /**
     * 添加收藏
     */
    addCollectWord() {
      const { vgId, wordItem } = this.data;
      const app = getApp();
      
      const data = {
        vgId: vgId,
        category_id: wordItem.category_id,
        wc_id: wordItem.wc_id,
        word_id: wordItem.word_id
      };
      
      app.requestData('/word/addCollectWord', 'POST', data, (res) => {
        if (res.data.data.result === 'add' || res.data.data.result === 'del') {
          this.toggleCollectStorage(wordItem.wc_id);
        }
      });
    },

    /**
     * 切换收藏状态
     */
    toggleCollectStorage(wc_id) {
      const wordCollect = wx.getStorageSync('wordCollect') || [];
      const index = wordCollect.indexOf(wc_id);
      
      if (index === -1) {
        wordCollect.push(wc_id);
      } else {
        wordCollect.splice(index, 1);
      }
      
      wx.setStorageSync('wordCollect', wordCollect);
      this.setData({ wordCollect });
    },

    /**
     * 音频播放
     */
    audioPlay(src) {
      const { audioContext } = this.data;
      audioContext.src = src;
      audioContext.play();
      
      this.setData({ isPlaying: true });
      
      audioContext.onEnded(() => {
        this.setData({ isPlaying: false });
      });
      
      audioContext.onError(() => {
        getApp().showToast('播放失败');
      });
    },

    /**
     * 播放单词音频
     */
    playWordAudio() {
      const { wordItem } = this.data;
      if (!wordItem.audio) return;
      
      this.setData({ letterIndex: -1 });
      this.audioPlay(wordItem.audio);
    },

    /**
     * 播放例句音频
     */
    playExampleAudio(e) {
      const { examples } = this.data;
      const index = e.currentTarget.dataset.index;
      
      if (examples[index] && examples[index].example_audio) {
        this.setData({ letterIndex: -2 });
        this.audioPlay(examples[index].example_audio);
      }
    },

    /**
     * 打开跟读弹窗
     */
    openSpeakModal() {
      const { examples, exampleIndex } = this.data;
      if (!examples.length) return;
      
      this.checkRecordPermission(() => {
        this.setData({
          wordspeak_visible: true,
          wordspeak_word: examples[exampleIndex].example,
          wordspeak_audio: examples[exampleIndex].example_audio
        });
      });
    },

    /**
     * 检查录音权限
     */
    checkRecordPermission(callback) {
      wx.getSetting({
        success: (res) => {
          const authStatus = res.authSetting['scope.record'];
          if (authStatus === undefined) {
            wx.authorize({
              scope: 'scope.record',
              success: callback,
              fail: () => getApp().showToast('你拒绝了录音权限')
            });
          } else if (authStatus === true) {
            callback();
          } else {
            wx.openSetting({
              success: (res) => {
                if (res.authSetting['scope.record']) {
                  callback();
                }
              }
            });
          }
        }
      });
    },

    /**
     * 关闭弹窗
     */
    closeSpeakModal() {
      this.setData({ wordspeak_visible: false });
    },

    /**
     * 导航方法
     */
    goBack() {
      wx.navigateBack();
    },

    goHome() {
      wx.reLaunch({ url: '/pages/index/index' });
    }
  }
});