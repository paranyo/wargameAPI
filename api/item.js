const { Inventory, Item, Sequelize: { Op } } = require('../models')


const getItems = async (req, res) => {
	try {
		items = await Inventory.findAll({ 
			include: [{ model: Item, required: true, attributes: ['name', 'cCode'], }]	
		})
		return res.status(201).json({ items })
	} catch (e) {
		console.error(e)
		return res.status(403).json({ error: '실패' })
	}
}

const equipItem = async (req, res) => {
	const { itemCode } = req.body
	console.log(itemCode)
	let selected = await Item.findOne({ where: { id: itemCode }, attributes: ['cCode'] })
	console.log(selected.dataValues)
	await Inventory.update({ 
		isEquip: 0, userId: req.user.id }, { where: selected.dataValues 
	}).then(async () => {
		await Inventory.update({ isEquip: 1, userId: req.user.id }, { where: { itemCode: itemCode }})
	})
	
	let items = await Inventory.findAll({ where: { userId: req.user.id, isEquip: 1 }, attributes: ['itemCode']})
	return res.status(201).json({ items })
}

module.exports = {
	getItems,
	equipItem,
}
