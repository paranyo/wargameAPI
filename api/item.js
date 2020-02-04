const { User, Inventory, Item, Sequelize: { Op, Query }, sequelize } = require('../models')


const getItems = async (req, res) => {
	try {
		items = await Inventory.findAll({ where: { userId: req.user.id },
			include: [{ model: Item, required: true, attributes: ['name', 'cCode'], }]	
		})
		return res.status(201).json({ items })
	} catch (e) {
		console.error(e)
		return res.status(403).json({ error: '실패' })
	}
}

const equipItem = async (req, res) => {
	const { itemCode, cCode } = req.body
	const userId			 = req.params.uid
	let select = ''
	if(!userId || !itemCode || (userId !== req.user.id))
		return res.status(403).json({ result: '실패' })
		// 10, 13 상 하의 12 오버롤
	if(cCode == 12) {
		await Inventory.update({ isEquip: 0 }, { where: { cCode: { [Op.in]: [10, 13, cCode] }, userId } }).then(async () => { await Inventory.update({ isEquip: 1 }, { where: { itemCode: itemCode, userId } })	})
	} else if(cCode == 10 || cCode == 13) {
		await Inventory.update({ isEquip: 0 }, { where: { cCode: { [Op.in]: [12, cCode] }, userId } }).then(async () => { await Inventory.update({ isEquip: 1 }, { where: { itemCode: itemCode, userId } })	})
	} else {
		selected = await Item.findOne({ where: { id: itemCode }, attributes: ['cCode'] })
		await Inventory.update({ isEquip: 0 }, { where: { cCode: selected.dataValues.cCode, userId } }).then(async () => { await Inventory.update({ isEquip: 1 }, { where: { itemCode: itemCode, userId } }) })
	}
	let items = await Inventory.findAll({ where: { userId, isEquip: 1 }, attributes: ['itemCode']})
	return res.status(201).json({ items })
}

const clearEquip = async (req, res, next) => {
	if(!req.user.id)
		return res.status(403).json({ result: '실패' })
	let query = 'UPDATE inventories SET isEquip=0 WHERE userId=:userId AND isEquip=1 AND cCode!=99 AND itemCode > 100000';
	let values = { userId: req.user.id }
	await sequelize.query(query, { replacements: values }).spread((result, meta) => {
		return res.status(203).json({ result: '성공' })
	}, (err) => { next(err) })
}

const useBox = async (req, res) => {
	const { uid, id, idx } = req.body
	console.log(req.body)
	if(uid !== req.user.id || !id) return res.status(403).json({ result: '실패' })
	try {
		await Inventory.findOne({ where: { itemCode: req.body.id, userId: uid, id: idx } }).then(async (box) => {
			if(box) {
				let cCode;
				if(box.dataValues.itemCode == 5150000)			cCode = 1		// 헤어
				else if(box.dataValues.itemCode == 5152000)	cCode = 2		// 눈
				else if(box.dataValues.itemCode == 5680502)	cCode = 3		// 얼굴 장식
				else if(box.dataValues.itemCode == 2434838)	cCode = 4		// 눈 장식
				else if(box.dataValues.itemCode == 2434597)	cCode = 5		// 귀고리
				else if(box.dataValues.itemCode == 2630442)	cCode = 8		// 모자
				else if(box.dataValues.itemCode == 2439282)	cCode = 9		// 망토
				else if(box.dataValues.itemCode == 5069001)	cCode = 10	// 상의
				else if(box.dataValues.itemCode == 2434285)	cCode = 11	// 장갑
				else if(box.dataValues.itemCode == 2433080)	cCode = 12	// 한벌옷
				else if(box.dataValues.itemCode == 5069000)	cCode = 13	// 하의
				else if(box.dataValues.itemCode == 5530113)	cCode = 14	// 방패
				else if(box.dataValues.itemCode == 4001000)	cCode = 15	// 신발
				else if(box.dataValues.itemCode == 2431937)	cCode = 16	// 한손 무기
			//else if(box.dataValues.itemCode == 2431941)	cCode = 17	// 두손 무기
				else if(box.dataValues.itemCode == 2435004)	cCode = 18	// 의자
				else if(box.dataValues.itemCode	== 4000703) cCode = box.dataValues.itemCode	//
				else if(box.dataValues.itemCode	== 1162000) cCode = box.dataValues.itemCode	//
				else if(box.dataValues.itemCode	== 4031008) cCode = box.dataValues.itemCode	//
				else if(box.dataValues.itemCode	== 1322008) cCode = box.dataValues.itemCode	//
				else if(box.dataValues.itemCode	== 2028048) cCode = box.dataValues.itemCode	//
				else if(box.dataValues.itemCode	== 5830001) cCode = box.dataValues.itemCode	//
				else	return res.status(503).json({ result: '비정상 접근입니다.' })
				await box.destroy()
				if(cCode < 100) {
					await Item.findOne({ where: { cCode }, order: sequelize.random(), attributes: ['id', 'cCode'] })
						.then(async item => {
							await Inventory.create({ 
								isEquip: 0, itemCode: item.dataValues.id, cCode: item.dataValues.cCode, userId: uid 
							})
						})
				} else {
					/* 랜덤 머니 주는 곳이에요 */
					let money = 0
					if(cCode == 4000703)			money = Math.floor(Math.random() * 1000) * 10
					else if(cCode == 1162000) money = Math.floor(Math.random() * 150) * 1000
					else if(cCode == 4031008) money = Math.floor(Math.random() * 500) * 1000
					else if(cCode == 1322008) money = Math.floor(Math.random() * 500) * 10000
					else if(cCode == 2028048) money = Math.floor(Math.random() * 1000) * 10000
					else if(cCode == 5830001) money = Math.floor(Math.random() * 10000) * 10000

					if(money > 0) {
						await User.findOne({ where: { uid }, attributes: ['money', 'uid'] }).then(async (user) => {
							money += user.dataValues.money
							if(user) {
								await User.update({ money }, { where: { uid } })
							} else {
								return res.status(503).json({ result: '비정상 접근입니다.' })
							}
						})
					} else {
						return res.status(503).json({ result: '비정상 접근입니다.' })
					}	
				}
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
	clearEquip,
	useBox,
}
