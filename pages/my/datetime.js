const app = getApp();
Page({
  data: {
		recordlist:[],
		word_count:[],
		revise_count:[],
		exec_count:[],
    currentYear: 0,    // 当前显示的年份
		currentMonth: 0,   // 当前显示的月份
		currentDay: 0,   // 当前显示的月份
		currentIndex:0,
    weekDays: ['日', '一', '二', '三', '四', '五', '六'], // 星期标题
    prevMonthDays: [], // 上月需要显示的日期（占位）
    currentMonthDays: [], // 当月日期数据
    nextMonthDays: [], // 下月需要显示的日期（占位）
    todayDate: null,   // 今日日期（用于回显）
  },

  onLoad() {
    // 初始化：默认显示当前月
		const today = new Date();
    this.setData({
      todayDate: today,
      currentYear: today.getFullYear(),
      currentMonth: today.getMonth() + 1, // 注意：月份从0开始
    }, () => {
      this.renderCalendar(); // 渲染日历
		});
	},
	getDateTimeRecord: function(years,months){
		var data = {vgId: app.globalData.userVersion.vg_id,years:years,months:months};
		app.requestData('/word/getDateTimeRecord','GET', data, (res) => {
				if (res) {
					// 数据有更新	
					this.setData({
						recordlist: res.data.data.recordlist
					});
					this.updateCalendar();
					console.log('recordlist=',this.data.recordlist);
				}
				// 无更新时保持本地数据
			},
			(err) => {
				console.error('请求失败', err);
			}
		);
	},
	updateCalendar(){
		var currentMonthDays = this.data.currentMonthDays;
		const recordlist = this.data.recordlist;
		var word_count = [],revise_count=[],exec_count=[];
		console.log('recordlist=====',recordlist);
		for(let i in recordlist){
			var days = recordlist[i].days;
			word_count[days] = recordlist[i].word_count;
			revise_count[days] = recordlist[i].revise_count;
			exec_count[days] = recordlist[i].exec_count;
			currentMonthDays[days-1].isSelected=true;
			currentMonthDays[days-1].hasDot=true;
		}
		this.setData({
			currentMonthDays: currentMonthDays,
			word_count: word_count,
			revise_count: revise_count,
			exec_count:exec_count
		});
	},
  /**
   * 渲染日历核心逻辑
   * 1. 计算当月1号是星期几
   * 2. 补全上月需要显示的日期
   * 3. 计算当月总天数
   * 4. 补全下月需要显示的日期
   */
  renderCalendar() {
    const { currentYear, currentMonth } = this.data;
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1); // 当月1号
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);     // 当月最后一天
    const startWeekDay = firstDayOfMonth.getDay(); // 当月1号是星期几（0=周日）
    const totalDays = lastDayOfMonth.getDate();    // 当月总天数

    // 1. 处理上月日期（需要显示的上月日期数量 = startWeekDay）
    const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevMonthLastDay = new Date(prevMonthYear, prevMonth, 0).getDate(); // 上月总天数
    const prevMonthDays = [];
    for (let i = 0; i < startWeekDay; i++) {
      prevMonthDays.push(prevMonthLastDay - i);
    }
    // 数组反转（保证日期从大到小补全）
    prevMonthDays.reverse();

    // 2. 处理当月日期
    const currentMonthDays = [];
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(currentYear, currentMonth - 1, i);
      currentMonthDays.push({
        date: date,               // 完整日期对象
        day: i,                   // 日期数字
        isToday: this.isToday(date), // 是否是今日
        isSelected: false,        // 是否被选中（可扩展）
        hasDot: false,      // 标记点示例：偶数日期显示
      });
    }

    // 3. 处理下月日期（补全到7列 * n行）
    const nextMonthDays = [];
    const totalSlots = 6 * 7; // 最多显示6周（42天）
    const filledSlots = prevMonthDays.length + totalDays;
    const needNextDays = totalSlots - filledSlots;
    for (let i = 1; i <= needNextDays; i++) {
      nextMonthDays.push(i);
    }

    // 更新数据
    this.setData({
      prevMonthDays,
      currentMonthDays,
      nextMonthDays,
		});
		this.getDateTimeRecord(currentYear,currentMonth);
		console.log('currentMonthDays=',currentMonthDays);
  },

  /**
   * 判断是否是今日
   * @param {Date} date 要判断的日期
   */
  isToday(date) {
		const today = this.data.todayDate;
		this.setData({currentDay:today.getDate()});
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  },

  // 切换上月
  handlePrevMonth() {
    const { currentYear, currentMonth } = this.data;
    if (currentMonth === 1) {
      this.setData({
        currentYear: currentYear - 1,
        currentMonth: 12,
      }, () => this.renderCalendar());
    } else {
      this.setData({
        currentMonth: currentMonth - 1,
      }, () => this.renderCalendar());
    }
  },

  // 切换下月
  handleNextMonth() {
    const { currentYear, currentMonth } = this.data;
    if (currentMonth === 12) {
      this.setData({
        currentYear: currentYear + 1,
        currentMonth: 1,
      }, () => this.renderCalendar());
    } else {
      this.setData({
        currentMonth: currentMonth + 1,
      }, () => this.renderCalendar());
    }
  },

  // 回到今天
  handleToday() {
    const today = new Date();
    this.setData({
      currentYear: today.getFullYear(),
      currentMonth: today.getMonth() + 1,
    }, () => this.renderCalendar());
  },

  // 点击日期
  handleDayTap(e) {
		const { index } = e.currentTarget.dataset;
		if(this.data.currentMonthDays[index].isSelected==false) return;
		var date = this.data.currentMonthDays[index].date;
		let currentDay = date.getDate();
		// 可扩展：选中日期逻辑
		this.setData({currentDay:currentDay});
	},
	gowordrecord:function(){
		let url = "/pages/my/wordrecord?learn_time="+this.data.currentYear+"-"+this.data.currentMonth+"-"+this.data.currentDay;
		app.gotoPage(url);
	},
	goreviserecord:function(){
		let url = "/pages/my/wordrevise?learn_time="+this.data.currentYear+"-"+this.data.currentMonth+"-"+this.data.currentDay;
		app.gotoPage(url);
	},
	goexecrecord:function(){
		let url = "/pages/my/execrecord?learn_time="+this.data.currentYear+"-"+this.data.currentMonth+"-"+this.data.currentDay;
		app.gotoPage(url);
	}
});