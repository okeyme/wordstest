const app = getApp();
import wordDataManager from '../../utils/wordDataManager';

Page({
  data: {
		vgId:0,
		model:'translateSpell',
		loading: false,
		audioContext:null,
		unitId:0,
		unitList:[],
		list: [],
		shufflist:[],
		displayWord: "", // 用于展示逐字出现效果的单词
    letterIndex: 0, // 当前要显示的字母索引
    cycleCount: 0, // 记录循环次数
    timer: null, // 定时器标识，用于清除定时器
		currentIndex:0,
    correctCount: 0,     // 正确配对数
    errorCount: 0,       // 错误次数
		startTime: 0, // 答题开始时间
		elapsedTime: 0, // 已用时间（秒）
		formattedTime: "0分00秒", // 初始化格式化时间
		showResult: false,   // 是否显示结果弹窗
		errorList: []
  },

  onLoad(options) {
		var unitId = options.unitId;
		this.setData({
			vgId: app.globalData.userVersion.vg_id,
			unitId: unitId,
			audioContext : wx.createInnerAudioContext(),
			startTime: Date.now() // 记录开始答题时间
		}, () => {
      this.initTraining(this.data.unitId);
		});
		// 监听音频播放结束事件
    this.data.audioContext.onEnded(() => {
			console.log('当前单词播放结束');
			this.setData({ isPlaying: false });
      // 如果需要在每个单词播放结束后立即切换到下一个，可以在这里调用
    });
    
    // 监听错误
    this.data.audioContext.onError((err) => {
      console.error('音频播放错误:', err);
      wx.showToast({
        title: '播放失败，请重试',
        icon: 'none'
      });
		});
	},
	// 初始化单词数据
  async initTraining(unitId) {
		let unitIdArray = unitId.split(",").map(Number); 
    this.setData({ 
      isLoading: true 
		});
    try {
      // 1. 直接获取所有选中单元的单词
      const allWords = await wordDataManager.getTrainingWordList(
        this.data.vgId, 
        unitIdArray, 
        { 
          wordCount: 0, // 0表示不限制数量，获取所有单词
          shuffle: false // 先不打乱，保持单元顺序
        }
			);
      
      if (allWords.length === 0) {
        wx.showToast({ title: '没有找到单词', icon: 'none' });
        return;
      }
      this.setData({ 
				list: allWords,
        isLoading: false 
      });

			// 2. 开始训练会话
			console.log('=======start =====');
      this.intList();
    } catch (error) {
      console.error('训练初始化失败:', error);
      this.setData({ isLoading: false });
    }
	},
	// 暂停播放
	pausePlay() {
		if (!this.data.isPlaying) return;
		this.setData({ isPlaying: false });
		this.data.audioContext.pause();
	},
	// 播放当前单词
	playCurrentWord() {
		const { shufflist,currentIndex } = this.data;
		const currentWord = shufflist[currentIndex];
		if (!currentWord) return;
		const audioContext = this.data.audioContext;
		audioContext.src = currentWord.audio; // 设置音频源
		audioContext.play(); // 播放
		this.setData({ isPlaying: true, playIndex:currentIndex});
	},
	/***==========拼写=============== */
	// 处理键盘按键
  onKeyClick(e) {
    const key = e.detail.key;
    this.setData({
      displayWord: this.data.displayWord + key
    });
  },
  // 退格键
	onBackspace() {
    const currentValue = this.data.displayWord;
    if (currentValue.length > 0) {
      this.setData({
        displayWord: currentValue.slice(0, -1)  // 删除最后一个字符
      });
    }
  },
  // 空格键
  onSpace() {
    this.setData({
      displayWord: this.data.displayWord + ' '
    });
	},
  // 拼写完成-处理完成键
	onComplete() {
		var that = this;
		const{startTime,currentIndex,displayWord,shufflist,list} = this.data;
		var originWord = shufflist[currentIndex].word;
		var errorList = this.data.errorList;
		const gonext = () => {
			setTimeout(() => {
				const now = Date.now();
				const elapsedSeconds = Math.floor((now - startTime) / 1000);
				this.data.elapsedTime = elapsedSeconds;
				const formattedTime = this.formattedTime();
				if(currentIndex>=shufflist.length-1){
					this.setData({showResult:true,errorList:errorList,errorCount:this.data.errorCount, formattedTime: formattedTime});
					this.addWordExercise();
					if(errorList.length>0) setTimeout(function(){ app.showToast('错词已加入错词本');},1000);
				}else{
					this.setData({currentIndex:currentIndex+1,errorList:errorList, errorCount:this.data.errorCount, formattedTime: formattedTime, displayWord:''},()=>{
						that.playCurrentWord();
					});
				}
			}, 1500);
    };
		if(displayWord == originWord){
			this.playAudio('correct');
			wx.showToast({
				title: '拼写正确',
				icon: "success",
				duration: 2000,
				mask: true,
				complete: function () {
					gonext();
				}
			})
		}else{
			errorList.push(currentIndex);
			this.data.errorCount++;
			wx.showToast({
				title: '拼写错误',
				icon: "error",
				duration: 2000,
				mask: true,
				complete: function () {
					gonext();
				}
			})
		}
	},
	tryAgain(){
		this.setData({showResult:false, formattedTime: "0分00秒",startTime: Date.now(),currentIndex:0,errorCount:0,displayWord:''});
		this.intList();
	},
	formattedTime() {
    const minutes = Math.floor(this.data.elapsedTime / 60);
		const seconds = this.data.elapsedTime % 60;
		console.log(`${minutes}分${seconds < 10 ? "0" : ""}${seconds}秒`);
    return `${minutes}分${seconds < 10 ? "0" : ""}${seconds}秒`;
  },
	intList: function(){
		const { list,unitId} = this.data;
		const shuffled = [...list]
    .map(item => ({ ...item })) // 复制每个对象（浅拷贝对象，足够应对普通属性）
    .sort(() => Math.random() - 0.5); // 洗牌
		var shufflist = [];
		if (shuffled.length <= 10) shufflist = [...shuffled]; // 长度不足时返回全部
		else shufflist = shuffled.slice(0, 10); // 取前10个
		this.setData({shufflist:shufflist},()=>{
			this.playCurrentWord();
		});
	},
	//添加错误单词
	addWordExercise:function(){
		const { errorList,shufflist,formattedTime} = this.data;
		var wordExecList = [], catearr = [];
		shufflist.forEach((item,index)=>{
			let flag = 1;
			var wc_id = item.wc_id;
			let category_id = item.category_id;
			if(catearr.indexOf(category_id)==-1) catearr.push(category_id);
			let word_id = item.word_id;
			if(errorList.indexOf(index)>=0){
				flag = 0;
			}
			wordExecList.push({category_id:category_id,wc_id:wc_id,word_id:word_id,status:flag});
		})
	},
	// 播放当前单词
	playAudio:function(src) {
		const audioContext = this.data.audioContext;
		audioContext.src = app.globalData.serverHost+'/mp3/'+src+'.mp3'; // 设置音频源
		audioContext.play(); // 播放
	},
	// 页面卸载时清理资源
	onUnload() {
		this.data.audioContext.pause();
		this.data.audioContext.destroy();
		clearInterval(this.data.timer);
	}

});