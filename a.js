const schedule = require('node-schedule')

const end = new Date()

end.setSeconds(end.getSeconds() + 5)
console.log(new Date())
const j = schedule.scheduleJob(end, () => {
	console.log(new Date() + '1분 지남')
})
