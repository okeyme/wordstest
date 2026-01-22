const app = getApp();
import wordDataManager from '../../utils/wordDataManager';
Page({
  data: {
		model:'wordAnipop',
		audioContext:null,
		vgId:0,
		loading: false,
		unitList:[],
		list: [],
		catelist:[],
    mixedList: [],       // 打乱后的单词+释义列表
    firstSelect: null,   // 记录第一次选中的卡片（单词/释义）
		showResult: false,    // 是否显示结果弹窗
		errorList:[],
		startTime: 0, // 答题开始时间
		elapsedTime: 0, // 已用时间（秒）
		formattedTime: "0分00秒", // 初始化格式化时间
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
      this.initGame();
    } catch (error) {
      console.error('训练初始化失败:', error);
      this.setData({ isLoading: false });
    }
  },
	formattedTime() {
    const minutes = Math.floor(this.data.elapsedTime / 60);
		const seconds = this.data.elapsedTime % 60;
		console.log(`${minutes}分${seconds < 10 ? "0" : ""}${seconds}秒`);
    return `${minutes}分${seconds < 10 ? "0" : ""}${seconds}秒`;
  },
  // 初始化游戏（打乱单词+释义）
  initGame() {
		const { unitId,list } = this.data;
		let wordList = [...list].sort(() => Math.random() - 0.5); // 洗牌
		let tempList = [];
    // 拆分单词和释义到临时数组
    wordList.forEach(item => {
      tempList.push({ 
        type: "word", 
        value: item.word, 
        showValue: item.word, 
				status: "",
				selected:'',
				originalIndex: item // 关键修改：保存原始索引
      });
      tempList.push({ 
        type: "trans", 
        value: item.translate, 
        showValue: item.translate, 
				status: "",
				selected:'',
				originalIndex: item // 关键修改：保存原始索引
      });
    });

    // 打乱数组（随机排序）
    tempList = tempList.sort(() => Math.random() - 0.5);
		console.log('tempList',tempList);
    this.setData({ mixedList: tempList });
  },

  // 处理卡片点击
  handleCardTap(e) {
    let index = e.currentTarget.dataset.index;
		const {firstSelect} = this.data;
		var errorList = this.data.errorList;
		var mixedList = this.data.mixedList;
		const currentCard = mixedList[index];
		currentCard.index = index; // 记录当前卡片的索引
    // 避免重复点击或已匹配的卡片
    if (firstSelect?.index === index || currentCard.showValue === "") return;

    if (firstSelect) {
			// 使用局部更新路径
			const updatePaths = {};
			const firstIndex = firstSelect.index;
      // 判断是否配对成功（通过原始索引匹配）
			if (firstSelect.originalIndex === currentCard.originalIndex && firstSelect.type !== currentCard.type) { // 配对成功
				updatePaths[`mixedList[${firstIndex}].status`] = 'correct';
      	updatePaths[`mixedList[${index}].status`] = 'correct';
				this.setData({ ...updatePaths});
				this.playAudio('correct');
				setTimeout(() => {
					updatePaths[`mixedList[${firstIndex}].showValue`] = '';
      		updatePaths[`mixedList[${index}].showValue`] = '';
          this.setData({ ...updatePaths});
          this.checkGameOver();
        }, 1000);
      } else {
				// 配对失败
				updatePaths[`mixedList[${firstIndex}].status`] = 'wrong';
      	updatePaths[`mixedList[${index}].status`] = 'wrong';
				if(currentCard.type=='word'){
					if(errorList.indexOf(index)==-1) errorList.push(index);
				}
				if(firstSelect.type=='word'){
					if(errorList.indexOf(firstIndex)==-1) errorList.push(firstIndex);
				}
				this.setData({ ...updatePaths});
				this.playAudio('wrong');
				setTimeout(() => {
					updatePaths[`mixedList[${firstIndex}].status`] = '';
					updatePaths[`mixedList[${index}].status`] = '';
					updatePaths[`mixedList[${firstIndex}].selected`] = false;
      		updatePaths[`mixedList[${index}].selected`] = false;
          this.setData({ ...updatePaths});
        }, 1000);
      }
			this.setData({ firstSelect: null,errorList:errorList });
			this.checkGameOver();
    } else {
			// 第一次点击
      this.setData({
        firstSelect: currentCard,
        [`mixedList[${index}].selected`]: true
      });
		}
	},
	
  // 检查是否全部消除（游戏结束）
  checkGameOver() {
    const { mixedList,errorList } = this.data;
    const allHidden = mixedList.every(item => item.showValue === "");
    if (allHidden) {
			this.setData({ showResult: true});
			const now = Date.now();
			const elapsedSeconds = Math.floor((now - this.data.startTime) / 1000);
			this.data.elapsedTime = elapsedSeconds;
			const formattedTime = this.formattedTime();
			this.data.formattedTime = formattedTime;
			this.addWordExercise();
			if(errorList.length>0) setTimeout(function(){ app.showToast('错词已加入错词本');},1000);
    }
  },

  // 重新开始游戏
  restartGame() {
		this.initGame();
		this.setData({ showResult: false});
	},
	//添加错误单词
	addWordExercise:function(){
		const { mixedList,unitId,list,errorList,formattedTime} = this.data;
		var wordExecList = [], catearr = [];
		mixedList.forEach((item,index)=>{
			let flag = 1;
			let category_id = list[item.originalIndex].category_id;
			if(catearr.indexOf(category_id)==-1) catearr.push(category_id);
			let word_id = list[item.originalIndex].word_id;
			if(errorList.indexOf(index)>=0){
				flag = 0;
			}
			wordExecList.push({category_id:category_id,wc_id:item.originalIndex,word_id:word_id,status:flag});
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
		this.data.audioContext.pause();
		this.data.audioContext.destroy();
	}

});