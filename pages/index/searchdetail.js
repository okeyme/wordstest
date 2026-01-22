const app = getApp();
const DETAIL_CACHE_KEY = 'wordDetailCache'; // 详情页单独缓存

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
    vgId:0,
    searchValue: '',      // 搜索输入框的值
		searchResult: [],     // 搜索结果
		wordIndex:0,
		wordItem:[],
		showResult: false,
		isPlaying:false,
		audioContext:null,
		playid:-1,
		isLoading:true,

		wordLetter:[],
		phonogramList:[],
		phonogram_btngroup:0,
		phonogramIndex:0,
		phonogram_letter:[],
		phonogram_map: {"tr":"tr","dz":"dz","dr":"dr","ey":"eɪ","ch":"tʃ","jh":"dʒ","ur":"ʊə","ar":"eə","ir":"ɪə","ow":"əʊ","aw":"aʊ","ay":"aɪ","oy":"ɔɪ","aa":"ɑː","ao":"ɔː","er":"ɜː","iy":"iː","ts":"ts","uw":"uː","hh":"h","sh":"ʃ","zh":"ʒ","w":"w","ng":"ŋ","m":"m","n":"n","y":"j","r":"r","l":"l","s":"s","z":"z","ih":"ɪ","dh":"ð","th":"θ","v":"v","f":"f","k":"k","g":"ɡ","ax":"ə","t":"t","b":"b","p":"p","ae":"æ","eh":"e","ah":"ʌ","uh":"ʊ","oo":"ɒ","d":"d","jum":"juː","aie":"aɪə","aue":"aʊə","gj":"ɡz","jr":"jə","yuu":"jʊ","yur":"jʊə","js":"ks","jw":"kw","l1":"l","ht":"tiː","wa":"wʌ","tq":"tθ","eks":"eks","#":"-","@":"✿"},
		syllable_phonogram:[],
		syllable_phonogram_map:[],
		syllable_letters:[],
		letterIndex:-1,
		syllarr:["aʊ","aʊl","aʊt"],
		temptimeout:false,
		pinDu: null,
		pinDuVersion:0,
		letterIndex:-1,
		letterTimeTemp:null,
		cffyAffix:[],
		wordId:0
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		var wordIndex = options.wordIndex;
		var wordId = options.wordId;
		var word = options.word;
    this.setData({
			vgId: app.globalData.userVersion.vg_id,
			wordId: wordId,
			word: word,
			wordIndex:wordIndex,
			audioContext : wx.createInnerAudioContext(),
			isLoading: true
		},()=>{
			// 先显示基础信息（如果有）
			if (app.globalData.selectedWord) {
					this.setData({
							wordItem: app.globalData.selectedWord
					});
			}
			// 然后加载完整详情
			this.loadWordDetail();
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
  /**==加载单词详细==*/ 
	loadWordDetail: function(){
		const { wordId, word } = this.data;
        
        // 尝试从本地缓存获取
        const cacheKey = `word_detail_${wordId || word}`;
        const cachedData = wx.getStorageSync(cacheKey);
        
        if (cachedData && cachedData.timestamp > Date.now() - 30 * 60 * 1000) {
            // 缓存有效（30分钟内）
            console.log('从缓存加载单词详情');
            this.setData({
                wordItem: cachedData.data,
                isLoading: false
            }, () => {
                this.processWordData();
            });
            return;
        }
        
        // 调用API获取完整详情
        const data = {};
        if (wordId) {
            data.wordId = wordId;
        } else if (word) {
            data.word = word;
        } else {
            wx.showToast({
                title: '参数错误',
                icon: 'none'
            });
            return;
        }
        
        app.requestData('/word/getDetail', 'POST', data, (res) => {
						console.log('res====',res);
            if (res && res.data && res.data.data && res.data.data.data.length > 0) {
                const wordData = res.data.data.data[0];
                console.log('获取到完整单词详情:', wordData);
                
                // 更新数据
                this.setData({
                    wordItem: wordData,
                    isLoading: false
                }, () => {
                    this.processWordData();
                    
                    // 缓存到本地（30分钟）
                    wx.setStorageSync(cacheKey, {
                        data: wordData,
                        timestamp: Date.now()
                    });
                });
            } else {
                this.setData({ isLoading: false });
                wx.showToast({
                    title: '加载失败',
                    icon: 'none'
                });
            }
        }, (err) => {
            console.error('获取单词详情失败', err);
            this.setData({ isLoading: false });
            wx.showToast({
                title: '网络错误',
                icon: 'none'
            });
        });
	},
	// 处理单词数据（原有的数据处理逻辑）
	processWordData() {
		const { wordItem } = this.data;
		if (!wordItem) return;
		
		// 原有的数据处理逻辑...
		const wordLetter = wordItem.word ? wordItem.word.split('') : [];
		
		this.setData({
				wordLetter: wordLetter,
				cffyAffix: wordItem.affix_gz
		}, () => {
				this.loadAffix();
				if (wordItem.phonogram_letter) {
						this.load_phonogram_letter();
				}
				if (wordItem.syllable_letters) {
						this.load_syllable_letter();
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
	playAudio() {
		const {wordItem,audioContext} = this.data;
		audioContext.src = wordItem.en_audio; // 设置音频源
		audioContext.play(); // 播放
		this.setData({ isPlaying: true});
	},
	playExample(e) {
		const {wordItem,audioContext} = this.data;
		var example = wordItem.example_ids;
		let index = e.currentTarget.dataset.index;
		audioContext.src = example[index].example_audio; // 设置音频源
		audioContext.play(); // 播放
		this.setData({ isPlaying: true,playid:index});
	},


	//加载单词的拼读信息
  load_phonogram_letter: function(){
		/**==处理音节=**/
		let pharr = [];
    var wordItem = this.data.wordItem;
		var phonogram_letter = wordItem.phonogram_letter;
		var wordLetter = wordItem.word_letters;
    if(phonogram_letter!='' && wordLetter!=''){
			console.log('phonogram_letter===',phonogram_letter);
			var phonogram_letter_arr = phonogram_letter.split("#");
			phonogram_letter = phonogram_letter_arr[0].split(",");
			console.log('phonogram_letter===',phonogram_letter);
			wordLetter = JSON.parse(wordLetter);
      this.setData({wordLetter:wordLetter, phonogram_letter:phonogram_letter});
    }else{
      this.setData({ phonogram_letter:[],pinduLetter_rand:[]});
    }
  },
  //学习页拼读播放
	letterPlay: function(e){
		var letterIndex = e.currentTarget.dataset.index;
		const {phonogram_map,phonogram_letter,wordItem} = this.data;
		let yb = phonogram_letter[letterIndex];
		if(yb=='#') return;
		let src = 'https://w.360e.cn/yinbiao/ybsound/'+yb+'.mp3';
		var wordLetter = wordItem.word_letters;
		wordLetter = JSON.parse(wordLetter);
		this.setData({letterIndex:letterIndex,wordLetter:wordLetter});
		this.audioPlay(src);
	},
	letterPlayAll() {
		if(this.data.letterTimeTemp) { app.showToast('正在播放'); return;}
		const {audioContext,phonogram_map,wordItem} = this.data;
		var wordLetter = wordItem.word_letters;
		wordLetter = JSON.parse(wordLetter);
		this.setData({phonogram_btngroup:0,letterIndex:-1,wordLetter:wordLetter});
		var letterIndex = 0;
		var that = this;
		var pharr = this.data.phonogram_letter;
		//console.log('====pharr===',pharr);
		// 播放队列处理函数
		const playNextLetter = () => {
			if (letterIndex >= pharr.length) {
				// 播放完毕清理资源
				//audioContext.destroy(); // 清理资源
				this.setData({letterIndex: -1,isPlaying:false});
				audioContext.offEnded();
				audioContext.offError();
				clearTimeout(this.data.temptimeout);
				console.log('wordAudio====');
				this.wordAudio();
				return;
			}
			let yb = pharr[letterIndex];
			if (yb == '#') {
				letterIndex++; // 索引+1，跳过当前的 "$"
				playNextLetter(); // 递归调用，处理下一个字母
				return; // 终止当前函数，避免执行后续逻辑
			}
			let src = 'https://w.360e.cn/yinbiao/ybsound/'+yb+'.mp3';
			this.setData({letterIndex: letterIndex,isPlaying:true});
			if (!src) {
				letterIndex++;
				playNextLetter();
				return;
			}
			//每次播放前移除所有事件监听，防止累积
			audioContext.offEnded();
    	audioContext.offError();
			// 设置音频源并播放
			audioContext.src = src;
			audioContext.play();
	
			// 监听当前音频播放结束
			audioContext.onEnded(() => {
				letterIndex++;
				// 短暂延迟确保播放间隙清晰
				this.data.temptimeout = setTimeout(playNextLetter, 100);
			});
	
			// 监听音频错误
			audioContext.onError((err) => {
				console.error(`播放字母${letter}失败:`, err);
				letterIndex++;
				playNextLetter();
			});
		};
	
		// 开始播放队列
		playNextLetter();
	},
	//加载单词的音节音段信息
  load_syllable_letter: function(){
    /**==处理音节=**/
		var wordItem = this.data.wordItem;
		var phonogram_str = wordItem.syllable_phonogram;
		var letter_str = wordItem.syllable_letters;
		console.log('===phonogram_str=',phonogram_str);
		console.log('===letter_str=',letter_str);
    if(phonogram_str!='' && phonogram_str!=null){
			var phonogramArr = JSON.parse(phonogram_str);
			var pharr = phonogramArr[0].split('-');
			var phmaparr = phonogramArr[1].split('-');
			var larr = letter_str.split('-');
      this.setData({ syllable_phonogram:pharr,syllable_phonogram_map:phmaparr, syllable_letters:larr});
    }else{
      this.setData({ syllable_phonogram:[],syllable_phonogram_map:[], syllable_letters:[]});
    }
	},
	syllablePlay: function(e){
		var letterIndex = e.currentTarget.dataset.index;
		const {syllable_phonogram,syllable_phonogram_map,phonogram_map,syllable_letters} = this.data;
		let ybmap = syllable_phonogram_map[letterIndex];
		
		this.setData({letterIndex:letterIndex,wordLetter:syllable_letters});
		var src = 'https://w.360e.cn/uploads/yinbiaomp3/'+ybmap+'.mp3';
		this.audioPlay(src);
	},
	syllableAll: function(){
		if(this.data.letterTimeTemp) { app.showToast('正在播放'); return;}
		const {syllable_letters} = this.data;
		this.setData({phonogram_btngroup:1,letterIndex:-1,wordLetter:syllable_letters});
		var letterIndex = 0;
		var that = this;
		const {audioContext,syllable_phonogram,syllable_phonogram_map,syllarr} = this.data;
		var pharr = syllable_phonogram;
		const playNextLetter = () => {
			if (letterIndex >= pharr.length) {
				// 播放完毕清理资源
				//audioContext.destroy(); // 清理资源
				this.setData({letterIndex: -1,isPlaying:false});
				audioContext.offEnded();
    		audioContext.offError();
				this.syllableAudio();
				clearTimeout(this.data.temptimeout);
				return;
			}
			const ybmap = syllable_phonogram_map[letterIndex];
			var src = 'https://w.360e.cn/uploads/yinbiaomp3/'+ybmap+'.mp3';
			this.setData({letterIndex: letterIndex,isPlaying:true});
			if (!src) {
				letterIndex++;
				playNextLetter();
				return;
			}
			//每次播放前移除所有事件监听，防止累积
			audioContext.offEnded();
    	audioContext.offError();
			// 设置音频源并播放
			audioContext.src = src;
			audioContext.play();
	
			// 监听当前音频播放结束
			audioContext.onEnded(() => {
				letterIndex++;
				// 短暂延迟确保播放间隙清晰
				this.data.temptimeout = setTimeout(playNextLetter, 100);
			});
	
			// 监听音频错误
			audioContext.onError((err) => {
				console.error(`播放字母${letter}失败:`, err);
				letterIndex++;
				playNextLetter();
			});
		};
	
		// 开始播放队列
		playNextLetter();
	},
	//单词音频
	syllableAudio:function(){	
		var wordItem = this.data.wordItem;
		let word = wordItem.word;
		var src = 'https://w.360e.cn/uploads/youdaowordmp3/'+word+'.mp3';
		this.setData({letterIndex:-1});
		this.audioPlay(src);
	},
	/*========音频播放==========* */
  //例句音频
  playexampleaudio:function(e){
		var exampleindex = e.currentTarget.dataset.index;
		var wordItemExample = this.data.examples;
		let src = wordItemExample[exampleindex].example_audio;
		this.audioPlay(src);
		this.setData({letterIndex:-2});
  },
  //单词音频
	wordAudio:function(){	
		var wordItem = this.data.wordItem;
		let src = wordItem.en_audio;
		let wordId =  wordItem.wordId;
		this.setData({ letterIndex: -1,letterIndex:-1});
		console.log('src===',src);
		this.audioPlay(src);
	},
	//播放音频
	audioPlay: function (src) {
		const {audioContext} = this.data;
		audioContext.src = src;
		audioContext.play();
		this.setData({ isPlaying: true});
		// 监听音频播放结束事件
    audioContext.onEnded(() => {
			this.setData({ isPlaying: false });
      // 如果需要在每个单词播放结束后立即切换到下一个，可以在这里调用
    });
    // 监听音频播放错误
    audioContext.onError((res) => {
      app.showToast('播放失败');
    });
	},
/*========音频播放==========* */
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
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady() {

	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow() {

	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide() {

	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	// 页面卸载时清理资源
	onUnload() {
		this.data.audioContext.pause();
		this.data.audioContext.destroy();
	},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh() {

	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom() {

	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage() {

	}
})