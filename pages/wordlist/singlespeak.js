const app = getApp();
const colorArray = ['', 'bg-red', 'bg-purple', 'bg-blue', 'bg-green'];
import wordDataManager from '../../utils/wordDataManager';
Page({
  data: {
		model:'wordSpeak',
		vgId:0,
		loading: false,
		audioContext:null,
		isPlaying: false,// 是否正在播放
		playIndex:-1, // 正在播放的单词
		fadeClass:'',
		unitList:[],
		list: [],
		idlist:[],
		optionList: [],       // 打乱后的单词+释义列表
		abcList:['A','B','C','D'],
		currentIndex:0,
    correctCount: 0,     // 正确配对数
		errorCount: 0,       // 错误次数
		startTime: 0, // 答题开始时间
		elapsedTime: 0, // 已用时间（秒）
		formattedTime: "0分00秒", // 初始化格式化时间
    showResult: false,    // 是否显示结果弹窗
		
		hasRecordPermission: false, // 记录录音权限状态
		isRecording: false,       // 是否正在录音
		RecordStep:0,
    recordTimer: null,        // 录音计时器
    recordDuration: 0,        // 录音时长(ms)
    recordedFilePath: '',     // 录音文件路径
		innerAudioContext: null,   // 音频播放上下文
    //结果数据
    // 加载状态
    showLoading: false,
    loadingText: '',
    
    // 评测结果数据结构
    evaluationResult: {
      overallScore: 0,      // 总分
      audioUrl: '',         // 音频地址
      scorePanels: [],      // 所有评分面板
      starRating: {         // 星级评分
        stars: [],
        score: 0,
        color: ''
      },
      syllableDetails: [],  // 音节详情
      phoneDetails: [],     // 音素详情
      stressDetails: []     // 重音详情
    },
    
    // 音标字典
    phoneticSymbols: {
			"ih": "ɪ", "ax": "ə", "oo": "ɔ", "uh": "ʊ", "ah": "ʌ", 
			"eh": "e", "ae": "æ", "iy": "iː", "er": "ɜː", "axr": "",
			"ao": "ɔː", "uw": "uː", "aa": "ɑː", "ey": "eɪ", "ay": "aɪ",
			"oy": "ɔɪ", "aw": "aʊ", "ow": "əʊ", "ir": "ɪə", "ar": "eə",
			"ur": "ʊə", "p": "p", "b": "b", "t": "t", "d": "d", "g": "g",
			"k": "k", "f": "f", "v": "v", "th": "θ", "dh": "ð", "s": "s",
			"z": "z", "sh": "ʃ", "zh": "ʒ", "ch": "tʃ", "jh": "dʒ", "hh": "h",
			"m": "m", "n": "n", "ng": "ŋ", "l": "l", "r": "r", "y": "j",
			"w": "w", "ts": "ts", "tr": "tr"
		},
    
    // 颜色等级
    colorLevels: ['', 'bg-red', 'bg-purple', 'bg-blue', 'bg-green'],
    
    // 当前单词信息
    currentWord: {
      text: '',
      phonogram: ''
    },
    
    // 音频控制
		audioContext: null,
		resList:[] //结果记录
  },

  onLoad(options) {
		var unitIndex = options.unitIndex;
	
		this.setData({
      innerAudioContext: wx.createInnerAudioContext(),
			vgId: app.globalData.userVersion.vg_id,
			unitIndex: unitIndex,
			audioContext : wx.createInnerAudioContext(),
			startTime: Date.now() // 记录开始答题时间
		},()=>{
			this.loadWordData();
		})
    // 监听音频播放结束事件
    this.data.audioContext.onEnded(() => {
			console.log('当前单词播放结束');
			this.setData({ isPlaying: false });
      // 如果需要在每个单词播放结束后立即切换到下一个，可以在这里调用
    });
    // 监听音频播放错误
    this.data.audioContext.onError((res) => {
      console.error('播放错误:', res.errMsg);
      wx.showToast({
        title: '播放失败',
        icon: 'none'
      });
    });
  },
  


/****===================================测评===============================** */
	// 长按触发录音（入口）
	/*onLongPressRecord() {
		// 先检查录音权限
		if(this.data.hasRecordPermission){
			this.startRecord();
		}else{
			this.checkRecordPermission().then(hasPermission => {
				if (hasPermission) {
					// 有权限，开始录音
					this.startRecord();
				} else {
					// 无权限，提示用户并重置状态
					app.showToast('请授予录音权限');
					this.setData({ isRecording: false });
				}
			});
		}
	},
// 检查录音权限
	checkRecordPermission() {
		return new Promise((resolve) => {
			wx.getSetting({
				success: (res) => {
					// 已授权
					if (res.authSetting['scope.record']) {
						this.setData({ hasRecordPermission: true });
						resolve(true);
					} else {
						// 未授权，请求权限
						wx.authorize({
							scope: 'scope.record',
							success: () => {
								this.setData({ hasRecordPermission: true });
								resolve(true);
							},
							fail: () => {
								// 用户拒绝授权
								this.setData({ hasRecordPermission: false });
								resolve(false);
							}
						});
					}
				}
			});
		});
	},*/
  // 长按录音开始
  // 开始录音（长按触发）
  startRecord() {
		//if(this.data.isRecording || this.data.RecordStep>0) return;
    this.setData({
			isRecording: true,
			RecordStep:1,
			loadingText:'请读出单词，松开手测评发音...',
      recordDuration: 0
    });

    // 启动计时器计算录音时长
    this.data.recordTimer = setInterval(() => {
      this.setData({
        recordDuration: this.data.recordDuration + 100
      });
    }, 100);

    // 获取录音管理器实例
    const recorderManager = wx.getRecorderManager();
    
    // 监听录音结束事件
    recorderManager.onStop((res) => {
			this.setData({ isRecording: false,loadingText:'',RecordStep:2});
      const tempFilePath = res.tempFilePath;
      
      // 验证录音时长（≥500ms）
      if (this.data.recordDuration >= 500) {
        this.uploadRecord(tempFilePath);
      } else {
        app.showToast('录音太短，无效!');
				this.setData({ isRecording: false,loadingText:'',RecordStep:0});
      }
    });

    // 开始录音（配置参数）
    recorderManager.start({
      duration: 30000,         // 最长录音时间（60秒）
      sampleRate: 44100,       // 采样率（建议与评测API一致，H5中为16000）
      numberOfChannels: 1,     // 单声道
      encodeBitRate: 192000,   // 编码比特率
      format: 'mp3',           // 关键：改为 ogg 格式
      frameSize: 50            // 帧大小
    });
	},
	
  // 停止录音（松手触发）
  stopRecord() {
    if (this.data.isRecording) {
			//this.setData({ isRecording: false,loadingText:'检测中...',RecordStep:2});
			this.setData({ isRecording: false,loadingText:'',RecordStep:2});
      clearInterval(this.data.recordTimer);
      
      // 停止录音
      const recorderManager = wx.getRecorderManager();
      recorderManager.stop();
    }
  },

  // 上传录音到服务器
  uploadRecord(tempFilePath) {
		this.setData({ loadingText:'录音分析中...',RecordStep:3});
    const {list,idlist,currentIndex} = this.data;
    const params = {
      token: app.globalData.token, // 关键：传递 token
      word: list[idlist[currentIndex]].word
    };
    wx.uploadFile({
      url: app.globalData.serverHost+'/word/speakUpload',  // 替换为实际接口
      filePath: tempFilePath,
      name: 'recordFile',  
      formData: params,   // 传递额外参数（PHP端通过$_POST接收）                                   // 与后端接收字段一致
      success: (res) => {
        try {
          const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
          if (data.code === 0) {
            //console.log('===upload data-evaluation==',data.data.evaluation);
            //wx.showToast({ title: '上传成功', icon: 'success' });
            this.setData({loadingText:'',RecordStep:0, recordedFilePath: data.data.filePath });  // 保存服务器返回的路径
            this.handleEvaluationResult(data.data.evaluation);
          } else {
						app.showToast('测评失败，请重试。');
						this.setData({ isRecording: false,loadingText:'',RecordStep:0});
          }
        } catch (e) {
          console.error('解析返回数据失败:', e);
					app.showToast('录音上传异常。');
					this.setData({ isRecording: false,loadingText:'',RecordStep:0});
        }
      },
      fail: (err) => {
        console.error('录音上传接口调用失败:', err);
        app.showToast('网络错误');
      }
    });
  },

  // 播放录音
  playMyRecord() {
    const { recordedFilePath, audioContext } = this.data;
    if (!recordedFilePath) {
      app.showToast('暂无录音可播放');
      return;
    }

    // 停止当前播放（如果有）
    audioContext.stop();
    
    // 设置音频源并播放
    audioContext.src = recordedFilePath;
    audioContext.play();
    
    // 监听播放开始
    audioContext.onPlay(() => {
      console.log('开始播放录音');
    });
  },
/****===================================测评===============================** */
/****===================================处理结果===============================** */

/**
 * 处理评测结果
 */
  handleEvaluationResult(data) {
		this.showLoadingStatus();
    // 解析数据
    const recordResult = typeof data === 'string' ? JSON.parse(data) : data;
    const result = recordResult.result;
    const details = result.details || [];
    
    // 准备存储各面板数据
    const panels = [];
    let syllableData = [];
    let phoneData = [];
    let stressData = [];
    let missingData = null;
    
    // 处理每个评分项
    details.forEach(item => {
      // 漏读/重复读
      if (item.dp_type !== undefined) {
        missingData = {
          type: item.dp_type === 1 ? '漏读' : '重复读',
          hasIssue: true
        };
      }
      
      // 音节评分
      if (item.syllable) {
        syllableData = this.processSyllableData(item.syllable);
      }
      
      // 音素评分
      if (item.phone) {
        phoneData = this.processPhoneData(item.phone);
      }
      
      // 重音评分
      if (item.stress) {
        stressData = this.processStressData(item.stress);
      }
    });
    
    // 构建面板数据
    if (missingData) {
      panels.push({
        type: 'missing',
        title: missingData.type,
        content: `有${missingData.type}`
      });
    }
    
    if (syllableData.length) {
      panels.push({
        type: 'syllable',
        title: '音节',
        content: syllableData
      });
    }
    
    if (phoneData.length) {
      panels.push({
        type: 'phone',
        title: '音素',
        content: phoneData
      });
    }
    
    if (stressData.length) {
      panels.push({
        type: 'stress',
        title: '重音',
        content: stressData
      });
    }
    
    // 更新数据
    this.setData({
      'evaluationResult.overallScore': result.overall || 0,
      'evaluationResult.audioUrl': recordResult.audioUrl || '',
      'evaluationResult.scorePanels': panels,
      'evaluationResult.starRating': this.generateStarRating(result.overall),
      'evaluationResult.syllableDetails': syllableData,
      'evaluationResult.phoneDetails': phoneData,
      'evaluationResult.stressDetails': stressData,
			showLoading: true,
			loadingText: ''
		});
		//console.log('====音素phoneData===',phoneData);
		//结果记录
		const {currentIndex,idlist} = this.data;
		var resList = this.data.resList;
		if (resList[currentIndex] === undefined || resList[currentIndex] === null) {
			var resarr = {score:result.overall,audioUrl:recordResult.audioUrl}
			resList.push(resarr);
			this.setData({resList:resList});
			//合格判断
			if(result.overall<60){
				this.setData({errorCount:this.data.errorCount+1});
			}
		}
		this.playAudio(result.overall);
    
    // 处理音素打分
    if (phoneData.length) {
      this.processPhonogramScore(phoneData);
    }
  },

  /**
   * 处理音节数据
   */
  processSyllableData(syllables) {
    return syllables.map(syllable => {
      let chars = syllable.char;
      if (chars.includes('_')) {
        chars = chars.split('_').map(c => this.data.phoneticSymbols[c] || c).join('');
      } else {
        chars = this.data.phoneticSymbols[chars] || chars;
      }
    
    return {
      char: chars,
      score: syllable.score,
      color: this.getScoreColor(syllable.score)
    };
  });
},

/**
 * 处理音素数据
 */
processPhoneData(phones) {
  return phones.map(phone => {
    const char = this.data.phoneticSymbols[phone.char] || phone.char;
    const scoreLevel = this.getScoreLevel(phone.score);
    
    return {
      char: char,
      originalChar: phone.char,
      score: phone.score,
      color: this.getScoreColor(phone.score),
      showTip: scoreLevel <= 2 // 低分显示提示
    };
  });
},

/**
 * 处理重音数据
 */
processStressData(stresses) {
  return stresses.map(stress => {
    let chars = stress.char;
    if (chars.includes('_')) {
      chars = chars.split('_').map(c => this.data.phoneticSymbols[c] || c).join('');
    } else {
      chars = this.data.phoneticSymbols[chars] || chars;
    }
    
    return {
      char: chars,
      hasStress: stress.ref !== 0,
      isCorrect: stress.score !== 0
    };
  });
},

/**
 * 生成星级评分数据
 */
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
  
  return {
    stars,
    score,
    color
  };
},

/**
 * 处理音素打分显示
 */
processPhonogramScore(phoneData) {
  const { phonogram } = this.data.currentWord;
  if (!phonogram || !phonogram.includes('#')) return;
  
  const [letters, displays] = phonogram.split('#');
  const letterArr = letters.split(',');
  const displayArr = displays.split(',');
  
  let wordHtml = '';
  
  phoneData.forEach((phone, index) => {
    const displayChar = displayArr[index];
    wordHtml += `<span class="${phone.color} rich-char">${displayChar}<span class="rich-score-tip">${phone.score}</span></span>`;
  });
	if(wordHtml!=''){
		this.setData({
			'currentWord.displayText': wordHtml
		});
	}
},

/**
 * 获取分数对应的颜色
 */
getScoreColor(score) {
  const level = this.getScoreLevel(score);
  return this.data.colorLevels[level];
},

/**
 * 获取分数等级
 */
getScoreLevel(score) {
  if (score >= 85) return 4;
  if (score >= 75) return 3;
  if (score >= 60) return 2;
  if (score > 0) return 1;
  return 0;
},

/**
 * 显示加载状态
 */
showLoadingStatus(type) {
  this.setData({
    showLoading: false,
    loadingText: '测评中...'
  });
},

/****===================================处理结果===============================** */







	loadWordData() {
    wordDataManager.getWordData(this.data.vgId, (result) => {
      if (!result) return;
      this.setData({
        unitList: result.unitList || this.data.unitList,
        list: result.list || this.data.list,
        localVersion: result.version || this.data.localVersion
      }, () => {
				this.intList();
        if (result.fromRemote) {
          console.log('已更新最新数据');
        } else if (result.fromCache) {
          console.log('使用本地缓存数据');
        }
			});
			console.log('====list data===',this.data.list);
    });
 },
	// 暂停播放
	pausePlay() {
		if (!this.data.isPlaying) return;
		this.setData({ isPlaying: false });
		this.data.audioContext.pause();
	},
	// 播放当前单词
	playCurrentWord(e) {
		const { index,wc_id }  = e.currentTarget.dataset;
		const { currentIndex,list,idlist } = this.data;
		const thisWordItem = list[wc_id];
		if (!thisWordItem) return;
		const audioContext = this.data.audioContext;
		audioContext.src = thisWordItem.audio; // 设置音频源
		audioContext.play(); // 播放
		this.setData({ isPlaying: true,playIndex:index});
	},
	tryAgain(){
		this.setData({showResult:false, formattedTime: "0分00秒",startTime: Date.now(),errorCount:0,currentIndex:0,resList:[],RecordStep:0,evaluationResult: {
      overallScore: 0,      // 总分
      audioUrl: '',         // 音频地址
      scorePanels: [],      // 所有评分面板
      starRating: {         // 星级评分
        stars: [],
        score: 0,
        color: ''
      },
      syllableDetails: [],  // 音节详情
      phoneDetails: [],     // 音素详情
      stressDetails: []     // 重音详情
    }});
		this.intList();
	},
	formattedTime() {
    const minutes = Math.floor(this.data.elapsedTime / 60);
		const seconds = this.data.elapsedTime % 60;
		console.log(`${minutes}分${seconds < 10 ? "0" : ""}${seconds}秒`);
    return `${minutes}分${seconds < 10 ? "0" : ""}${seconds}秒`;
  },
  nextword:function(e){

		const {recordedFilePath,idlist,currentIndex,list} = this.data;
    if (!recordedFilePath) {
      wx.showToast({ title: '你还未录音', icon: 'none' });
      return;
    }

		const now = Date.now();
		const elapsedSeconds = Math.floor((now - this.data.startTime) / 1000);
		this.data.elapsedTime = elapsedSeconds;
		const formattedTime = this.formattedTime();
		if(this.data.currentIndex>=idlist.length-1){
			this.setData({errorCount:this.data.errorCount, formattedTime: formattedTime});
		}else{	
			var next_currentIndex = currentIndex+1;
			var currentWord= {
				text: list[idlist[next_currentIndex]].word,
				phonogram: list[idlist[next_currentIndex]].phonogram_letter
			}		
			this.setData({showLoading:false,isRecording:false,RecordStep:0, currentWord:currentWord, currentIndex:next_currentIndex,errorCount:this.data.errorCount, formattedTime: formattedTime, fadeClass:'fadein-left'});
		}
	},
	showResult: function(){
		this.addWordExercise();
		if(this.data.errorCount>0) setTimeout(function(){ app.showToast('不合格单词已加入错词本');},1000);
		this.setData({showResult:true,showLoading:false});
	},
	intList: function(){
		const { unitList,list,unitIndex,currentIndex } = this.data;
		var arr = unitIndex.split(","), idarr = [];
		arr.forEach(item=>{
			let idlist = unitList[item].list;
			idarr.push(idlist);
		})
		let wordList = [].concat(...idarr);
		if (!wordList || wordList.length === 0) return [];
		const shuffled = [...wordList].sort(() => Math.random() - 0.5); // 洗牌
		var idlist = [];
		if (shuffled.length <= 10) idlist = [...shuffled]; // 长度不足时返回全部
		else idlist = shuffled.slice(0, 10); // 取前10个
		var currentWord= {
      text: list[idlist[currentIndex]].word,
      phonogram: list[idlist[currentIndex]].phonogram_letter
		}
		console.log('====currentWord===',currentWord);
		this.setData({idlist:idlist, currentWord:currentWord});
	},
	//添加错误单词
	addWordExercise:function(){
		const { idlist,list,formattedTime} = this.data;
		console.log('===idlist==',idlist);
		var wordExecList = [], catearr = [];
		idlist.forEach((item,index)=>{
			let flag = 0;
			var wc_id = item;
			let category_id = list[wc_id].category_id;
			if(catearr.indexOf(category_id)==-1) catearr.push(category_id);
			let word_id = list[wc_id].word_id;
			wordExecList.push({category_id:category_id,wc_id:wc_id,word_id:word_id,status:flag});
		})
		var category_str = catearr.join(",");
		var wordExecListstr = JSON.stringify(wordExecList);
		var data = {vgId: app.globalData.userVersion.vg_id,category_id:category_str, model:this.data.model,wordexeclist:wordExecListstr,exec_time:formattedTime};
		app.requestData('/word/addWordExercise','POST', data, (res) => {
			if (res) {
				//var recordlist = res.data.recordlist;
				console.log('recordlist=',res);
			}
			// 无更新时保持本地数据
		},
		(err) => {
				console.error('请求失败', err);
			}
		);
	},
	playResAudio:function(e) {
		const {index} = e.currentTarget.dataset;
		const {resList} = this.data;
		const audioContext = this.data.audioContext;
		audioContext.src = resList[index].audioUrl; // 设置音频源
		audioContext.play(); // 播放
		this.setData({playIndex:index,isPlaying:true})
	},
	// 播放等级音频
	playAudio:function(score) {
		var mp3 = 'fail';
		if(score>=90){
			mp3 = 'excellent';
		}else if(score>=75){
			mp3 = 'amazing';
		}else if(score>=60){
			mp3 = 'keep';
		}
		const audioContext = this.data.audioContext;
		audioContext.src = app.globalData.serverHost+'/mp3/'+mp3+'.mp3'; // 设置音频源
		audioContext.play(); // 播放
	},
	// 页面卸载时清理资源
	onUnload() {
		this.pausePlay();
    this.data.audioContext.destroy();
	}

});