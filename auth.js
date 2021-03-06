require('dotenv').config()
const jwt		 = require('jsonwebtoken')
const secret = process.env.JWT_SECRET
const expiresIn = 3600 * 3
const { User } = require('./models')

const auth = {
	signToken(id) {
		return jwt.sign({ id }, secret, { expiresIn })
	},
	signAdmin(user) {
		return jwt.sign({ id: user.uid, slaver: 'true' } , secret, { expiresIn })
	},
	ensureAuth(type) {
		return async (req, res, next) => {
			const { authorization } = req.headers
			if(!authorization) {
				res.status(401)
				throw Error('No Authorization Headers')
			}
			if(type === 'admin') {
				try {
					req.user = this.verify(authorization)
					const authority = await User.find({ attributes: ['level'], where: { uid: req.user.id } })
					if(authority.dataValues.level === 'chore') {
						next()
					} else {
						return res.status(401).json({ error: '비허가 행동' })
					}
				} catch (e) {
					res.status(401).json({ result: '연동 실패' })
					throw e
				}
			} else {
				try {
					req.user = this.verify(authorization)
				} catch (e) {
					res.status(401).json({ result: '연동 실패' })
					throw e
				}
				next()
			}
		}
	},
	verify(token) {
		try {
			return jwt.verify(token, secret)
		} catch(e) {
			console.error(e)
		}
	}
}

module.exports = auth
