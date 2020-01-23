const { Setting, Sequelize: { Op } } = require('../models')

const settings = {
	checkTime() {
		return  async (req, res, next) => {
			try {
				/*
				const StartTime = await Setting.findOne({ where: { name: 'StartCTF' }, attributes: ['value'] })
				if(new Date(StartTime.dataValues.value) > new Date())
					return res.status(403).json({ result: '대회 시작 시간이 아닙니다' })
				const EndTime = await Setting.findOne({ where: { name: 'EndCTF' }, attributes: ['value'] })
				if(new Date(EndTime.dataValues.value) < new Date())
					return res.status(403).json({ result: '대회가 종료되었습니다' })
				const EditTime = await Setting.findOne({ where: { name: 'EditCTF' }, attributes: ['value'] })
				if(EditTime.dataValues.value)
					return res.status(403).json({ result: '점검중입니다. 이용에 불편을 드려 죄송합니다.' })*/
				next()
			} catch (err) {
				console.errr(err)
				next()
			}
		}
	},
}

module.exports = settings
