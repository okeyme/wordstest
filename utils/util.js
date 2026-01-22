
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function recordTime(date) {

  /*var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
	var minute = date.getMinutes()*/

	var currentTime = new Date();
	var year = currentTime.getFullYear();
	var month = currentTime.getMonth() + 1; // 月份从0开始，因此需要加1
	var day = currentTime.getDate();
	var hour = currentTime.getHours();
	var minute = currentTime.getMinutes();
	var second = currentTime.getSeconds();

  return [month, day].map(formatNumber).join('/') + ' ' + [hour, minute].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

//计算时间戳的时间差，转换为分秒
function getTimeDifference(timestamp1, timestamp2) {
  const diff = timestamp2 - timestamp1; // 时间差（毫秒）
  const seconds = Math.floor(diff / 1000); // 转换为秒
  const minutes = Math.floor(seconds / 60); // 转换为分钟
  const remainingSeconds = seconds % 60; // 分钟余数的秒数
  return minutes+'分'+remainingSeconds+'秒';
  /*return {
    minutes: minutes,
    seconds: remainingSeconds
  };*/
}
//数组乱序
function shuffleArray(array){
	array.sort(() => Math.random() - 0.5);
  	return array;
}
//从数组中随机取对应数量的元素
function getRandomElements(arr, count) {
	const shuffled = [...arr].sort(() => 0.5 - Math.random());
  	return shuffled.slice(0, count);
}

//小写转大写
function strtoUpperCase(str){
	return str.toUpperCase();
}

module.exports = {
  formatTime: formatTime,
  recordTime: recordTime,
  shuffleArray: shuffleArray,
	getRandomElements: getRandomElements,
	getTimeDifference: getTimeDifference,
}
