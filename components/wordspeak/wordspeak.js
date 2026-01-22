Component({
  // 接收从A页面传递的参数
  properties: {
    // 定义需要接收的参数（例如id和name）
    speakWord: {
      type: String,
      value: ''
    },
    speakAudio: {
      type: String,
      value: ''
    },
    // 控制组件显示/隐藏
    visible: {
      type: Boolean,
      value: false,
      observer: function(newVal) {
        // 监听显示状态变化
        console.log('弹窗显示状态：', newVal);
      }
    }
  },
  data: {
		app: null, // 缓存app实例
		/**====语音测评====** */
		isRecording: false,       // 是否正在录音
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
		audioContext: null

	},
	lifetimes: {
		attached() {
			const app = getApp();
			this.setData({app});
			// 2. 初始化音频上下文（原increment方法的逻辑应移到这里，避免重复创建）
      const audioContext = wx.createInnerAudioContext();
      // 监听音频播放错误（便于调试）
      audioContext.onError((err) => {
        console.error('音频播放错误：', err);
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
		// 长按录音开始
		// 开始录音（长按触发）
		startRecord() {
				wx.getSetting({
					success(res) {
							const authStatus = res.authSetting['scope.record'];
							if (authStatus === undefined) {
									// 用户未授权，可弹出授权提示框
									wx.authorize({
											scope: 'scope.record',
											success() {
											},
											fail() {
												app.showToast('你拒绝了录音权限');return false;
											}
									});
							}
					}
			});
			const {app} = this.data;
			console.log('===this.data.app.globalData.serverHost=',this.data.app.globalData.serverHost);
			this.setData({
				isRecording: true,
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
				const tempFilePath = res.tempFilePath;
				
				// 验证录音时长（≥500ms）
				if (this.data.recordDuration >= 500) {
					console.log('===tempFilePath==',tempFilePath);
					this.uploadRecord(tempFilePath);
				} else {
					wx.showToast({
						title: '录音时长过短，无效',
						icon: 'none'
					});
				}
			});

			// 开始录音（配置参数）
			recorderManager.start({
				duration: 60000,         // 最长录音时间（60秒）
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
				this.setData({ isRecording: false,loadingText:'检测中...' });
				clearInterval(this.data.recordTimer);
				
				// 停止录音
				const recorderManager = wx.getRecorderManager();
				recorderManager.stop();
			}
		},

		// 上传录音到服务器
		uploadRecord(tempFilePath) {
			this.setData({ loadingText:'录音分析中...' });
			const {list,idlist,currentIndex,wordItem} = this.data;
			const params = {
				token: this.data.app.globalData.token, // 关键：传递 token
				word: this.data.speakWord
			};
			wx.uploadFile({
				url: this.data.app.globalData.serverHost+'/word/speakUpload',  // 替换为实际接口
				filePath: tempFilePath,
				name: 'recordFile',  
				formData: params,   // 传递额外参数（PHP端通过$_POST接收）                                   // 与后端接收字段一致
				success: (res) => {
					try {
						const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
						if (data.code === 0) {
							//console.log('===upload data-evaluation==',data.data.evaluation);
							//wx.showToast({ title: '上传成功', icon: 'success' });
							this.setData({loadingText:'', recordedFilePath: data.data.filePath });  // 保存服务器返回的路径
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

		// 播放录音
		playMyRecord() {
			const { recordedFilePath, audioContext } = this.data;
			if (!recordedFilePath) {
				wx.showToast({ title: '暂无录音可播放', icon: 'none' });
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
			//播放成绩音频
			this.playAudio(result.overall);
		
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
	// 播放等级音频
	playAudio:function(score) {
		const { app, audioContext } = this.data;
		var mp3 = 'fail';
		if(score>=90){
			mp3 = 'excellent';
		}else if(score>=75){
			mp3 = 'amazing';
		}else if(score>=60){
			mp3 = 'keep';
		}
		audioContext.src = app.globalData.serverHost+'/mp3/'+mp3+'.mp3'; // 设置音频源
		audioContext.play(); // 播放
	},
	// 播放等级音频
	playAudio2:function() {
		const { app, audioContext,speakAudio } = this.data;
		audioContext.src = speakAudio; // 设置音频源
		audioContext.play(); // 播放
	},

    // 关闭弹窗（通知A页面更新状态）
    closeModal() {
      this.triggerEvent('close'); // 触发自定义事件
    }
  }
})