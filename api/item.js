const { Inventory, Item, Sequelize: { Op }, sequelize } = require('../models')


const getItems = async (req, res) => {
	const { uid } = req.params
	if(uid !== req.user.id) 
		return res.status(403).json({ error: '실패' })
	try {
		items = await Inventory.findAll({ where: { userId: uid },
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
	const userId			 = req.params.uid
	if(!userId || !itemCode || (userId !== req.user.id))
		return res.status(403).json({ result: '실패' })
	let selected = await Item.findOne({ where: { id: itemCode }, attributes: ['cCode'] })
	await Inventory.update({ isEquip: 0 }, { where: { cCode: selected.dataValues.cCode, userId }
	}).then(async () => {
		await Inventory.update({ isEquip: 1 }, { where: { itemCode: itemCode, userId } })
	})
	
	let items = await Inventory.findAll({ where: { userId, isEquip: 1 }, attributes: ['itemCode']})
	return res.status(201).json({ items })
}

const useBox = async (req, res) => {
	const { uid, id, idx } = req.body
	if(uid !== req.user.id || !id) return res.status(403).json({ result: '실패' })
	try {
		await Inventory.findOne({ where: { itemCode: req.body.id, userId: uid, id: idx } }).then(async (box) => {
			if(box) {
				let cCode;
				if(box.dataValues.itemCode == 5150000)			cCode = 1
				else if(box.dataValues.itemCode == 5152000)	cCode = 2
				else	return res.status(503).json({ result: '비정상 접근입니다.' })
				await box.destroy()
				await Item.findOne({ where: { cCode }, order: sequelize.random(), attributes: ['id', 'cCode'] })
					.then(async item => {
						await Inventory.create({ 
							isEquip: 0, itemCode: item.dataValues.id, cCode: item.dataValues.cCode, userId: uid 
						})
					})
				return res.status(201).json({ result: 'true' })
			}
			else {
				return res.status(503).json({ result: '비정상 접근입니다.' })
			}
		})
	} catch (error) {
		console.error(error)
		res.status(403).json({ result: '실패' })
	}
}

module.exports = {
	getItems,
	equipItem,
	useBox,
}
