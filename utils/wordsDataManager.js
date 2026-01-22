// utils/wordDataManager.js
const app = getApp();
class WordDataManager {
  constructor() {
    // 缓存数据结构
    this.loadedUnitsBasic = new Map(); // 单元基础信息缓存 {unitId: {data, lastAccess}}
    this.loadedUnitsExtended = new Map(); // 单元扩展信息缓存
    this.loadedWordFull = new Map(); // 单词完整信息缓存
    this.globalWordsBasic = null; // 全局单词基本信息
    this.unitList = []; // 单元列表
    this.loadStatus = {}; // 加载状态
    this.vgId = null; // 版本ID
    
    // 配置参数
    this.config = {
      cacheExpiry: 7 * 24 * 60 * 60 * 1000, // 缓存过期时间（7天）
      memoryCleanupInterval: 30 * 1000, // 内存清理间隔（30秒）
      maxMemoryAge: 30 * 60 * 1000, // 内存最大保存时间（10分钟）
      preloadDelay: 1000, // 预加载延迟
      maxPreloadUnits: 2, // 最大预加载单元数
      requestTimeout: 15000, // 请求超时时间
    };

    // 启动内存管理
    this.startMemoryManagement();
  }

  /**
   * 设置版本ID
   */
  setVgId(vgId) {
    this.vgId = vgId;
  }

  /**
   * 初始化单元列表（不加载单词数据）
   */
  async initUnitList() {
    try {
      // 先尝试从缓存获取单元列表
      const cachedList = await this.getFromStorage(`unit_list_${this.vgId}`);
      if (cachedList) {
        this.unitList = cachedList;
        this.initLoadStatus(this.unitList);
        return this.unitList;
      }

      // 从网络加载
      return await this.loadUnitListFromNetwork();
    } catch (error) {
      console.error('初始化单元列表失败:', error);
      throw error;
    }
  }

  /**
   * 从网络加载单元列表
   */
  async loadUnitListFromNetwork() {
    return new Promise((resolve, reject) => {
      const data = { vgId: this.vgId };
      
      app.requestData('/word/unit-list', 'GET', data,
        (res) => {
          if (res && res.data && res.data.data && res.data.data.unitList) {
            this.unitList = res.data.data.unitList;
            this.initLoadStatus(this.unitList);
            
            // 缓存单元列表
            this.saveToStorage(`unit_list_${this.vgId}`, this.unitList);
            
            resolve(this.unitList);
          } else {
            reject(new Error('单元列表数据格式错误'));
          }
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  /**
   * 获取单元基础信息（按需加载）
   */
  async getUnitWordsBasic(unitId, options = {}) {
    const {
      forceRefresh = false,
      preloadAdjacent = true,
      loadPriority = 'normal'
    } = options;

    try {
      // 1. 检查内存缓存
      if (!forceRefresh && this.isUnitBasicInMemory(unitId)) {
        const data = this.getUnitBasicFromMemory(unitId);
        
        if (preloadAdjacent) {
          this.delayedPreload(unitId, 'basic');
        }
        
        return this.successResult(data, true);
      }

      // 2. 检查存储缓存
      if (!forceRefresh) {
        const cached = await this.getUnitBasicFromStorage(unitId);
        if (cached) {
          this.saveUnitBasicToMemory(unitId, cached);
          
          if (preloadAdjacent) {
            this.delayedPreload(unitId, 'basic');
          }
          
          return this.successResult(cached, true);
        }
      }

      // 3. 从网络加载
      return await this.loadUnitBasicFromNetwork(unitId, loadPriority);
    } catch (error) {
      return this.errorResult(`加载单元${unitId}基础信息失败: ${error.message}`);
    }
  }

  /**
   * 获取单元扩展信息
   */
  async getUnitWordsExtended(unitId, options = {}) {
    const {
      forceRefresh = false,
      preloadAdjacent = true
    } = options;

    try {
      // 1. 检查内存缓存
      if (!forceRefresh && this.isUnitExtendedInMemory(unitId)) {
        const data = this.getUnitExtendedFromMemory(unitId);
        
        if (preloadAdjacent) {
          this.delayedPreload(unitId, 'extended');
        }
        
        return this.successResult(data, true);
      }

      // 2. 确保有基础数据
      const basicResult = await this.getUnitWordsBasic(unitId, {
        preloadAdjacent: false,
        loadPriority: 'high'
      });

      if (basicResult.status !== 'success') {
        return basicResult;
      }

      // 3. 加载扩展数据
      return await this.loadUnitExtendedFromNetwork(unitId, basicResult.data);
    } catch (error) {
      return this.errorResult(`加载单元${unitId}扩展信息失败: ${error.message}`);
    }
  }

  /**
   * 获取单词完整信息
   */
  async getWordFullDetail(wordId, unitId = null, options = {}) {
    const { forceRefresh = false } = options;

    try {
      // 1. 检查内存缓存
      if (!forceRefresh && this.isWordFullInMemory(wordId)) {
        return this.successResult(this.getWordFullFromMemory(wordId), true);
      }

      // 2. 检查存储缓存
      if (!forceRefresh) {
        const cached = await this.getWordFullFromStorage(wordId);
        if (cached) {
          this.saveWordFullToMemory(wordId, cached);
          return this.successResult(cached, true);
        }
      }

      // 3. 从网络加载
      return await this.loadWordFullFromNetwork(wordId, unitId);
    } catch (error) {
      return this.errorResult(`加载单词${wordId}完整信息失败: ${error.message}`);
    }
  }
  /**
   * 确保全局单词已加载
   */
  async ensureGlobalWordsBasicLoaded() {
    if (this.globalWordsBasic !== null) {
      return;
    }

    try {
      const cached = await this.getGlobalWordsFromStorage();
      if (cached) {
        this.globalWordsBasic = cached;
        return;
      }

      await this.loadGlobalWordsFromNetwork();
    } catch (error) {
      console.warn('加载全局单词失败:', error);
      this.globalWordsBasic = [];
    }
  }

  /**
   * 从网络加载全局单词
   */
  async loadGlobalWordsFromNetwork() {
    return new Promise((resolve, reject) => {
      const data = { 
        vgId: this.vgId, 
        basicOnly: true 
      };

      app.requestData('/word/global-words-basic', 'GET', data,
        (res) => {
          if (res && res.data && res.data.data) {
            this.globalWordsBasic = res.data.data.words;
            this.saveGlobalWordsToStorage(this.globalWordsBasic);
            resolve();
          } else {
            reject(new Error('全局单词数据格式错误'));
          }
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  // ========== 网络请求方法 ==========

  async loadUnitBasicFromNetwork(unitId, priority = 'normal') {
    this.updateLoadStatus(unitId, { loading: true });
    
    return new Promise((resolve, reject) => {
      const data = {
        vgId: this.vgId,
        category_id: unitId,
        fields: 'word,phonetic,translation,audio,word_id,category_id,part_of_speech'
      };

      let timeoutId = setTimeout(() => {
        reject(new Error('请求超时'));
      }, this.config.requestTimeout);

      app.requestData('/word/unit-words-basic', 'GET', data,
        (res) => {
          clearTimeout(timeoutId);
          
          if (res && res.data && res.data.data) {
            const words = res.data.data.words || res.data.data;
            const dataWithAccess = {
              data: words,
              lastAccess: Date.now()
            };
            
            this.saveUnitBasicToMemory(unitId, dataWithAccess);
            this.saveUnitBasicToStorage(unitId, words);
            
            this.updateLoadStatus(unitId, { 
              loading: false, 
              loaded: true 
            });
            
            resolve(this.successResult(words, false));
          } else {
            this.updateLoadStatus(unitId, { 
              loading: false, 
              error: true 
            });
            reject(new Error('单元基础数据格式错误'));
          }
        },
        (err) => {
          clearTimeout(timeoutId);
          this.updateLoadStatus(unitId, { 
            loading: false, 
            error: true 
          });
          reject(err);
        }
      );
    });
  }

  async loadUnitExtendedFromNetwork(unitId, basicWords) {
    return new Promise((resolve, reject) => {
      const data = {
        vgId: this.vgId,
        category_id: unitId,
        fields: 'examples,phonetic_detail,word_family,collocations,synonyms'
      };

      app.requestData('/word/unit-words-extended', 'GET', data,
        (res) => {
          if (res && res.data && res.data.data) {
            const extendedData = res.data.data.words || res.data.data;
            const dataWithAccess = {
              data: extendedData,
              lastAccess: Date.now()
            };
            
            this.saveUnitExtendedToMemory(unitId, dataWithAccess);
            this.saveUnitExtendedToStorage(unitId, extendedData);
            
            // 合并数据
            const mergedData = this.mergeWordData(basicWords, extendedData);
            
            resolve(this.successResult(mergedData, false));
          } else {
            reject(new Error('单元扩展数据格式错误'));
          }
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  async loadWordFullFromNetwork(wordId, unitId = null) {
    return new Promise((resolve, reject) => {
      const data = {
        word_id: wordId,
        include_all: true
      };

      app.requestData('/word/full-detail', 'GET', data,
        (res) => {
          if (res && res.data && res.data.data) {
            const fullData = res.data.data;
            const dataWithAccess = {
              data: fullData,
              lastAccess: Date.now()
            };
            
            this.saveWordFullToMemory(wordId, dataWithAccess);
            this.saveWordFullToStorage(wordId, fullData);
            
            resolve(this.successResult(fullData, false));
          } else {
            reject(new Error('单词完整数据格式错误'));
          }
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  // ========== 缓存管理方法 ==========

  // 基础信息缓存
  isUnitBasicInMemory(unitId) {
    return this.loadedUnitsBasic.has(unitId);
  }

  getUnitBasicFromMemory(unitId) {
    const cached = this.loadedUnitsBasic.get(unitId);
    if (cached) {
      cached.lastAccess = Date.now();
      return cached.data;
    }
    return null;
  }

  saveUnitBasicToMemory(unitId, data) {
    this.loadedUnitsBasic.set(unitId, data);
  }

  // 扩展信息缓存
  isUnitExtendedInMemory(unitId) {
    return this.loadedUnitsExtended.has(unitId);
  }

  getUnitExtendedFromMemory(unitId) {
    const cached = this.loadedUnitsExtended.get(unitId);
    if (cached) {
      cached.lastAccess = Date.now();
      return cached.data;
    }
    return null;
  }

  saveUnitExtendedToMemory(unitId, data) {
    this.loadedUnitsExtended.set(unitId, data);
  }

  // 完整信息缓存
  isWordFullInMemory(wordId) {
    return this.loadedWordFull.has(wordId);
  }

  getWordFullFromMemory(wordId) {
    const cached = this.loadedWordFull.get(wordId);
    if (cached) {
      cached.lastAccess = Date.now();
      return cached.data;
    }
    return null;
  }

  saveWordFullToMemory(wordId, data) {
    this.loadedWordFull.set(wordId, data);
  }

  // ========== 存储缓存方法 ==========

  async getUnitBasicFromStorage(unitId) {
    return this.getFromStorage(`unit_basic_${this.vgId}_${unitId}`);
  }

  saveUnitBasicToStorage(unitId, words) {
    this.saveToStorage(`unit_basic_${this.vgId}_${unitId}`, words);
  }

  async getUnitExtendedFromStorage(unitId) {
    return this.getFromStorage(`unit_extended_${this.vgId}_${unitId}`);
  }

  saveUnitExtendedToStorage(unitId, words) {
    this.saveToStorage(`unit_extended_${this.vgId}_${unitId}`, words);
  }

  async getWordFullFromStorage(wordId) {
    return this.getFromStorage(`word_full_${wordId}`);
  }

  saveWordFullToStorage(wordId, data) {
    this.saveToStorage(`word_full_${wordId}`, data);
  }

  async getGlobalWordsFromStorage() {
    return this.getFromStorage(`global_words_${this.vgId}`);
  }

  saveGlobalWordsToStorage(words) {
    this.saveToStorage(`global_words_${this.vgId}`, words);
  }

  // 通用存储方法
  async getFromStorage(key) {
    return new Promise((resolve) => {
      wx.getStorage({
        key: key,
        success: (res) => {
          const data = res.data;
          if (Date.now() - data.timestamp < this.config.cacheExpiry) {
            resolve(data.value);
          } else {
            wx.removeStorage({ key: key });
            resolve(null);
          }
        },
        fail: () => resolve(null)
      });
    });
  }

  saveToStorage(key, value) {
    const storageData = {
      value: value,
      timestamp: Date.now()
    };
    
    wx.setStorage({
      key: key,
      data: storageData
    });
  }

  // ========== 工具方法 ==========

  /**
   * 延迟预加载
   */
  delayedPreload(unitId, dataType) {
    setTimeout(() => {
      this.preloadAdjacentUnits(unitId, dataType);
    }, this.config.preloadDelay);
  }

  /**
   * 预加载相邻单元
   */
  preloadAdjacentUnits(currentUnitId, dataType) {
    const currentIndex = this.unitList.findIndex(unit => unit.category_id === currentUnitId);
    if (currentIndex === -1) return;

    const preloadUnits = [];
    for (let i = Math.max(0, currentIndex - 1); 
         i <= Math.min(this.unitList.length - 1, currentIndex + 1); 
         i++) {
      if (i !== currentIndex) {
        preloadUnits.push(this.unitList[i].category_id);
      }
    }

    preloadUnits.forEach(unitId => {
      if (dataType === 'basic') {
        this.getUnitWordsBasic(unitId, { 
          preloadAdjacent: false, 
          loadPriority: 'low' 
        });
      } else {
        this.getUnitWordsExtended(unitId, { 
          preloadAdjacent: false, 
          loadPriority: 'low' 
        });
      }
    });
  }

  /**
   * 合并单词数据
   */
  mergeWordData(basicWords, extendedWords) {
    const extendedMap = new Map();
    extendedWords.forEach(word => {
      if (word && word.word_id) {
        extendedMap.set(word.word_id, word);
      }
    });

    return basicWords.map(basicWord => {
      const extended = extendedMap.get(basicWord.word_id) || {};
      return {
        ...basicWord,
        ...extended
      };
    });
  }

  /**
   * 随机选择单词
   */
  selectRandomWords(words, count) {
    if (!words || words.length === 0) return [];
    if (words.length <= count) return [...words];

    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.slice(0, count);
  }

  /**
   * 打乱数组
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * 生成拼写提示
   */
  generateSpellingHint(word, revealRatio) {
    if (!word) return '';
    
    const chars = word.split('');
    const revealCount = Math.floor(chars.length * revealRatio);
    const revealedIndices = new Set();
    
    while (revealedIndices.size < revealCount) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      revealedIndices.add(randomIndex);
    }
    
    return chars.map((char, index) => 
      revealedIndices.has(index) ? char : '_'
    ).join(' ');
  }

  /**
   * 初始化加载状态
   */
  initLoadStatus(unitList) {
    unitList.forEach(unit => {
      this.loadStatus[unit.category_id] = {
        loading: false,
        loaded: false,
        error: false
      };
    });
  }

  /**
   * 更新加载状态
   */
  updateLoadStatus(unitId, status) {
    if (this.loadStatus[unitId]) {
      this.loadStatus[unitId] = { ...this.loadStatus[unitId], ...status };
    }
  }

  /**
   * 成功结果包装
   */
  successResult(data, fromCache = false) {
    return {
      status: 'success',
      data: data,
      fromCache: fromCache
    };
  }

  /**
   * 错误结果包装
   */
  errorResult(message) {
    return {
      status: 'error',
      error: message
    };
  }

  /**
   * 启动内存管理
   */
  startMemoryManagement() {
    setInterval(() => {
      this.cleanupUnusedData();
    }, this.config.memoryCleanupInterval);
  }

  /**
   * 清理未使用的数据
   */
  cleanupUnusedData() {
    const now = Date.now();
    
    // 清理基础信息缓存
    for (let [unitId, data] of this.loadedUnitsBasic) {
      if (now - data.lastAccess > this.config.maxMemoryAge) {
        this.loadedUnitsBasic.delete(unitId);
      }
    }
    
    // 清理扩展信息缓存
    for (let [unitId, data] of this.loadedUnitsExtended) {
      if (now - data.lastAccess > this.config.maxMemoryAge) {
        this.loadedUnitsExtended.delete(unitId);
      }
    }
    
    // 清理完整信息缓存
    for (let [wordId, data] of this.loadedWordFull) {
      if (now - data.lastAccess > this.config.maxMemoryAge) {
        this.loadedWordFull.delete(wordId);
      }
    }
  }

  /**
   * 获取学习状态
   */
  getWordLearningStatus(wordId) {
    try {
      const statusMap = wx.getStorageSync('word_learning_status') || {};
      return statusMap[wordId] || { 
        learned: false, 
        reviewed: 0, 
        lastReview: null,
        proficiency: 0 // 熟练度 0-100
      };
    } catch (error) {
      return { learned: false, reviewed: 0, lastReview: null, proficiency: 0 };
    }
  }

  /**
   * 更新学习状态
   */
  updateWordLearningStatus(wordId, statusUpdate) {
    try {
      const statusMap = wx.getStorageSync('word_learning_status') || {};
      statusMap[wordId] = { 
        ...this.getWordLearningStatus(wordId), 
        ...statusUpdate 
      };
      wx.setStorageSync('word_learning_status', statusMap);
    } catch (error) {
      console.error('更新学习状态失败:', error);
    }
  }

  /**
   * 标记单词为已学习
   */
  markWordAsLearned(wordId) {
    this.updateWordLearningStatus(wordId, {
      learned: true,
      reviewed: this.getWordLearningStatus(wordId).reviewed + 1,
      lastReview: new Date().toISOString(),
      proficiency: Math.min(100, this.getWordLearningStatus(wordId).proficiency + 20)
    });
  }

  /**
   * 收藏单词
   */
  toggleWordFavorite(wordId) {
    try {
      const favorites = wx.getStorageSync('favorite_words') || [];
      const index = favorites.indexOf(wordId);
      
      if (index > -1) {
        favorites.splice(index, 1);
        wx.setStorageSync('favorite_words', favorites);
        return false;
      } else {
        favorites.push(wordId);
        wx.setStorageSync('favorite_words', favorites);
        return true;
      }
    } catch (error) {
      console.error('操作收藏失败:', error);
      return false;
    }
  }

  /**
   * 检查是否收藏
   */
  isWordFavorite(wordId) {
    try {
      const favorites = wx.getStorageSync('favorite_words') || [];
      return favorites.includes(wordId);
    } catch (error) {
      return false;
    }
  }

  /**
   * 清除缓存
   */
  clearCache(level = 'all') {
    switch (level) {
      case 'basic':
        this.loadedUnitsBasic.clear();
        break;
      case 'extended':
        this.loadedUnitsExtended.clear();
        break;
      case 'full':
        this.loadedWordFull.clear();
        break;
      case 'global':
        this.globalWordsBasic = null;
        wx.removeStorage({ key: `global_words_${this.vgId}` });
        break;
      case 'all':
        this.loadedUnitsBasic.clear();
        this.loadedUnitsExtended.clear();
        this.loadedWordFull.clear();
        this.globalWordsBasic = null;
        // 清除所有相关存储
        const keys = [
          `unit_list_${this.vgId}`,
          `global_words_${this.vgId}`
        ];
        keys.forEach(key => {
          wx.removeStorage({ key: key });
        });
        break;
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      unitsBasicLoaded: this.loadedUnitsBasic.size,
      unitsExtendedLoaded: this.loadedUnitsExtended.size,
      wordsFullLoaded: this.loadedWordFull.size,
      globalWordsCount: this.globalWordsBasic ? this.globalWordsBasic.length : 0,
      totalUnits: this.unitList.length
    };
  }
}

// 创建单例
const wordDataManager = new WordDataManager();
export default wordDataManager;