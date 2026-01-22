Component({
  data: {
    isLetterMode: true,       // 字母/符号键盘切换
    isUpperCase: false,       // 大小写状态
    // 完整字母键盘数据
    letterKeysRow1: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    letterKeysRow2: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
		letterKeysRow3: ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
		upperLetterKeysRow1:['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
		upperLetterKeysRow2:['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
		upperLetterKeysRow3:['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    // 符号键盘数据（可按需扩展）
    symbolKeysRow1: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    symbolKeysRow2: ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
    symbolKeysRow3: ['.', ',', '?', '!', '\'', '^', '%', '#', '+', '=']
  },

  methods: {
    // 处理按键点击
    handleKeyClick(e) {
      const key = e.currentTarget.dataset.key;
      this.triggerEvent('keyClick', { key });
    },
    
    // 切换大小写
    toggleCase() {
      this.setData({
        isUpperCase: !this.data.isUpperCase
      });
    },
    
    // 退格键（删除）
    handleBackspace() {
			this.triggerEvent('backspace', {}, { bubbles: true, composed: true });
    },
    
    // 空格键
    handleSpace() {
      this.triggerEvent('space');
    },
    // 完成键
    handleComplete() {
      this.triggerEvent('complete');
    },
    
    // 切换键盘模式（字母/符号）
    toggleMode() {
      this.setData({
        isLetterMode: !this.data.isLetterMode
      });
		},
		//切换大写
    toggleCase() {
      this.setData({
        isUpperCase: !this.data.isUpperCase
      });
    },
    // 其他方法保持不变...
  }
});