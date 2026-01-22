// utils/wordDataManager.js
const app = getApp();

// 缓存键生成器
const CacheKeys = {
  // 单元列表缓存键
  unitList: (vgId) => `unitList_${vgId}`,
  // 单元数据缓存键（单词基本信息）
  unitData: (vgId, unitId) => `unitData_${vgId}_${unitId}`,
  // 单词例句缓存键（学习页专用）
  wordExamples: (vgId, unitId) => `wordExamples_${vgId}_${unitId}`,
  // 单个单词详细数据缓存键（详细页专用）
	wordDetail: (vgId, wordId) => `wordDetail_${vgId}_${wordId}`,
	// 单词收藏
	wordCollection: (vgId, collectionType) => 
    `wordCollection_${vgId}_${collectionType}`
};

export default {
  // 从本地加载指定单元的单词数据
  loadUnitFromLocal(vgId, unitId) {
    const cacheKey = CacheKeys.unitData(vgId, unitId);
    const cache = wx.getStorageSync(cacheKey) || {};
    if (cache.version && cache.list) {
      return {
        list: cache.list,
        version: cache.version,
        unitInfo: cache.unitInfo
      };
    }
    return null;
  },

  // 远程加载指定单元的单词数据
  fetchUnitData(vgId, unitId, localVersion) {
    return new Promise((resolve, reject) => {
      const data = { 
        vgId, 
        unitId,
        local_version: localVersion 
      };
      
      app.requestData('/word/getUnit', 'GET', data, 
        (res) => {
          resolve({
            changed: res.data.changed,
            data: res.data.changed ? {
              list: res.data.data.list,
              unitInfo: res.data.data.unitInfo,
              version: res.data.version
            } : null
          });
        },
        (err) => {
          reject(err);
        }
      );
    });
  },

  // 预加载下一个单元的单词数据
  preloadNextUnit(vgId, nextUnitId, currentVersion) {
    const localData = this.loadUnitFromLocal(vgId, nextUnitId);
    if (!localData) {
      this.fetchUnitData(vgId, nextUnitId, 0).then(remoteResult => {
        if (remoteResult.changed && remoteResult.data) {
          this.updateLocalCache(vgId, nextUnitId, remoteResult.data);
        }
      }).catch(console.error);
    }
  },

  // 更新本地缓存
  updateLocalCache(vgId, unitId, unitData) {
    const cacheKey = CacheKeys.unitData(vgId, unitId);
    const cache = {
      list: unitData.list,
      unitInfo: unitData.unitInfo,
      version: unitData.version,
      timestamp: Date.now()
    };
    
    wx.setStorageSync(cacheKey, cache);
  },

  // 统一获取单元单词数据（集成loadUnitData功能）
  async getUnitData(vgId, unitId, callback) {
    try {
      // 1. 先加载本地当前单元缓存
      const localData = this.loadUnitFromLocal(vgId, unitId);
      let version = 0;
      
      // 如果有本地缓存，先显示本地数据
      if (localData) {
        version = localData.version;
        console.log(`====== 已返回单元 ${unitId} 本地cache ======`);
        callback({
          list: localData.list,
          unitInfo: localData.unitInfo,
          version: localData.version,
          fromCache: true
        });
      }

      // 2. 检查远程更新
      const remoteResult = await this.fetchUnitData(vgId, unitId, version);
      
      // 3. 如果有更新，更新缓存并返回新数据
      if (remoteResult.changed && remoteResult.data) {
        this.updateLocalCache(vgId, unitId, remoteResult.data);
        
        callback({
          list: remoteResult.data.list,
          unitInfo: remoteResult.data.unitInfo,
          version: remoteResult.data.version,
          fromRemote: true
        });
        console.log(`====== 已远程更新单元 ${unitId} 数据 ======`);
      } else {
        console.log(`====== 单元 ${unitId} 没有更新 ======`);
      }
    } catch (error) {
      console.error('单元数据服务错误:', error);
      callback({ error: true });
    }
  },

  // 获取单元列表
  async getUnitList(vgId, callback) {
    try {
      const cacheKey = CacheKeys.unitList(vgId);
      const localCache = wx.getStorageSync(cacheKey);
      
      // 先返回本地缓存
      if (localCache && localCache.unitList) {
        callback(localCache.unitList);
      }
      
      const data = { vgId };
      app.requestData('/word/getUnitList', 'GET', data, 
        (res) => {
          const unitList = res.data.data.unitList || [];
          // 更新本地缓存
          wx.setStorageSync(cacheKey, {
            unitList: unitList,
            timestamp: Date.now()
          });
          callback(unitList);
        },
        (err) => {
          console.error('获取单元列表失败:', err);
          callback([]);
        }
      );
    } catch (error) {
      console.error('单元列表服务错误:', error);
      callback([]);
    }
  },

  // ========== 学习页专用方法 ==========
  
  // 获取单词例句（学习页专用）
  async getWordExamples(vgId, unitId, wordIds, callback) {
    try {
      const cacheKey = CacheKeys.wordExamples(vgId, unitId);
      const localCache = wx.getStorageSync(cacheKey);
      
      // 先返回本地缓存
      if (localCache && localCache.data) {
        const targetData = this.extractWordData(localCache.data, wordIds);
        if (Object.keys(targetData).length > 0) {
          callback({
            data: targetData,
            fromCache: true
          });
          return;
        }
      }

      const data = { 
        vgId, 
        unitId,
        wordIds: Array.isArray(wordIds) ? wordIds.join(',') : wordIds,
        dataType: 'examples' // 告诉后端只返回例句数据
      };
      
      app.requestData('/word/getWordData', 'GET', data, 
        (res) => {
          if (res.data.changed && res.data.data) {
            // 更新例句缓存
						const newCacheData = localCache?.data ? { ...localCache.data, ...res.data.data } : res.data.data;
            wx.setStorageSync(cacheKey, {
              data: newCacheData,
              timestamp: Date.now()
            });
            
						const targetData = this.extractWordData(res.data.data, wordIds);
            callback({
              data: targetData,
              fromRemote: true
            });
          }
        },
        (err) => {
          console.error('获取单词例句失败:', err);
          callback({ error: true });
        }
      );
    } catch (error) {
      console.error('单词例句服务错误:', error);
      callback({ error: true });
    }
  },

  // 预加载下一个单词的例句
  preloadNextWordExamples(vgId, unitId, nextWordId) {
    if (!nextWordId) return;
    
    // 检查是否已有缓存
    const cacheKey = CacheKeys.wordExamples(vgId, unitId);
    const existingCache = wx.getStorageSync(cacheKey);
    
    if (existingCache && existingCache.data && existingCache.data[nextWordId]) {
      console.log(`单词 ${nextWordId} 例句已有缓存，跳过预加载`);
      return;
    }

    // 异步预加载
    const data = { 
      vgId, 
      unitId,
      wordIds: nextWordId,
      dataType: 'examples'
    };
    
    app.requestData('/word/getWordData', 'GET', data, 
      (res) => {
        if (res.data.changed && res.data.data) {
          // 合并到现有缓存
          const newCacheData = existingCache?.data ? { ...existingCache.data, ...res.data.data } : res.data.data;
          wx.setStorageSync(cacheKey, {
            data: newCacheData,
            timestamp: Date.now(),
            preloaded: true
          });
          
          console.log(`✅ 预加载单词 ${nextWordId} 例句成功`);
        }
      },
      (err) => {
        console.error(`预加载单词 ${nextWordId} 例句失败:`, err);
      }
    );
  },

  // ========== 详细页专用方法 ==========
  
  // 获取单词完整详细数据（详细页专用）
  async getWordDetail(vgId, wordId, callback) {
    try {
      const cacheKey = CacheKeys.wordDetail(vgId, wordId);
      const localCache = wx.getStorageSync(cacheKey);
      
      // 先返回本地缓存
      if (localCache && localCache.data) {
        callback({
          data: localCache.data,
          fromCache: true
        });
        return;
      }

      const data = { 
        vgId, 
        wordIds: wordId,
        dataType: 'full' // 告诉后端返回所有扩展数据
      };
      
      app.requestData('/word/getWordData', 'GET', data, 
        (res) => {
          if (res.data.changed && res.data.data) {
            const wordDetail = res.data.data;
            // 更新单个单词缓存
            wx.setStorageSync(cacheKey, {
              data: wordDetail,
              timestamp: Date.now()
            });
            
            callback({
              data: wordDetail,
              fromRemote: true
            });
          } else {
            callback({ error: true, message: '未获取到单词详细数据' });
          }
        },
        (err) => {
          console.error('获取单词详细数据失败:', err);
          callback({ error: true });
        }
      );
    } catch (error) {
      console.error('单词详细数据服务错误:', error);
      callback({ error: true });
    }
  },

  // ========== 工具方法 ==========
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
	// 提取训练必需的字段
	extractTrainingFields(word) {
		return {
			wc_id: word.wc_id,
			word_id: word.word_id,
			word: word.word,
			attribute: word.attribute,
			translate: word.translate, // 词义
			audio: word.audio
			// 只保留这三个训练必需的字段，其他字段不要
		};
	},
  // 从数据中提取指定单词的数据
  extractWordData(sourceData, wordIds) {
    const result = {};
    const targetIds = Array.isArray(wordIds) ? wordIds : [wordIds];
		
    targetIds.forEach(wordId => {
      if (sourceData[wordId]) {
        result[wordId] = sourceData[wordId];
      }
    });
    return result;
  },

  // 清理指定单元的缓存
  clearUnitCache(vgId, unitId) {
    const unitCacheKey = CacheKeys.unitData(vgId, unitId);
    const examplesCacheKey = CacheKeys.wordExamples(vgId, unitId);
    
    wx.removeStorageSync(unitCacheKey);
    wx.removeStorageSync(examplesCacheKey);
    
    console.log(`已清理单元 ${unitId} 缓存`);
  },

  // 清理指定单词的详细数据缓存
  clearWordDetailCache(vgId, wordId) {
    const cacheKey = CacheKeys.wordDetail(vgId, wordId);
    wx.removeStorageSync(cacheKey);
    console.log(`已清理单词 ${wordId} 详细数据缓存`);
  },

  // 清理所有缓存
  clearAllCache(vgId) {
    const unitListKey = CacheKeys.unitList(vgId);
    
    // 获取所有缓存键
    const cacheKeys = [];
    const res = wx.getStorageInfoSync();
    res.keys.forEach(key => {
      if (key.startsWith(`unitList_${vgId}_`) || 
          key.startsWith(`unitData_${vgId}_`) || 
          key.startsWith(`wordExamples_${vgId}_`) ||
          key.startsWith(`wordDetail_${vgId}_`) ||
          key === unitListKey) {
        cacheKeys.push(key);
      }
    });
    
    // 批量删除
    cacheKeys.forEach(key => {
      wx.removeStorageSync(key);
    });
    
    console.log(`已清理教材 ${vgId} 的所有缓存，共 ${cacheKeys.length} 个`);
	},
	
	/****============================训练页==================================*** */
	// 训练功能专用：直接获取多个单元的单词数据
	async getTrainingWordsData(vgId, unitIds, callback) {
		try {
			const unitIdArray = Array.isArray(unitIds) ? unitIds : [unitIds];
			const result = {
				words: {},
				unitInfo: {},
				fromCache: true
			};
	
			// 并行发起所有请求
			const unitPromises = unitIdArray.map(unitId => {
				return new Promise((resolve) => {
					this.getUnitData(vgId, unitId, (unitResult) => {
						resolve({
							unitId: unitId,
							data: unitResult
						});
					});
				});
			});
	
			// 等待所有请求完成
			const allResults = await Promise.all(unitPromises);
			
			let hasRemoteData = false;
	
			// 按原始顺序处理结果
			allResults.forEach(({ unitId, data }) => {
				if (data && data.list && !data.error) {
					// 按数组顺序合并
					Object.assign(result.words, data.list);
					
					if (data.unitInfo) {
						result.unitInfo[unitId] = data.unitInfo;
					}
					
					if (data.fromRemote) {
						hasRemoteData = true;
					}
					
					console.log(`单元 ${unitId} 合并完成`);
				}
			});
	
			if (hasRemoteData) {
				result.fromRemote = true;
				result.fromCache = false;
			}
			
			console.log(`✅ 训练数据加载完成：从 ${unitIdArray.length} 个单元获取 ${Object.keys(result.words).length} 个单词`);
			callback(result);
	
		} catch (error) {
			console.error('训练数据加载错误:', error);
			callback({ error: true, words: {} });
		}
	},

	// 获取训练单词列表（带筛选选项）
	async getTrainingWordList(vgId, selectedUnits, options = {}) {
		return new Promise((resolve) => {
			const {
				wordCount = 20,
				shuffle = true,
				excludeWords = []
			} = options;
	
			this.getTrainingWordsData(vgId, selectedUnits, (result) => {
				if (result.error || Object.keys(result.words).length === 0) {
					resolve([]);
					return;
				}
	
				// 将对象转换为数组供页面使用
				let wordArray = Object.values(result.words);
				
				console.log('转换后的单词数组:', wordArray);
				
				// 排除指定单词
				if (excludeWords.length > 0) {
					//wordArray = wordArray.filter(word => !excludeWords.includes(word.wc_id));
				}
				
				// 随机打乱
				if (shuffle) {
					wordArray = this.shuffleArray(wordArray);
				}
				
				// 限制数量
				if (wordCount > 0 && wordArray.length > wordCount) {
					wordArray = wordArray.slice(0, wordCount);
				}
				
				console.log(`🎯 训练单词列表：从 ${Array.isArray(selectedUnits) ? selectedUnits.length : 1} 个单元筛选出 ${wordArray.length} 个单词`);
				resolve(wordArray);
			});
		});
	},

	// 预加载训练单元数据
	preloadTrainingUnits(vgId, unitIds) {
		const unitIdArray = Array.isArray(unitIds) ? unitIds : [unitIds];
		
		unitIdArray.forEach(unitId => {
			// 触发单元数据加载（如果缓存不存在会自动远程获取）
			this.getUnitData(vgId, unitId, (result) => {
				if (result.fromRemote) {
					console.log(`✅ 预加载单元 ${unitId} 完成`);
				}
			});
		});
	},
	// 生成训练干扰项
	generateTrainingDistractors(currentWord, allWords, distractorCount = 3) {
		const distractors = [];
		const usedWordIds = new Set([currentWord.word_id]);
		
		// 从所有单词中筛选可用的干扰项
		const availableWords = allWords.filter(word => 
			word.word_id !== currentWord.word_id && word.translate !== currentWord.translate && 
			!usedWordIds.has(word.word_id)
		);
		
		// 如果可用单词不足，使用重复干扰项
		if (availableWords.length < distractorCount) {
			console.warn('可用干扰项不足，将使用重复项');
			
			// 先添加所有可用的
			availableWords.forEach(word => {
				if (!usedWordIds.has(word.word_id)) {
					distractors.push(this.extractTrainingFields(word));
					usedWordIds.add(word.word_id);
				}
			});
			
			// 如果还不够，从已选的中重复
			const remainingNeeded = distractorCount - distractors.length;
			if (remainingNeeded > 0) {
				const backupWords = allWords.filter(word => 
					word.word_id !== currentWord.word_id
				);
				
				for (let i = 0; i < remainingNeeded && i < backupWords.length; i++) {
					const word = backupWords[i];
					if (!usedWordIds.has(word.word_id)) {
						distractors.push(this.extractTrainingFields(word));
						usedWordIds.add(word.word_id);
					}
				}
			}
		} else {
			// 正常情况：随机选择不重复的干扰项
			const shuffled = this.shuffleArray([...availableWords]);
			
			for (let i = 0; i < shuffled.length && distractors.length < distractorCount; i++) {
				const word = shuffled[i];
				if (!usedWordIds.has(word.word_id)) {
					distractors.push(this.extractTrainingFields(word));
					usedWordIds.add(word.word_id);
				}
			}
		}
		
		return distractors;
	},


	// ===================错词本/收藏本专用缓存方法=====================
	// 错词本/收藏本专用方法
	async getWordCollectionData(vgId, wordIds, callback) {
		try {
			const result = {
				words: [], // 单词数组
				missingWords: [], // 缺失的单词ID
				fromCache: true
			};

			let completedCount = 0;
			let hasRemoteData = false;

			// 先尝试从各单元缓存中查找
			const foundWords = [];
			const missingWordIds = [...wordIds];

			// 获取所有单元列表，用于搜索
			const unitList = await new Promise(resolve => {
				this.getUnitList(vgId, resolve);
			});

			// 并行搜索所有单元
			const searchPromises = unitList.map(unit => {
				return new Promise(resolve => {
					this.getUnitData(vgId, unit.category_id, (unitResult) => {
						if (unitResult && unitResult.list) {
							// 在当前单元中查找目标单词
							Object.values(unitResult.list).forEach(word => {
								const index = missingWordIds.indexOf(word.wc_id);
								if (index > -1) {
									foundWords.push(this.extractTrainingFields(word));
									missingWordIds.splice(index, 1);
								}
							});
						}
						resolve();
					});
				});
			});

			await Promise.all(searchPromises);

			result.words = foundWords;
			result.missingWords = missingWordIds;

			// 如果有缺失的单词，尝试通过单词ID直接获取
			if (missingWordIds.length > 0) {
				console.log(`有 ${missingWordIds.length} 个单词需要单独加载:`, missingWordIds);
				
				const missingWordsData = await this.fetchWordsByIds(vgId, missingWordIds);
				if (missingWordsData.length > 0) {
					result.words.push(...missingWordsData);
					result.fromRemote = true;
					hasRemoteData = true;
				}
			}

			if (hasRemoteData) {
				result.fromRemote = true;
				result.fromCache = false;
			}

			console.log(`✅ 单词集合加载完成：找到 ${result.words.length} 个单词，缺失 ${result.missingWords.length} 个`);
			callback(result);

		} catch (error) {
			console.error('单词集合数据加载错误:', error);
			callback({ error: true, words: [] });
		}
	},

	// 通过单词ID直接获取单词数据
	async fetchWordsByIds(vgId, wordIds) {
		return new Promise((resolve) => {
			const data = {
				vgId,
				wordIds: wordIds.join(','),
				dataType: 'basic' // 只获取基本信息
			};

			app.requestData('/word/getWordData', 'GET', data, 
				(res) => {
					if (res.data.changed && res.data.data) {
						const words = Object.values(res.data.data).map(word => 
							this.extractTrainingFields(word)
						);
						resolve(words);
					} else {
						resolve([]);
					}
				},
				(err) => {
					console.error('通过ID获取单词失败:', err);
					resolve([]);
				}
			);
		});
	},
	// 添加单词到错词本
	async addToErrorCollection(vgId, wordData, callback) {
		try {
			const { category_id, wc_id, word_id } = wordData;
			
			// 1. 调用后端接口添加错词
			const result = await this.callAddErrorWord(vgId, category_id, wc_id, word_id);
			
			if (result.success) {
				// 2. 更新本地缓存
				await this.addWordToCollectionCache(vgId, 'error', wordData);
				
				console.log(`✅ 已添加单词到错词本: ${wordData.word}`);
				callback({ success: true, action: 'add' });
			} else {
				callback({ error: true, message: '添加错词失败' });
			}
			
		} catch (error) {
			console.error('添加错词失败:', error);
			callback({ error: true });
		}
	},

	// 从错词本移除单词
	async removeFromErrorCollection(vgId, wc_id, callback) {
		try {
			// 1. 调用后端接口移除错词
			const result = await this.callRemoveErrorWord(wc_id);
			
			if (result.success) {
				// 2. 更新本地缓存
				await this.removeWordFromCollectionCache(vgId, 'error', wc_id);
				
				console.log(`✅ 已从错词本移除单词: ${wc_id}`);
				callback({ success: true, action: 'remove' });
			} else {
				callback({ error: true, message: '移除错词失败' });
			}
			
		} catch (error) {
			console.error('移除错词失败:', error);
			callback({ error: true });
		}
	},

	// 添加单词到收藏本
	async addToFavoriteCollection(vgId, wordData, callback) {
		try {
			const { category_id, wc_id, word_id } = wordData;
			
			// 1. 调用后端接口添加收藏
			const result = await this.callAddCollectWord(vgId, category_id, wc_id, word_id);
			
			if (result.success) {
				// 2. 更新本地缓存
				await this.addWordToCollectionCache(vgId, 'favorite', wordData);
				
				console.log(`✅ 已添加单词到收藏: ${wordData.word}`);
				callback({ success: true, action: 'add' });
			} else {
				callback({ error: true, message: '添加收藏失败' });
			}
			
		} catch (error) {
			console.error('添加收藏失败:', error);
			callback({ error: true });
		}
	},

	// 从收藏本移除单词
	async removeFromFavoriteCollection(vgId, wc_id, callback) {
		try {
			// 1. 调用后端接口移除收藏
			const result = await this.callRemoveCollectWord(wc_id);
			
			if (result.success) {
				// 2. 更新本地缓存
				await this.removeWordFromCollectionCache(vgId, 'favorite', wc_id);
				
				console.log(`✅ 已从收藏移除单词: ${wc_id}`);
				callback({ success: true, action: 'remove' });
			} else {
				callback({ error: true, message: '移除收藏失败' });
			}
			
		} catch (error) {
			console.error('移除收藏失败:', error);
			callback({ error: true });
		}
	},

	// 获取错词本数据（带缓存）
	async getErrorCollection(vgId, callback) {
		console.log('====aaaaaa0000=====');
		try {
			const cacheKey = CacheKeys.wordCollection(vgId, 'error');
			console.log('===cacheKey===',cacheKey);
			const localCache = wx.getStorageSync(cacheKey);
			console.log('===localCache===',localCache);
			// 先检查缓存是否有效
			if (localCache && localCache.words && this.isCacheValid(localCache)) {
				console.log('✅ 使用错词本缓存');
				callback({
					words: localCache.words,
					fromCache: true
				});
				return;
			}
			console.log('===aaaaaa1111===');
			// 缓存不存在或过期，从服务端获取
			const result = await this.callGetErrorWords(vgId);
			console.log('===result 2===',result);
			
			if (result.success && result.data.data && result.data.data.words) {
				const wordIds = result.data.data.words.map(item => item.wc_id);
				console.log('wordIds===',wordIds);
				// 获取单词详细信息
				this.getWordCollectionData(vgId, wordIds, (collectionResult) => {
					if (!collectionResult.error && collectionResult.words.length > 0) {
						// 更新缓存
						wx.setStorageSync(cacheKey, {
							words: collectionResult.words,
							wordIds: wordIds,
							timestamp: Date.now(),
							collectionType: 'error'
						});
						
						callback({
							words: collectionResult.words,
							fromRemote: true
						});
					} else {
						callback({ error: true, message: '获取单词详情失败' });
					}
				});
			} else {
				callback({ error: true, message: '获取错词列表失败' });
			}

		} catch (error) {
			console.error('获取错词本失败:', error);
			callback({ error: true, words: [] });
		}
	},
	// 获取收藏本数据（带缓存）
	async getFavoriteCollection(vgId, callback) {
		try {
			const cacheKey = CacheKeys.wordCollection(vgId, 'favorite');
			const localCache = wx.getStorageSync(cacheKey);

			// 先检查缓存是否有效
			if (localCache && localCache.words && this.isCacheValid(localCache)) {
				console.log('✅ 使用收藏本缓存');
				callback({
					words: localCache.words,
					fromCache: true
				});
				return;
			}

			// 缓存不存在或过期，从服务端获取
			const result = await this.callGetCollectWords(vgId);
			
			if (result.success && result.data.data && result.data.data.words) {
				const wordIds = result.data.data.words.map(item => item.wc_id);
				
				// 获取单词详细信息
				this.getWordCollectionData(vgId, wordIds, (collectionResult) => {
					if (!collectionResult.error && collectionResult.words.length > 0) {
						// 更新缓存
						wx.setStorageSync(cacheKey, {
							words: collectionResult.words,
							wordIds: wordIds,
							timestamp: Date.now(),
							collectionType: 'favorite'
						});
						
						callback({
							words: collectionResult.words,
							fromRemote: true
						});
					} else {
						callback({ error: true, message: '获取单词详情失败' });
					}
				});
			} else {
				callback({ error: true, message: '获取收藏列表失败' });
			}

		} catch (error) {
			console.error('获取收藏本失败:', error);
			callback({ error: true, words: [] });
		}
	},

	// ========== 缓存管理方法 ==========

	// 添加单词到集合缓存
	async addWordToCollectionCache(vgId, collectionType, wordData) {
		try {
			const cacheKey = CacheKeys.wordCollection(vgId, collectionType);
			const existingCache = wx.getStorageSync(cacheKey);
			
			let updatedWords = [];
			let updatedWordIds = [];

			if (existingCache && existingCache.words) {
				// 检查是否已存在，避免重复
				const existingIndex = existingCache.words.findIndex(
					word => word.wc_id === wordData.wc_id
				);
				
				if (existingIndex === -1) {
					// 不存在，添加到开头
					updatedWords = [this.extractTrainingFields(wordData), ...existingCache.words];
					updatedWordIds = [wordData.word_id, ...existingCache.wordIds];
				} else {
					// 已存在，更新数据
					updatedWords = [...existingCache.words];
					updatedWords[existingIndex] = this.extractTrainingFields(wordData);
					updatedWordIds = [...existingCache.wordIds];
				}
			} else {
				// 缓存不存在，创建新缓存
				updatedWords = [this.extractTrainingFields(wordData)];
				updatedWordIds = [wordData.word_id];
			}

			// 更新缓存
			wx.setStorageSync(cacheKey, {
				words: updatedWords,
				wordIds: updatedWordIds,
				timestamp: Date.now(),
				collectionType: collectionType
			});

			console.log(`✅ 已更新${collectionType}缓存`);
			return { success: true, words: updatedWords };

		} catch (error) {
			console.error(`更新${collectionType}缓存失败:`, error);
			return { error: true };
		}
	},

	// 从集合缓存移除单词
	async removeWordFromCollectionCache(vgId, collectionType, wc_id) {
		try {
			const cacheKey = CacheKeys.wordCollection(vgId, collectionType);
			const existingCache = wx.getStorageSync(cacheKey);
			
			if (!existingCache || !existingCache.words) {
				return { success: true, words: [] };
			}

			// 过滤掉要移除的单词
			const updatedWords = existingCache.words.filter(word => word.wc_id !== wc_id);
			const updatedWordIds = existingCache.wordIds.filter(id => {
				const word = existingCache.words.find(w => w.wc_id === wc_id);
				return word ? id !== word.word_id : true;
			});

			// 更新缓存
			wx.setStorageSync(cacheKey, {
				words: updatedWords,
				wordIds: updatedWordIds,
				timestamp: Date.now(),
				collectionType: collectionType
			});

			console.log(`✅ 已从${collectionType}缓存移除单词`);
			return { success: true, words: updatedWords };

		} catch (error) {
			console.error(`从${collectionType}缓存移除单词失败:`, error);
			return { error: true };
		}
	},

	// 检查缓存是否有效（例如1天内有效）
	isCacheValid(cache) {
		const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1天
		return Date.now() - cache.timestamp < CACHE_DURATION;
	},

	// ========== 后端接口调用方法 ==========

	// 调用添加错词接口
	callAddErrorWord(vgId, category_id, wc_id, word_id) {
		return new Promise((resolve) => {
			const data = {
				vgId: vgId,
				category_id,
				wc_id,
				word_id
			};
			
			app.requestData('/word/addErrorWord', 'POST', data, 
				(res) => {
					resolve({
						success: true,
						data: res.data
					});
				},
				(err) => {
					console.error('调用添加错词接口失败:', err);
					resolve({ success: false });
				}
			);
		});
	},

	// 调用移除错词接口
	callRemoveErrorWord(wc_id) {
		return new Promise((resolve) => {
			const data = {
				wc_id
			};
			
			app.requestData('/word/removewordError', 'POST', data, 
				(res) => {
					resolve({
						success: true,
						data: res.data
					});
				},
				(err) => {
					console.error('调用移除错词接口失败:', err);
					resolve({ success: false });
				}
			);
		});
	},

	// 调用添加收藏接口
	callAddCollectWord(vgId, category_id, wc_id, word_id) {
		return new Promise((resolve) => {
			const data = {
				vgId: vgId,
				category_id,
				wc_id,
				word_id
			};
			
			app.requestData('/word/addCollectWord', 'POST', data, 
				(res) => {
					resolve({
						success: true,
						data: res.data,
						action: res.data.result // 'add' 或 'del'
					});
				},
				(err) => {
					console.error('调用添加收藏接口失败:', err);
					resolve({ success: false });
				}
			);
		});
	},

	// 调用移除收藏接口
	callRemoveCollectWord(wc_id) {
		return new Promise((resolve) => {
			const data = {
				wc_id
			};
			
			app.requestData('/word/removewordCollect', 'POST', data, 
				(res) => {
					resolve({
						success: true,
						data: res.data
					});
				},
				(err) => {
					console.error('调用移除收藏接口失败:', err);
					resolve({ success: false });
				}
			);
		});
	},

	// 调用获取错词列表接口
	callGetErrorWords(vgId) {
		return new Promise((resolve) => {
			const data = {
				vgId: vgId
			};
			console.log('==get error words==',vgId);
			app.requestData('/word/getwordError', 'GET', data, 
				(res) => {
					console.log('====get error words list===',res.data);
					resolve({
						success: true,
						data: res.data
					});
				},
				(err) => {
					console.error('调用获取错词列表接口失败:', err);
					resolve({ success: false });
				}
			);
		});
	},

	// 调用获取收藏列表接口
	callGetCollectWords(vgId) {
		return new Promise((resolve) => {
			const data = {
				vgId: vgId
			};

			app.requestData('/word/getwordCollect', 'GET', data, 
				(res) => {
					console.log('====get error words list===',res.data);
					resolve({
						success: true,
						data: res.data
					});
				},
				(err) => {
					console.error('调用获取收藏列表接口失败:', err);
					resolve({ success: false });
				}
			);
		});
	}
};