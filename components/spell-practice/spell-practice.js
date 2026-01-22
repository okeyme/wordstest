Component({
	options: {
		// 开启全局样式继承，让 app.wxss 中的 .flex、.text-center 等类生效
		addGlobalClass: true
	},
  properties: {
    // 单词
    word: {
      type: String,
      value: ''
    },
    
    // 字母数组
    letters: {
      type: Array,
      value: [],
      observer: 'onLettersChange'
    },
    
    // 释义
    translation: {
      type: String,
      value: ''
    },
    
    // 是否显示删除按钮
    showDeleteButton: {
      type: Boolean,
      value: true
    },
    
    // 是否显示进度
    showProgress: {
      type: Boolean,
      value: true
    },
    
    // 是否显示选项标题
    showOptionsTitle: {
      type: Boolean,
      value: true
    },
    
    // 是否允许编辑结果
    allowResultEdit: {
      type: Boolean,
      value: false
    }
  },

  data: {
    // 练习字母
    practiceLetters: [],
    
    // 结果字母
    resultLetters: [],
    
    // 完成状态
    isCompleted: false,
    isCorrect: false,
    
    // 统计
    filledCount: 0,
    totalLetters: 0
  },

  methods: {
    /**
     * 初始化练习
     */
    initPractice() {
      const { letters, word } = this.data;
      
      const targetLetters = letters && letters.length ? letters : word.split('');
      this.setData({ totalLetters: targetLetters.length });
      
      // 打乱字母顺序
      const shuffledLetters = this.shuffleArray([...targetLetters]);
      
      // 初始化练习字母
      const practiceLetters = shuffledLetters.map(letter => ({
        letter,
        isSelected: false
      }));
      
      // 初始化结果字母
      const resultLetters = targetLetters.map(() => ({
        value: '',
        isFilled: false
      }));
      
      this.setData({
        practiceLetters,
        resultLetters,
        filledCount: 0,
        isCompleted: false,
        isCorrect: false
      });
    },

    /**
     * 打乱数组
     */
    shuffleArray(array) {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    },

    /**
     * 字母变化监听
     */
    onLettersChange() {
      this.initPractice();
    },

    /**
     * 点击字母选项
     */
    onOptionTap(e) {
      if (this.data.isCompleted) return;
      
      const index = e.currentTarget.dataset.index;
      const { practiceLetters, resultLetters } = this.data;
      
      if (practiceLetters[index].isSelected) return;
      
      // 找到第一个未填充的位置
      const emptyIndex = resultLetters.findIndex(item => !item.isFilled);
      if (emptyIndex === -1) return;
      
      const selectedLetter = practiceLetters[index].letter;
      
      // 更新练习字母状态
      const newPracticeLetters = [...practiceLetters];
      newPracticeLetters[index].isSelected = true;
      
      // 更新结果字母
      const newResultLetters = [...resultLetters];
      newResultLetters[emptyIndex] = {
        value: selectedLetter,
        isFilled: true
      };
      
      // 计算进度
      const filledCount = newResultLetters.filter(item => item.isFilled).length;
      
      this.setData({
        practiceLetters: newPracticeLetters,
        resultLetters: newResultLetters,
        filledCount
      });
      
      // 触发选择事件
      this.triggerEvent('select', {
        index: index,
        letter: selectedLetter,
        position: emptyIndex
      });
      
      // 检查完成
      if (filledCount === this.data.totalLetters) {
        this.checkCompletion();
      }
    },

    /**
     * 删除最后一个字母
     */
    onDelete() {
      if (this.data.filledCount === 0 || this.data.isCompleted) return;
      
      const { resultLetters, practiceLetters } = this.data;
      
      // 找到最后一个已填充的位置
      const lastFilledIndex = resultLetters.findLastIndex(item => item.isFilled);
      if (lastFilledIndex === -1) return;
      
      const letterToRemove = resultLetters[lastFilledIndex].value;
      
      // 清空结果位置
      const newResultLetters = [...resultLetters];
      newResultLetters[lastFilledIndex] = {
        value: '',
        isFilled: false
      };
      
      // 找到对应的练习字母并重置
      const practiceIndex = practiceLetters.findIndex(
        item => item.letter === letterToRemove && item.isSelected
      );
      
      if (practiceIndex !== -1) {
        const newPracticeLetters = [...practiceLetters];
        newPracticeLetters[practiceIndex].isSelected = false;
        this.setData({ practiceLetters: newPracticeLetters });
      }
      
      // 计算进度
      const filledCount = newResultLetters.filter(item => item.isFilled).length;
      
      this.setData({
        resultLetters: newResultLetters,
        filledCount
      });
      
      // 触发删除事件
      this.triggerEvent('delete', {
        index: lastFilledIndex,
        letter: letterToRemove
      });
    },

    /**
     * 检查完成状态
     */
    checkCompletion() {
      const { resultLetters, word } = this.data;
      
      // 检查是否所有位置都已填充
      const isAllFilled = resultLetters.every(item => item.isFilled);
      if (!isAllFilled) return;
      
      // 获取拼写的单词
      const filledWord = resultLetters.map(item => item.value).join('');
      const isCorrect = filledWord === word;
      
      this.setData({
        isCompleted: true,
        isCorrect
      });
      
      // 触发完成事件
      this.triggerEvent('complete', {
        isCorrect,
        filledWord
      });
    },

    /**
     * 外部调用：重置
     */
    reset() {
      this.initPractice();
      this.triggerEvent('reset');
    }
  },

  ready() {
    this.initPractice();
  }
});