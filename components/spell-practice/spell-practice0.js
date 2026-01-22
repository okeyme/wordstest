Component({
  properties: {
    word: String,
    letters: Array
  },

  data: {
    // 拼读练习状态
    practiceLetters: [],
    resultLetters: [],
    isCompleted: false,
    isCorrect: false
  },

  observers: {
    'letters': function(letters) {
      if (letters && letters.length) {
        this.initPractice();
      }
    }
  },

  methods: {
    /**
     * 初始化练习
     */
    initPractice() {
      const { letters } = this.properties;
      const shuffled = [...letters].sort(() => Math.random() - 0.5);
      
      const practiceLetters = shuffled.map(letter => ({
        letter,
        isSelected: false
      }));
      
      const resultLetters = letters.map(() => ({
        letter: '',
        isFilled: false
      }));
      
      this.setData({
        practiceLetters,
        resultLetters,
        isCompleted: false,
        isCorrect: false
      });
    },

    /**
     * 选择字母
     */
    selectLetter(e) {
      if (this.data.isCompleted) return;
      
      const index = e.currentTarget.dataset.index;
      const { practiceLetters, resultLetters } = this.data;
      
      if (practiceLetters[index].isSelected) return;
      
      // 找到第一个空位
      const emptyIndex = resultLetters.findIndex(item => !item.isFilled);
      if (emptyIndex === -1) return;
      
      // 更新结果
      const newResult = [...resultLetters];
      newResult[emptyIndex] = {
        letter: practiceLetters[index].letter,
        isFilled: true
      };
      
      // 更新练习字母状态
      const newPractice = [...practiceLetters];
      newPractice[index].isSelected = true;
      
      this.setData({
        practiceLetters: newPractice,
        resultLetters: newResult
      }, () => {
        this.checkCompletion();
      });
    },

    /**
     * 删除最后一个字母
     */
    deleteLast() {
      const { resultLetters, practiceLetters } = this.data;
      const lastFilledIndex = resultLetters.findLastIndex(item => item.isFilled);
      
      if (lastFilledIndex === -1) return;
      
      // 找到对应的练习字母并重置
      const deletedLetter = resultLetters[lastFilledIndex].letter;
      const practiceIndex = practiceLetters.findIndex(
        item => item.letter === deletedLetter && item.isSelected
      );
      
      if (practiceIndex !== -1) {
        const newPractice = [...practiceLetters];
        newPractice[practiceIndex].isSelected = false;
        this.setData({ practiceLetters: newPractice });
      }
      
      // 清空结果位置
      const newResult = [...resultLetters];
      newResult[lastFilledIndex] = { letter: '', isFilled: false };
      
      this.setData({
        resultLetters: newResult,
        isCompleted: false
      });
    },

    /**
     * 检查完成状态
     */
    checkCompletion() {
      const { resultLetters, word } = this.data;
      const { word: targetWord } = this.properties;
      
      const filledWord = resultLetters.map(item => item.letter).join('');
      const isCompleted = resultLetters.every(item => item.isFilled);
      
      if (isCompleted) {
        const isCorrect = filledWord === targetWord;
        this.setData({
          isCompleted: true,
          isCorrect: isCorrect
        });
        
        // 触发完成事件
        this.triggerEvent('complete', {
          isCorrect,
          filledWord
        });
      }
    },

    /**
     * 重新开始
     */
    reset() {
      this.initPractice();
    }
  }
});