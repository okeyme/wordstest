const app = getApp();

class LearningRecordManager {
  /**
   * 添加学习记录
   */
  static addLearningRecord(options) {
    const { vgId, category_id, wc_id, word_id, revise, status = 0 } = options;
    
    return new Promise((resolve, reject) => {
      const data = {
        vgId: vgId, 
        category_id: category_id,
        wc_id: wc_id,
        word_id: word_id,
        revise: revise,
        status: status
      };
      
      app.requestData('/word/addRecord', 'POST', data, (res) => {
        if (res.data.data.status === 'success' || res.data.data.status === 'exist') {
          const day_word = res.data.data.day_word;
          
					// 统一调用更新用户单词计数
					if(res.data.data.status === 'success'){
						const success = app.updateUserWordCount(1, revise, day_word.day_word_count, day_word.day_revise_count);
						console.log('📢 已触发学习记录更新事件');
						if (success) {
							resolve({
								success: true,
								day_word: day_word
							});
						} else {
							reject(new Error('更新学习计数失败'));
						}
					}
        } else {
          reject(new Error('添加记录失败'));
        }
      }, (err) => {
        reject(err);
      });
    });
	}

	static addErrorWord(options) {
    const { vgId, category_id, wc_id, word_id } = options;
    return new Promise((resolve, reject) => {
      const data = {
        vgId: vgId, 
        category_id: category_id,
        wc_id: wc_id,
        word_id: word_id
      };
      
      app.requestData('/word/addErrorWord', 'POST', data, (res) => {
        console.log('addErrorWord response:', res);
        resolve(res.data.data);
      }, (err) => {
        console.error('addErrorWord request failed:', err);
        reject(err);
      });
    });
	}
	
}

module.exports = LearningRecordManager;