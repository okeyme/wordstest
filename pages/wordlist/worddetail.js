const app = getApp();
import wordDataManager from '../../utils/wordDataManager';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 基本数据
    unitId: 0,
    wc_id: 0,
    vgId: 0,
    list: [],
    wordItem: {},
		wordDetail: {},
    idlist: [],
    
    // 音频相关
    isPlaying: false,
    letterIndex: -1,
    audioContext: null,
    audioTemp: null,
    
    // 标签导航
    tablist: [
      {id: 'example', name: '单词例句'},
      {id: 'chdp', name: '词汇搭配'},
      {id: 'tgc', name: '词根扩展'},
			{id: 'jfyc', name: '同近义词'},
			{id: 'psc', name: '派生词'}
    ],
    activeTab: 'example',
    scrollLeft: 0,
    itemWidth: [],
    
    // 内容区域位置信息
    sectionOffsets: {},
    
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
    
    // 弹窗
    wordspeak_visible: false,
    wordspeak_word: '',
    wordspeak_audio: '',
    
    // UI状态
    loading: false,
    changeClass: '',
    
    // 滚动相关
    scrollTop: 0,
    isScrolling: false,
    lastScrollTop: 0,
    
    // 单词详情分项数据（解决大数据问题）
    chdpData: [],
    cyyfTgc: '',
		cyyfJfyc: [],
		cffyAffix: []
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
      
      // 只存储必要的数据，避免大数据量
      const list = result.list || [];
      this.setData({
        list
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
    
    // 提取必要字段，避免大对象
    const safeWordItem = {
      word_id: wordItem.word_id,
      word: wordItem.word,
      ying: wordItem.ying,
      attribute: wordItem.attribute,
      translate: wordItem.translate,
      audio: wordItem.audio,
      category_id: wordItem.category_id,
      wc_id: wordItem.wc_id,
      phonogram_letters_ys: wordItem.phonogram_letters_ys,
      word_letters: wordItem.word_letters,
      syllable_phonogram: wordItem.syllable_phonogram,
      syllable_letters: wordItem.syllable_letters
    };
    
    const wordLetter = wordItem.word.split('');
    
    this.setData({
      wordItem: safeWordItem,
      wordLetter,
      changeClass: 'transition: opacity 0.3s ease, transform 0.3s ease;'
    }, () => {
      // 处理音标数据
      this.processPhonogramData(safeWordItem);
      
      // 加载例句
      this.loadWordExamples();
      
      // 加载单词详情
      this.loadWordDetail();
      
      // 加载收藏状态
      this.loadWordCollect();
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
        const pharr = phonogramArr[0] ? phonogramArr[0].split('-') : [];
        const phmaparr = phonogramArr[1] ? phonogramArr[1].split('-') : [];
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
        const examples = examplesResult.data[wc_id].examples || [];
        // 限制例句数量，避免数据过大
        const safeExamples = examples.slice(0, 10);
        this.setData({
          examples: safeExamples
        });
      }
    });
  },

  /**
   * 加载单词详情 - 分项加载，避免大数据
   */
  loadWordDetail() {
    const { vgId, wordItem } = this.data;
    
    wordDataManager.getWordDetail(vgId, wordItem.word_id, (detailResult) => {
      if (detailResult.data && !detailResult.error) {
        const wordDetail = detailResult.data;
        
        // 分项设置数据，避免一次设置过大对象
        if (wordDetail.chdp) {
          this.setData({
            chdpData: wordDetail.chdp.slice(0, 20) // 限制数量
          });
        }
        
        if (wordDetail.cyyf) {
					var jfyc = wordDetail.cyyf.jfyc;
					if(jfyc!=''){
						jfyc = JSON.parse(jfyc);
					}
          this.setData({
            cyyfTgc: wordDetail.cyyf.tgc || '',
						cyyfJfyc: jfyc || [],
						cffyAffix: wordDetail.cyyf.affix || [],
          },()=>{
						this.loadAffix();
					});
        }
        
        // 计算内容区域位置
        setTimeout(() => {
          this.calcSectionOffsets();
        }, 500);
      }
    });
	},
	
	loadAffix(){
		const {cffyAffix} = this.data;
		if(cffyAffix){
			var affix = JSON.parse(cffyAffix);
			const newStr = affix.map(item => {
				// 这里用正则替换所有<br>标签为换行符\n
				const meaning = item[1].replace(/<br>/g, '\n');
				return [item[0], meaning]; // 返回处理后的[单词, 处理后释义]
			});
	
			// 将处理后的数据赋值给affixList
			this.setData({
				cffyAffix: newStr
			});
		}
	},

  /**
   * 加载收藏状态
   */
  loadWordCollect() {
    const wordCollect = wx.getStorageSync('wordCollect') || [];
    this.setData({ wordCollect });
  },

  /**
   * 计算内容区域位置信息
   */
  calcSectionOffsets() {
    const query = wx.createSelectorQuery().in(this);
    const sectionOffsets = {};
    let processedCount = 0;
    const totalSections = this.data.tablist.length;
    
    this.data.tablist.forEach((tab) => {
      query.select(`#${tab.id}`).boundingClientRect((rect) => {
        processedCount++;
        
        if (rect) {
          sectionOffsets[tab.id] = rect.top;
        }
        
        // 所有区域都处理完后设置数据
        if (processedCount === totalSections) {
          this.setData({ 
            sectionOffsets: sectionOffsets 
          }, () => {
            console.log('sectionOffsets calculated:', sectionOffsets);
          });
        }
      }).exec();
    });
  },

  /**
   * 切换标签导航
   */
  switchTab(e) {
    if (this.data.isScrolling) return;
    
    const index = e.currentTarget.dataset.index;
    const id = e.currentTarget.dataset.id;
    
    this.setData({ 
      activeTab: id,
      isScrolling: true
    }, () => {
      // 滚动到对应内容区域
      this.scrollToSection(id);
      // 计算标签导航滚动位置
      this.scrollToCurrentTab(index);
    });
  },

  /**
   * 滚动到指定内容区域
   */
  scrollToSection(id) {
    const query = wx.createSelectorQuery().in(this);
    
    query.select(`#${id}`).boundingClientRect((rect) => {
      if (rect) {
        // 使用小程序的滚动API
        wx.pageScrollTo({
          selector: `#${id}`,
          duration: 300,
          success: () => {
            setTimeout(() => {
              this.setData({ 
                isScrolling: false
              });
            }, 350);
          },
          fail: () => {
            this.setData({ isScrolling: false });
          }
        });
      } else {
        this.setData({ isScrolling: false });
      }
    }).exec();
  },

  /**
   * 滚动到当前标签位置
   */
  scrollToCurrentTab(index) {
    if (!this.data.itemWidth.length) {
      setTimeout(() => {
        this.scrollToCurrentTab(index);
      }, 100);
      return;
    }
    
    let leftTotalWidth = 0;
    for (let i = 0; i < index; i++) {
      leftTotalWidth += this.data.itemWidth[i] || 0;
    }
    
    const windowInfo = wx.getWindowInfo();
    const windowWidth = windowInfo.windowWidth;
    const currentTabWidth = this.data.itemWidth[index] || 0;
    
    const scrollLeft = leftTotalWidth - (windowWidth / 2 - currentTabWidth / 2);
    this.setData({ scrollLeft });
  },

  /**
   * 监听内容滚动，更新标签状态 - 简化版本
   */
  onContentScroll(e) {
    if (this.data.isScrolling) return;
    
    const scrollTop = e.detail.scrollTop;
    const { sectionOffsets, tablist } = this.data;
    
    // 如果没有位置数据，直接返回
    if (!sectionOffsets || Object.keys(sectionOffsets).length === 0) return;
    
    // 防止微小滚动导致的频繁更新
    if (Math.abs(scrollTop - this.data.lastScrollTop) < 30) return;
    
    // 找到当前滚动到的区域
    let currentTab = tablist[0].id;
    
    for (let i = tablist.length - 1; i >= 0; i--) {
      const tab = tablist[i];
      const offset = sectionOffsets[tab.id];
      if (offset !== undefined && scrollTop >= offset - 100) {
        currentTab = tab.id;
        break;
      }
    }
    
    // 更新选中状态
    if (currentTab !== this.data.activeTab) {
      this.setData({ 
        activeTab: currentTab,
        lastScrollTop: scrollTop
      });
    }
  },

  /**
   * 音频播放相关方法
   */
  
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
      isPlayingQueue: false,
      letterIndex: -1
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
    audioContext.src = src;
    audioContext.play();
    
    // 重新注册事件监听
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
   * 播放单词音频
   */
  playWordAudio() {
    const { wordItem } = this.data;
    if (!wordItem.audio) return;
    
    this.setData({ letterIndex: -1 });
    this.audioPlay(wordItem.audio);
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
    
    const { audioContext, wordItem } = this.data;
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
          if (type === 'syllable') {
            this.audioPlay(`https://w.360e.cn/uploads/youdaowordmp3/${wordItem.word}.mp3`);
          } else {
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
      this.setData({ letterIndex: -2 });
      this.audioPlay(examples[index].example_audio);
    }
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
   * 录音弹窗相关
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
	 // 单词弹窗事件
	 onWordClick: function(e) {
    const word = e.currentTarget.dataset.word;
    this.setData({
      selectedWord: word,
      showWordSearch: true
    });
    
    // 如果需要，可以在这里获取组件实例并调用方法
    // const wordSearch = this.selectComponent('#wordSearch');
    // wordSearch.searchWordDetail(word);
  },

  // 关闭单词弹窗
  onCloseWordSearch: function() {
    this.setData({
      showWordSearch: false,
      selectedWord: ''
    });
  },
  /**
   * 导航
   */
  goWordLearn() {
    const { unitId, wc_id, idlist } = this.data;
    let url = `/pages/wordlist/wordlearn?unitId=${unitId}&wc_id=${wc_id}`;
    
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
            this.setData({ itemWidth: tabWidths });
          }
        })
        .exec();
    }, 100);
  },

  onUnload() {
    this.stopAllAudio();
    
    if (this.data.audioTemp) {
      clearTimeout(this.data.audioTemp);
    }
  }
});