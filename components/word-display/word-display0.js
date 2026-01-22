Component({
  properties: {
    word: String,
    phonogram: String,
    translation: String,
    showPhonogram: {
      type: Boolean,
      value: true
    },
    showTranslation: {
      type: Boolean,
      value: true
    }
  },

  data: {
    wordLetters: []
  },

  observers: {
    'word': function(word) {
      if (word) {
        this.setData({
          wordLetters: word.split('')
        });
      }
    }
  },

  methods: {
    playAudio() {
      this.triggerEvent('playaudio');
    }
  }
});