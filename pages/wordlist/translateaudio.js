const app = getApp();
import wordDataManager from '../../utils/wordDataManager';
Page({
  data: {
		model:'translateAudio',
		vgId:0,
		loading: false,
		audioContext:null,
		isPlaying: false,// 是否正在播放
		playIndex:-1, // 正在播放的单词
		fadeClass:'',
		unitId:0,
		unitList:[],
		list: [],
		shufflist:[],
		idlist:[],
		optionList: [],       // 打乱后的单词+释义列表
		abcList:['A','B','C','D'],
		currentIndex:0,
    correctCount: 0,     // 正确配对数
    errorCount: 0,       // 错误次数
		startTime: 0, // 答题开始时间
		elapsedTime: 0, // 已用时间（秒）
		formattedTime: "0分00秒", // 初始化格式化时间
		showResult: false    // 是否显示结果弹窗
  },

  onLoad(options) {
		var unitId = options.unitId;
	
		this.setData({
			vgId: app.globalData.userVersion.vg_id,
			unitId: unitId,
			audioContext : wx.createInnerAudioContext(),
			startTime: Date.now() // 记录开始答题时间
		},()=>{
			this.initTraining(this.data.unitId);
		})
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
	playCurrentWord(e) {
		const { index,item }  = e.currentTarget.dataset;
		if (item=='') return;
		const audioContext = this.data.audioContext;
		audioContext.src = item; // 设置音频源
		audioContext.play(); // 播放
		this.setData({ isPlaying: true, playIndex:index});
	},
	tryAgain(){
		this.setData({showResult:false, formattedTime: "0分00秒",startTime: Date.now(),currentIndex:0,shufflist:[],errorCount:0});
		this.intList();
	},
	formattedTime() {
    const minutes = Math.floor(this.data.elapsedTime / 60);
		const seconds = this.data.elapsedTime % 60;
		console.log(`${minutes}分${seconds < 10 ? "0" : ""}${seconds}秒`);
    return `${minutes}分${seconds < 10 ? "0" : ""}${seconds}秒`;
  },
	selectOption:function(e){
		let dataset = e.currentTarget.dataset;
		let audio = dataset.item;
		const {currentIndex,shufflist} = this.data;
		if (shufflist[currentIndex].selected === undefined) {
			shufflist[currentIndex].selected = '';
		}
		if(shufflist[currentIndex].selected!='') return;
		const updatePaths = {};
		updatePaths[`shufflist[${currentIndex}].selected`] = audio;
		shufflist[currentIndex].selected = audio;
		this.setData({ ...updatePaths});
		if(audio==shufflist[currentIndex].audio){
			this.playAudio('correct');
		}else{
			this.data.errorCount++;
		}

		setTimeout(() => {
			const now = Date.now();
			const elapsedSeconds = Math.floor((now - this.data.startTime) / 1000);
			this.data.elapsedTime = elapsedSeconds;
			const formattedTime = this.formattedTime();
			if(this.data.currentIndex>=shufflist.length-1){
				this.setData({showResult:true, errorCount:this.data.errorCount, formattedTime: formattedTime});
				this.addWordExercise();
				if(this.data.errorCount>0) setTimeout(function(){ app.showToast('错词已加入错词本');},1000);
			}else{
				let next_currentIndex = this.data.currentIndex+1;
				let correctWord = shufflist[next_currentIndex];
				let optionList = this.generateDefinitionOptions(correctWord);
				this.setData({optionList:optionList, currentIndex:next_currentIndex, errorCount:this.data.errorCount, formattedTime: formattedTime});
			}
		}, 1500);
	},
	// 生成干扰释义选项
	generateDefinitionOptions(correctWord) {
		const { list } = this.data;
		
		// 获取干扰项单词对象
		const distractorWords = wordDataManager.generateTrainingDistractors(
			correctWord, 
			list, 
			3
		);
		// 提取词义作为选项
		const distractorDefinitions = distractorWords.map(word => word.audio);
		const allOptions = [correctWord.audio, ...distractorDefinitions];
		
		return this.shuffleArray(allOptions);
	},
	// 数组随机打乱（Fisher-Yates 洗牌算法）
  shuffleArray(array) {
    if (!array || !Array.isArray(array)) {
      console.warn('shuffleArray: 输入不是数组', array);
      return [];
    }
    
    const newArray = [...array]; // 创建副本，避免修改原数组
    
    for (let i = newArray.length - 1; i > 0; i--) {
      // 生成 0 到 i 之间的随机索引
      const j = Math.floor(Math.random() * (i + 1));
      // 使用解构赋值交换元素
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    
    return newArray;
  },
	intList: function(){
		const { list,unitId} = this.data;
		console.log('====list===',list);
		const shuffled = [...list]
    .map(item => ({ ...item })) // 复制每个对象（浅拷贝对象，足够应对普通属性）
    .sort(() => Math.random() - 0.5); // 洗牌
		var shufflist = [];
		if (shuffled.length <= 10) shufflist = [...shuffled]; // 长度不足时返回全部
		else shufflist = shuffled.slice(0, 10); // 取前10个
		console.log('====shufflist===',shufflist);
		let correctWord = shufflist[this.data.currentIndex];
		let optionList = this.generateDefinitionOptions(correctWord);
		console.log('====optionList===',optionList);
		this.setData({shufflist:shufflist, optionList:optionList});
	},
	//添加错误单词
	addWordExercise:function(){
		const { shufflist,formattedTime} = this.data;
		var wordExecList = [], catearr = [];
		shufflist.forEach((item,index)=>{
			let flag = 1;
			var wc_id = item.wc_id, selected = item.selected;
			let category_id = item.category_id;
			if(catearr.indexOf(category_id)==-1) catearr.push(category_id);
			let word_id = item.word_id;
			if(selected==item.audio){
				flag = 1;
			}
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
	// 播放当前单词
	playAudio:function(src) {
		const audioContext = this.data.audioContext;
		audioContext.src = app.globalData.serverHost+'/mp3/'+src+'.mp3'; // 设置音频源
		audioContext.play(); // 播放
	},
	// 页面卸载时清理资源
	onUnload() {
		this.pausePlay();
		this.data.audioContext.destroy();
	}

});