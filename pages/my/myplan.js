const app = getApp();
Page({
  data: {
		taskTitle: "每日任务",
		totalwordCount:300,
    currentIndex: 0, // 默认选中第2个选项（10词）
    // 生成从5到50，间隔5的词汇量选项
    taskOptions: [],
		expectedDate: "--年--月--日",
		rage:[1,2,3],
		rageIndex:0,
		isShowPopup:false
  },
  
  onLoad() {
    var userVersion = app.globalData.userVersion;
    var totalwordCount = userVersion.wordscount;
    var index = (userVersion.plan_revise_count/userVersion.plan_word_count)-1;
    var optionIndex = (userVersion.plan_word_count/5)-1;
    console.log('==userVersion==',userVersion);
    console.log('==index==',optionIndex);
    this.setData({
      totalwordCount:totalwordCount,
      rageIndex:index,
      currentIndex:optionIndex
    },()=>{
      this.generateTaskOptions();
    });
	},
	saveplan: function(){
		const {vgId,taskOptions,currentIndex} = this.data;
		var plan_word_count = taskOptions[currentIndex].newWord;
		var plan_revise_count = taskOptions[currentIndex].reviewWord;
		var days = taskOptions[currentIndex].needDay;
		var data = {vgId: vgId, plan_word_count: plan_word_count, plan_revise_count: plan_revise_count};
		app.requestData('/user/savePlan','POST', data,(res) => {
        if(res.data.data.status=='success'){
          var userVersion = app.globalData.userVersion;
          userVersion.plan_word_count = plan_word_count;
          userVersion.plan_revise_count = plan_revise_count;
          app.globalData.userVersion = userVersion;
          wx.setStorageSync('userVersion', userVersion);
          app.emit('userVersionUpdated', {
            ...userVersion,
            _forceUpdate: Date.now() // 确保每次都是新对象
          });
          app.gotoBack();
        }
			},
			(err) => {
			}
		);
	},
	//修改比例
	changeRage: function(e){
		let index = e.currentTarget.dataset.index;
		this.setData({ rageIndex: index });
		this.generateTaskOptions();
		this.closePopup();
	},
  // 生成任务选项
  generateTaskOptions() {
		const {rage,rageIndex,totalwordCount} = this.data;
    const options = [];
    for (let i = 5; i <= 50; i += 5) {
      options.push({
        newWord: i,
        reviewWord: i*rage[rageIndex],
        needDay: Math.ceil(totalwordCount / i) // 简单计算：总词数300 ÷ 每日词数
      });
    }
		this.setData({ taskOptions: options },()=>{
      this.updateExpectedDate(this.data.currentIndex);
    });
  },
  
  // 选择器滚动事件
  onPickerChange(e) {
    const index = e.detail.value;
    this.setData({ currentIndex: index });
    // 更新预计完成日期（实际项目中可能需要根据选择计算）
    this.updateExpectedDate(index);
  },
  
  // 更新预计完成日期（示例逻辑）
  updateExpectedDate(index) {
    const selectedOption = this.data.taskOptions[index];
    const today = new Date();
    today.setDate(today.getDate() + selectedOption.needDay);
    
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    this.setData({
      expectedDate: `${year}年${month}月${day}日`
    });
	},
	// 打开弹窗
  showPopup() {
    this.setData({ isShowPopup: !this.data.isShowPopup });
  },
	// 关闭弹窗
  closePopup() {
    this.setData({ isShowPopup: false });
  },
	// 空事件（用于阻止冒泡）
  noop() {}
});