const app = getApp();
import wordDataManager from '../../utils/wordDataManager';
import LearningRecordManager from '../../utils/learningRecordManager';

Page({
  data: {
    // 基本数据
    unitId: 0,
    wc_id: 0,
    vgId: 0,
    list: [],
    wordItem: {},
    idlist: [],
    revise: 0,
    
    // 音频相关
    isPlaying: false,
    letterIndex: -1,
		audioContext: null,
		audioTemp: null,
    
    // 训练步骤
    models: [
      { isDone: true, text: "学" },
      { isDone: false, text: "读" },
      { isDone: false, text: "选" },
      { isDone: false, text: "拼读" },
      { isDone: false, text: "拆分" },
      { isDone: false, text: "拼写" }
    ],
    modelsTab: 0,
    
    // 单词数据
    wordLetter: [],
    phonogram_letter: [],
    phonogram_map: {
      "tr":"tr","dz":"dz","dr":"dr","ey":"eɪ","ch":"tʃ","jh":"dʒ","ur":"ʊə","ar":"eə",
      "ir":"ɪə","ow":"əʊ","aw":"aʊ","ay":"aɪ","oy":"ɔɪ","aa":"ɑː","ao":"ɔː","er":"ɜː",
      "iy":"iː","ts":"ts","uw":"uː","hh":"h","sh":"ʃ","zh":"ʒ","w":"w","ng":"ŋ","m":"m",
      "n":"n","y":"j","r":"r","l":"l","s":"s","z":"z","ih":"ɪ","dh":"ð","th":"θ","v":"v",
      "f":"f","k":"k","g":"ɡ","ax":"ə","t":"t","b":"b","p":"p","ae":"æ","eh":"e","ah":"ʌ",
      "uh":"ʊ","oo":"ɒ","d":"d","jum":"juː","aie":"aɪə","aue":"aʊə","gj":"ɡz","jr":"jə",
      "yuu":"jʊ","yur":"jʊə","js":"ks","jw":"kw","l1":"l","ht":"tiː","wa":"wʌ","tq":"tθ",
      "eks":"eks","#":"-","@":"✿"
    },
    syllable_phonogram: [],
    syllable_phonogram_map: [],
    syllable_letters: [],
    phonogram_btngroup: 0,
    
    // 例句
    examples: [],
    exampleIndex: 0,
    
    // 收藏
    wordCollect: [],
    
    // 选择题
    selectOptions: [],
    selectedOptionIndex: -1,
    selectStatus: 0,
    
    // 拼写
    writeValue: '',
    writeStatus: 0,
    
    // 语音测评
    isRecording: false,
    recordTimer: null,
    recordDuration: 0,
    recordedFilePath: '',
    showLoading: false,
    loadingText: '',
    evaluationResult: {
      overallScore: 0,
      starRating: { stars: [], score: 0, color: '' }
    },
    
    // UI相关
    scrollTop: 0,
    scrollLeft: 0,
    itemWidth: [],
    changeClass: '',
    
    // 弹窗
    wordspeak_visible: false,
    wordspeak_word: '',
    wordspeak_audio: ''
  },

  onLoad(options) {
    // 初始化参数
    const unitId = options.unitId || 0;
    const wc_id = options.wc_id || 0;
    const idlist = options.idlist ? options.idlist.split(",") : [];
    const revise = options.revise || 0;
    
    this.setData({
      audioContext: wx.createInnerAudioContext(),
      vgId: app.globalData.userVersion.vg_id,
      unitId,
      wc_id,
      idlist,
      revise
    }, () => {
      this.init();
    });
  },

  async init() {
    await this.loadUnitData();
  },

  /**
   * 加载单元单词数据
   */
  loadUnitData() {
    this.setData({ loading: true });
    
    wordDataManager.getUnitData(this.data.vgId, this.data.unitId, (result) => {
      this.setData({ loading: false });
      
      if (result.error) {
        wx.showToast({ title: '加载失败', icon: 'none' });
        return;
      }
      
      this.setData({
        list: result.list || []
      }, () => {
        this.loadCurrentWord();
      });
    });
  },

  /**
   * 加载当前单词
   */
  loadCurrentWord() {
    const { list, wc_id } = this.data;
    if (!list[wc_id]) return;
    
    const wordItem = list[wc_id];
    const wordLetter = wordItem.word.split('');
    
    this.setData({
      wordItem,
      wordLetter
    }, () => {
      // 处理音标数据
      this.processPhonogramData(wordItem);
      
      // 加载例句
      this.loadWordExamples();
      
      // 生成选择题选项
      this.generateSelectOptions();
      
      // 添加学习记录
      this.addLearningRecord();
      
      // 加载收藏状态
      this.loadWordCollect();
      
      // 重置滚动位置
      this.resetScrollPosition();
    });
  },

  /**
   * 处理音标数据
   */
  processPhonogramData(wordItem) {
    // 自然拼读
    if (wordItem.phonogram_letters_ys && wordItem.word_letters) {
      try {
        const phonogram_letter = JSON.parse(wordItem.phonogram_letters_ys);
        const wordLetter = JSON.parse(wordItem.word_letters);
        this.setData({ phonogram_letter, wordLetter });
      } catch (e) {
        console.error('解析自然拼读数据失败:', e);
      }
    }
    
    // 音节拼读
    if (wordItem.syllable_phonogram && wordItem.syllable_letters) {
      try {
        const phonogramArr = JSON.parse(wordItem.syllable_phonogram);
        const pharr = phonogramArr[0].split('-');
        const phmaparr = phonogramArr[1].split('-');
        const larr = wordItem.syllable_letters.split('-');
        this.setData({
          syllable_phonogram: pharr,
          syllable_phonogram_map: phmaparr,
          syllable_letters: larr
        });
      } catch (e) {
        console.error('解析音节拼读数据失败:', e);
      }
    }
  },

  /**
   * 加载单词例句
   */
  loadWordExamples() {
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
   * 生成选择题选项
   */
  generateSelectOptions() {
    const { list, wc_id, wordItem } = this.data;
    const keys = Object.keys(list);
    
    // 移除当前单词
    const otherKeys = keys.filter(key => key !== wc_id.toString());
    
    // 随机选择3个
    const randomKeys = [...otherKeys]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    // 添加当前单词并打乱
    const allKeys = [...randomKeys, wc_id.toString()].sort(() => Math.random() - 0.5);
    const options = allKeys.map(key => list[key]);
    
    this.setData({ selectOptions: options });
  },

  /**
   * 添加学习记录
   */
  addLearningRecord() {
    const { vgId, wordItem, revise } = this.data;
    
    LearningRecordManager.addLearningRecord({
      vgId: vgId,
      category_id: wordItem.category_id,
      wc_id: wordItem.wc_id,
      word_id: wordItem.word_id,
      revise: revise
    }).then(result => {
      console.log('学习记录添加成功');
    }).catch(error => {
      console.error('学习记录添加失败:', error);
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
   * 重置滚动位置
   */
  resetScrollPosition() {
    setTimeout(() => {
      this.setData({ scrollTop: 0 });
    }, 300);
  },

  /**
   * 训练步骤切换
   */
  stepClickChange(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ modelsTab: index });
    
    // 如果是"读"步骤，检查录音权限
    if (index === 1) {
      this.checkRecordPermission();
    }
  },

  stepChange(e) {
    const index = e.detail.current;
    this.setData({ modelsTab: index });
    
    if (index === 1) {
      this.checkRecordPermission();
    }
  },

  /**
   * 下一步训练
   */
  nextStep() {
    const { modelsTab, models } = this.data;
    
    if (modelsTab < models.length - 1) {
      const newModels = [...models];
      newModels[modelsTab].isDone = true;
      
      this.setData({
        modelsTab: modelsTab + 1,
        models: newModels
      });
    } else {
      this.nextWord();
    }
  },

  /**
   * 切换单词标签
   */
  switchTab(e) {
    const index = e.currentTarget.dataset.index;
    this.changeWord(index);
  },

  /**
   * 切换单词
   */
  changeWord(newWcId) {
    // 重置训练状态
    const resetModels = this.data.models.map((item, i) => ({
      ...item,
      isDone: i === 0
    }));
    
    this.setData({
      models: resetModels,
      modelsTab: 0,
      wc_id: newWcId,
      selectedOptionIndex: -1,
      selectStatus: 0,
      writeValue: '',
      writeStatus: 0,
      isPlaying: false,
      letterIndex: -1,
      changeClass: 'transition: opacity 0.3s ease, transform 0.3s ease;'
    }, () => {
      this.loadCurrentWord();
      this.scrollToCurrentWord();
    });
  },

  /**
   * 滚动到当前单词位置
   */
  scrollToCurrentWord() {
    setTimeout(() => {
      const { wc_id, itemWidth, list } = this.data;
      const keys = Object.keys(list);
      const index = keys.indexOf(wc_id.toString());
      
      if (index < 0 || index >= keys.length || !itemWidth.length) return;
      
      let leftTotalWidth = 0;
      for (let i = 0; i < index; i++) {
        leftTotalWidth += itemWidth[i] || 0;
      }
      
      const windowInfo = wx.getWindowInfo();
      const windowWidth = windowInfo.windowWidth;
      const currentTabWidth = itemWidth[index] || 0;
      
      const scrollLeft = leftTotalWidth - (windowWidth / 2 - currentTabWidth / 2);
      this.setData({ scrollLeft });
    }, 100);
  },

  /**
   * 下一个单词
   */
  nextWord() {
    const { wc_id, list } = this.data;
    const keys = Object.keys(list);
    const currentIndex = keys.indexOf(wc_id.toString());
    
    if (currentIndex < keys.length - 1) {
      const nextWcId = keys[currentIndex + 1];
      this.changeWord(nextWcId);
    } else {
      wx.showToast({ title: '本单元已学习完成', icon: 'success' });
    }
  },

  /**
   * 上一个单词
   */
  prevWord() {
    const { wc_id, list } = this.data;
    const keys = Object.keys(list);
    const currentIndex = keys.indexOf(wc_id.toString());
    
    if (currentIndex > 0) {
      const prevWcId = keys[currentIndex - 1];
      this.changeWord(prevWcId);
    }
  },

  /**
   * 音频播放相关方法
   */
  playWordAudio() {
    const { wordItem } = this.data;
    if (!wordItem.audio) return;
    
    this.setData({ letterIndex: -1 });
    this.audioPlay(wordItem.audio);
	},
	/**
   * 终止所有音频播放（包括队列）
   */
	stopAllAudio() {
    const { audioContext, audioTemp, isPlayingQueue } = this.data;
    
    // 1. 清除所有延时器
    if (audioTemp) {
      clearTimeout(audioTemp);
      this.setData({ audioTemp: null });
    }
    
    // 2. 停止当前音频播放
    if (audioContext) {
      // 移除所有事件监听
      audioContext.offEnded();
      audioContext.offError();
      // 停止音频
      audioContext.stop();
    }
    
    // 3. 重置播放状态
    this.setData({
      isPlaying: false,
      isPlayingQueue: false
    });
  },

  /**
   * 通用音频播放
   */
  audioPlay(src) {
    // 播放前先终止所有之前的音频
    this.stopAllAudio();
    
    const { audioContext } = this.data;
    
    // 空值判断
    if (!audioContext || !src) return;
    
		// 设置音频源并播放
		this.setData({ isPlaying: true });
		console.log('isPlaying-wordlearn==='+this.data.isPlaying);
    audioContext.src = src;
    audioContext.play();
    
    // 重新注册事件监听（确保只有一个监听）
    audioContext.onEnded(() => {
      this.setData({ isPlaying: false });
    });
    
    audioContext.onError((err) => {
      console.error('音频播放失败:', err);
      this.setData({ isPlaying: false });
      wx.showToast({ title: '播放失败', icon: 'none' });
    });
  },

  /**
   * 组件事件处理 - 音标拼读
   */
  onLetterPlay(e) {
		this.stopAllAudio();
    const index = e.detail.index;
    const item = this.data.phonogram_letter[index];
    
    if (!item || item === '#') return;
    
    const audioUrl = `https://w.360e.cn/yinbiao/ybsound/${item}.mp3`;
    this.setData({ letterIndex: index });
    this.audioPlay(audioUrl);
  },

  onLetterPlayAll() {
		this.stopAllAudio();
    this.setData({ phonogram_btngroup: 0, letterIndex: -1 });
    this.playPhonogramQueue(this.data.phonogram_letter, 'phonogram');
  },

  onSyllablePlay(e) {
		this.stopAllAudio();
    const index = e.detail.index;
    const item = this.data.syllable_phonogram_map[index];
    if (!item) return;
    const audioUrl = `https://w.360e.cn/uploads/yinbiaomp3/${item}.mp3`;
    this.setData({ letterIndex: index });
    this.audioPlay(audioUrl);
  },

  onSyllableAll() {
		this.stopAllAudio();
    this.setData({ phonogram_btngroup: 1, letterIndex: -1 });
    this.playPhonogramQueue(this.data.syllable_phonogram_map, 'syllable');
  },

  /**
   * 播放音标队列
   */
  playPhonogramQueue(items, type) {
    // 播放队列前先终止所有之前的播放
    this.stopAllAudio();
    
    const { audioContext,wordItem } = this.data;
    let index = 0;
    
    // 标记正在播放队列
    this.setData({ isPlayingQueue: true });
    
    const playNext = () => {
      // 如果已被终止，直接退出
      if (!this.data.isPlayingQueue) return;
      
      if (index >= items.length) {
        // 播放完成后重置状态
        this.setData({ 
          isPlaying: false, 
          letterIndex: -1,
          isPlayingQueue: false 
        });
        
        // 播放完成后播放单词音频
        const tempTimer = setTimeout(() => {
					if(type == 'syllable'){
						this.audioPlay('https://w.360e.cn/uploads/youdaowordmp3/'+wordItem.word+'.mp3');
					}else{
						this.playWordAudio();
					}
        }, 300);
        this.setData({ audioTemp: tempTimer });
        return;
      }
      
      const item = items[index];
      if (item === '#') {
        index++;
        playNext();
        return;
      }
      
      const audioUrl = type === 'phonogram' 
        ? `https://w.360e.cn/yinbiao/ybsound/${item}.mp3`
        : `https://w.360e.cn/uploads/yinbiaomp3/${item}.mp3`;
      
      this.setData({ letterIndex: index, isPlaying: true });
      
      // 停止当前音频并移除监听
      audioContext.offEnded();
      audioContext.stop();
      
      // 设置新音频
      audioContext.src = audioUrl;
      audioContext.play();
      
      // 监听当前音频结束
      audioContext.onEnded(() => {
        // 如果已被终止，直接退出
        if (!this.data.isPlayingQueue) return;
        
        index++;
        const tempTimer = setTimeout(playNext, 300);
        this.setData({ audioTemp: tempTimer });
      });
      
      // 监听音频错误
      audioContext.onError((err) => {
        console.error('音标音频播放失败:', err);
        index++;
        const tempTimer = setTimeout(playNext, 300);
        this.setData({ audioTemp: tempTimer });
      });
    };
    
    playNext();
  },

  onPhonogramPlayEnd() {
    this.setData({ isPlaying: false });
  },

  /**
   * 组件事件处理 - 例句
   */
  onExampleChange(e) {
    const index = e.detail.current;
    this.setData({ exampleIndex: index });
  },

  onPlayExampleAudio(e) {
    const index = e.detail.index;
    const { examples } = this.data;
    
    if (examples[index] && examples[index].example_audio) {
			this.setData({ letterIndex: -2, isPlaying:true });
			console.log('letterIndex-wordlearn===='+this.data.letterIndex);
      this.audioPlay(examples[index].example_audio);
    }
  },

  /**
   * 组件事件处理 - 拼读练习
   */
  onSpellComplete(e) {
    const { isCorrect } = e.detail;
    
    if (isCorrect) {
      wx.showToast({
        title: "拼写正确！",
        icon: "none",
        duration: 1500
      });
      
      setTimeout(() => {
        this.nextStep();
      }, 2000);
    } else {
      wx.showToast({
        title: "错误！已加入错词本。",
        icon: "none",
        duration: 1500
      });
      
      this.addErrorWord();
      
      setTimeout(() => {
        this.nextStep();
      }, 2000);
    }
  },

  onSpellDelete(e) {
    // 删除逻辑，组件内部已处理
  },

  onSpellSelect(e) {
    // 选择逻辑，组件内部已处理
  },

  onSpellReset() {
    // 重置逻辑，组件内部已处理
  },

  /**
   * 组件事件处理 - 拆分练习
   */
  onSyllableComplete(e) {
    const { isCorrect } = e.detail;
    
    if (isCorrect) {
      wx.showToast({
        title: "拼写正确！",
        icon: "none",
        duration: 1500
      });
      
      setTimeout(() => {
        this.nextStep();
      }, 2000);
    } else {
      wx.showToast({
        title: "错误！已加入错词本。",
        icon: "none",
        duration: 1500
      });
      
      this.addErrorWord();
      
      setTimeout(() => {
        this.nextStep();
      }, 2000);
    }
  },

  onSyllableDelete(e) {
    // 删除逻辑，组件内部已处理
  },

  onSyllableSelect(e) {
    // 选择逻辑，组件内部已处理
  },

  onSyllableReset() {
    // 重置逻辑，组件内部已处理
  },

  /**
   * 选择题处理
   */
  handleSelectOption(e) {
    if (this.data.selectedOptionIndex !== -1) return;
    
    const index = e.currentTarget.dataset.index;
    const { selectOptions, wordItem } = this.data;
    const selectedWord = selectOptions[index].word;
    
    const isCorrect = selectedWord === wordItem.word;
    this.setData({
      selectedOptionIndex: index,
      selectStatus: isCorrect ? 1 : 2
    });
    
    if (!isCorrect) {
      this.addErrorWord();
    }
    
    setTimeout(() => {
      this.nextStep();
    }, 2000);
  },

  /**
   * 键盘输入处理
   */
  onKeyClick(e) {
    const key = e.detail.key;
    this.setData({
      writeValue: this.data.writeValue + key
    });
  },

  onBackspace() {
    const currentValue = this.data.writeValue;
    if (currentValue.length > 0) {
      this.setData({
        writeValue: currentValue.slice(0, -1)
      });
    }
  },

  onSpace() {
    this.setData({
      writeValue: this.data.writeValue + ' '
    });
  },

  onComplete() {
    const { writeValue, wordItem } = this.data;
    const isCorrect = writeValue === wordItem.word;
    
    if (isCorrect) {
      wx.showToast({ title: '拼写正确!', icon: "none", duration: 2000 });
    } else {
      wx.showToast({ title: '错误!已加入错词本。', icon: "none", duration: 2000 });
      this.addErrorWord();
    }
    
    setTimeout(() => {
      this.nextStep();
    }, 2000);
  },

  /**
   * 添加错词
   */
  addErrorWord() {
    const { vgId, wordItem } = this.data;
    
    wordDataManager.addToErrorCollection(vgId, wordItem, (result) => {
      if (result.success) {
        app.emit('errorCollectionUpdated', {
          vgId: vgId,
          wc_id: wordItem.wc_id,
          action: 'add'
        });
      }
    });
  },

  /**
   * 收藏单词
   */
  addCollectWord() {
    const { vgId, wordItem } = this.data;
    
    app.requestData('/word/addCollectWord', 'POST', {
      vgId: vgId,
      category_id: wordItem.category_id,
      wc_id: wordItem.wc_id,
      word_id: wordItem.word_id
    }, (res) => {
      if (res.data.data.result === 'add' || res.data.data.result === 'del') {
        this.toggleCollectStorage(wordItem.wc_id);
      }
    });
  },

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
   * 检查录音权限
   */
  checkRecordPermission() {
    wx.getSetting({
      success: (res) => {
        const authStatus = res.authSetting['scope.record'];
        if (authStatus === undefined) {
          wx.authorize({
            scope: 'scope.record',
            fail: () => {
              app.showToast('你拒绝了录音权限');
            }
          });
        }
      }
    });
  },

  /**
   * 语音测评相关
   */
  startRecord() {
    this.setData({
      isRecording: true,
      loadingText: '请读出单词，松开手测评发音...',
      recordDuration: 0
    });

    this.data.recordTimer = setInterval(() => {
      this.setData({
        recordDuration: this.data.recordDuration + 100
      });
    }, 100);

    const recorderManager = wx.getRecorderManager();
    
    recorderManager.onStop((res) => {
      const tempFilePath = res.tempFilePath;
      
      if (this.data.recordDuration >= 500) {
        this.uploadRecord(tempFilePath);
      } else {
        wx.showToast({ title: '录音时长过短，无效', icon: 'none' });
      }
    });

    recorderManager.start({
      duration: 60000,
      sampleRate: 44100,
      numberOfChannels: 1,
      encodeBitRate: 192000,
      format: 'mp3',
      frameSize: 50
    });
  },

  stopRecord() {
    if (this.data.isRecording) {
      this.setData({ 
        isRecording: false, 
        loadingText: '检测中...' 
      });
      clearInterval(this.data.recordTimer);
      
      const recorderManager = wx.getRecorderManager();
      recorderManager.stop();
    }
  },

  uploadRecord(tempFilePath) {
    this.setData({ loadingText: '录音分析中...' });
    const { wordItem } = this.data;
    
    const params = {
      token: app.globalData.token,
      word: wordItem.word
    };
    
    wx.uploadFile({
      url: app.globalData.serverHost + '/word/speakUpload',
      filePath: tempFilePath,
      name: 'recordFile',
      formData: params,
      success: (res) => {
        try {
          const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
          if (data.code === 0) {
            this.setData({
              loadingText: '',
              recordedFilePath: data.data.filePath
            });
            this.handleEvaluationResult(data.data.evaluation);
          } else {
            wx.showToast({ title: '测评失败', icon: 'none' });
          }
        } catch (e) {
          console.error('解析返回数据失败:', e);
          wx.showToast({ title: '录音上传异常', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('录音上传接口调用失败:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  playMyRecord() {
    const { recordedFilePath, audioContext } = this.data;
    if (!recordedFilePath) {
      wx.showToast({ title: '暂无录音可播放', icon: 'none' });
      return;
    }

    audioContext.stop();
    audioContext.src = recordedFilePath;
    audioContext.play();
  },

  handleEvaluationResult(data) {
    const recordResult = typeof data === 'string' ? JSON.parse(data) : data;
    const result = recordResult.result;
    
    this.setData({
      'evaluationResult.overallScore': result.overall || 0,
      'evaluationResult.starRating': this.generateStarRating(result.overall),
      showLoading: true,
      loadingText: ''
    });
    
    // 播放成绩音频
    this.playScoreAudio(result.overall);
    
    setTimeout(() => {
      this.nextStep();
    }, 3000);
  },

  generateStarRating(score) {
    const b = Math.floor(score / 20);
    const c = score - b * 20;
    const color = this.getScoreColor(score);
    
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= b) {
        stars.push({ type: 'full', color });
      } else if (i === b + 1 && c >= 10) {
        stars.push({ type: 'half', color });
      } else {
        stars.push({ type: 'empty' });
      }
    }
    
    return { stars, score, color };
  },

  getScoreColor(score) {
    if (score >= 85) return 'bg-green';
    if (score >= 75) return 'bg-blue';
    if (score >= 60) return 'bg-purple';
    if (score > 0) return 'bg-red';
    return '';
  },

  playScoreAudio(score) {
    let mp3 = 'fail';
    if (score >= 90) {
      mp3 = 'excellent';
    } else if (score >= 75) {
      mp3 = 'amazing';
    } else if (score >= 60) {
      mp3 = 'keep';
    }
    
    const audioContext = this.data.audioContext;
    audioContext.src = app.globalData.serverHost + '/mp3/' + mp3 + '.mp3';
    audioContext.play();
  },

  /**
   * 弹窗相关
   */
  openSpeakModal() {
    const { examples, exampleIndex } = this.data;
    if (!examples.length) return;
    
    const word = examples[exampleIndex].example;
    const audio = examples[exampleIndex].example_audio;
    
    this.setData({
      wordspeak_visible: true,
      wordspeak_word: word,
      wordspeak_audio: audio
    });
    
    this.checkRecordPermission();
  },

  onModalClose() {
    this.setData({ wordspeak_visible: false });
  },

  /**
   * 导航
   */
  goDetail() {
    const { unitId, wc_id, idlist } = this.data;
    let url = `/pages/wordlist/worddetail?unitId=${unitId}&wc_id=${wc_id}`;
    
    if (idlist.length) {
      const idstr = idlist.join(",");
      url += `&idlist=${idstr}`;
    }
    
    app.gotoPage(url);
  },

  goBack() {
    app.gotoBack();
  },

  goHome() {
    app.gotoHome();
  },

  onReady() {
    // 初始化标签宽度
    setTimeout(() => {
      const query = wx.createSelectorQuery();
      query.selectAll('.tab-item')
        .boundingClientRect((rects) => {
          if (rects.length) {
            const tabWidths = rects.map(rect => rect.width);
            this.setData({ itemWidth: tabWidths }, () => {
              this.scrollToCurrentWord();
            });
          }
        })
        .exec();
    }, 100);
  },

  onUnload() {
    if (this.data.audioContext) {
      this.data.audioContext.stop();
		}
		if (this.data.audioTemp) {
			clearTimeout(this.data.audioTemp);
		}
		if (this.data.recordTimer) {
			clearInterval(this.data.recordTimer);
		}
		this.setData({ isPlaying: false });
    this.setData({ isPlaying: false });
  }
});