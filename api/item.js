const { Item, Sequelize: { Op } } = require('../models')


const getItems = async (req, res) => {
	try {
		items = await Item.findAll()
		return res.status(201).json({ items })
	} catch (e) {
		console.error(e)
		return res.status(403).json({ error: '실패' })
	}
}

module.exports = {
	getItems
}
