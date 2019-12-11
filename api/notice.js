const { Notice, User, Sequelize: { Op } } = require('../models')
const jwt = require('jsonwebtoken')

require('dotenv').config()

const get = async (req, res, next) => {
	let notice = []
	let uid		 = ''
	if(req.headers.authorization)
		uid  = jwt.verify(req.headers.authorization, process.env.JWT_SECRET)['id']
	try {
		let authority = ''
		if(uid !== '')
			authority = await User.findOne({ attributes: ['level'], where: { uid } })
		if(authority.dataValues.level == 'chore')
			notice = await Notice.findAll({ paranoid: false, attributes: ['id', 'title', 'description', 'createdAt', 'deletedAt', 'author'] })
		else
			notice = await Notice.findAll({ attributes: ['id', 'title', 'description', 'createdAt', 'author'] })
		return res.status(201).json(notice)
	} catch (e) {
		/* 에러 토쓰 */
		console.error(e)
		next(e)
	}
}


const create = async (req, res, next) => {
	const { title, description, isOpen } = req.body
	const author = req.user.id
	
	try {
		let deletedAt = null
		if(isOpen == false) deletedAt = new Date()
		const notice = await Notice.create({ title, description, deletedAt, author })

		return res.status(201).json({ result : 'true' })
	} catch (e) {
		/* 에러 토쓰 */
		console.error(e)
		next(e)
	}
}

const update = async (req, res, next) => {
	const { id, title, description } = req.body
	try {
		await Notice.update({ title, description }, { where: { id } })
		return res.status(201).json({ result: 'true' })
	}	catch (e) {
		console.error(e)
		next(e)
	}
}

const remove = async (req, res, next) => {
	try {
		await Notice.destroy({ where: { id: req.params.id } })
		return res.status(203).json({ result: 'true '})
	} catch (e) {
		console.error(e)
		next(e)
	}
}

module.exports = {
	get,
	create,
	update,
	remove
}
