const { Notice, Auth, Log, Sequelize: { Op } } = require('../models')

const getHash = (req, res, next) => {
	const { flag } = req.body
	if(flag)
		return res.status(201).json({ flag: flag })
}

const getLog = async (req, res, next) => {
	const { type } = req.body
	try {
		let logs
		if(type == 'auth')
			logs = await Auth.findAll()
		else if(type == 'all')
			logs = await Log.findAll()
		return res.status(201).json({ logs })
	} catch(e) {
		console.error(e)
		next(e)
	}
}

module.exports = {
	getHash,
	getLog,
}
