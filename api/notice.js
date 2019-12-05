const { Notice, Sequelize: { Op } } = require('../models')

const get = async (req, res) => {
	let notice = []
	try {
		notice = await Notice.findAll({ paranoid: false })
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

module.exports = {
	get,
	create,
}
