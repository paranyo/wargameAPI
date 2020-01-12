const { Log, Sequelize: { Op } } = require('../models')
const { hashing } = require('../hashing')

const log = {
	logging() {
		return async (req, res, next) => {

			const ipAddress	= req.headers['x-forwarded-for']
			const userAgent	= req.headers['user-agent']
			const referer		=	req.headers['referer']
			const token			=	req.headers['authorization']
			if(req.body.pw)
				req.body.pw = hashing(req.body.pw)
	//		else if(req.body.flag)
		//		req.body.flag = hashing(req.body.flag)

			const data = JSON.stringify(req.body)

			const url				= req.url
			const method		= req.method
			
			try {
				let log = await Log.create({ ipAddress, userAgent, referer, token, data, url, method })
				next()
			} catch(error) {
				console.error(error)
				next(error)
			}
		}
	}
}

module.exports = log
