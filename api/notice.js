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
		if(uid != '') {
			authority = await User.findOne({ attributes: ['level'], where: { uid } })
			if(authority.dataValues.level == 'chore') 
				notice = await Notice.findAll({ paranoid: false, attributes: ['id', 'title', 'description', 'createdAt', 'deletedAt', 'author'] })
			else
				notice = await Notice.findAll({ attributes: ['id', 'title', 'description', 'createdAt', 'author'] })
		} else {
			notice = await Notice.findAll({ attributes: ['id', 'title', 'description', 'createdAt', 'author'] })
		}
		return res.status(201).json(notice)
	} catch (e) {
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
		next(e)
	}
}

const update = async (req, res, next) => {
	const { id, title, description, isOpen } = req.body
	try {
		if(isOpen == true)
			await Notice.restore({ where: { id } })
		const notice = await Notice.findOne({ where: { id }, paranoid: false })
		if(!notice) return res.status(404).json({ result: '존재하지 않는 게시글입니다.' })
		await Notice.update({ title, description }, { where: { id }, paranoid: false })
		if(isOpen == false)
			await Notice.destroy({ where: { id } })
		return res.status(201).json({ result: 'true' })
	}	catch (e) {
		console.error(e)
		next(e)
	}
}


module.exports = {
	get,
	create,
	update,
}
