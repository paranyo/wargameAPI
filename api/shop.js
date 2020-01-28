const { User, Inventory, Shop, Item, Sequelize: { Op, Query }, sequelize } = require('../models')

const buy = async (req, res, next) => {
	const { pId } = req.params
	const uid	= req.user.id
	if(!pId || !uid)
		return res.status(203).json({ result: '구매 실패' })
	try {
		const { price, pdCount, deadLine, pdCode } = await Shop.find({ where: { id: pId } })
		const { money }	= await User.find({ where: { uid } })
		const { cCode }	= await Item.find({ where: { id: pdCode } })

		if(deadLine <= new Date()) 	return res.status(203).json({ result: '구매 가능한 기간이 아닙니다' })
		if(pdCount < 1)								return res.status(203).json({ result: '재고가 없습니다' })
		if(money < price)							return res.status(203).json({ result: '소지금이 부족합니다' })

		await Shop.update({ pdCount: pdCount - 1 }, { where: { id: pId } })
		await User.update({ money: money - price }, { where: {   uid   } })
		await Inventory.create({ isEquip: 0, itemCode: pdCode, cCode, userId: uid })
		return res.status(203).json({ result: true })
	} catch(e) {
		console.error(e)
		next(e)
	}
}

const getProduct = async (req, res, next) => {
	if(!req.params.id)
		return res.status(403).json({ result: false })
	let query = 'SELECT S.id as idx, I.name, I.id, S.price, S.pdCount, S.description, S.createdAt, S.deadLine, S.deadLine FROM shops as S INNER JOIN items as I ON I.id=S.pdCode WHERE S.id=:id ANS S.deletedAt IS NULL'
	let values = { id: req.params.id }
	await sequelize.query(query, { replacements: values }).spread((result, meta) => {
		return res.status(201).json({ shop: result[0] })
	}, (err) => { console.error(err); next(err) })
}

const get = async (req, res, next) => {
	let query = 'SELECT S.id as idx, I.name, I.id, S.price, S.pdCount, S.description, S.createdAt, S.deadLine, S.deadLine FROM shops as S INNER JOIN items as I ON I.id=S.pdCode WHERE S.deletedAt IS NULL'
	await sequelize.query(query).spread((result, meta) => {
		return res.status(201).json({ shop: result })
	}, (err) => { console.error(err); next(err) })
}
const getItems = async (req, res, next) => {
	try {
		let shopItems = await Item.findAll({ where: { cCode: 99 } })
		return res.status(201).json(shopItems)
	} catch(err) {
		next(err)
	}
}
const create = async (req, res, next) => {
	const { pdCode, price, pdCount, description, deadLine } = req.body
	try {
		if(pdCount > -1) {
			await Shop.create({ pdCode, price, pdCount, description, deadLine })
			return res.status(201).json({ result: true })
		}
	} catch (e) {
		console.error(e)
		next(e)
	}
}
const update = async (req, res, next) => {
	const { id } = req.params
	try {
		await Shop.update(req.body, { where: { id } })
		return res.status(201).json({ result: true })
	}	catch (e) {
		console.error(e)
		next(e)
	}
}
const remove = async (req, res, next) => {
	const { id } = req.params
	try {
		if(!id) return res.status(403).json({ result: false })
		await Shop.destroy({ where: { id: req.params.id } })
		return res.status(203).json({ result: true })
	} catch (e) {
		console.error(e)
		next(e)
	}
}

module.exports = {
	buy,
	getProduct,
	get,
	getItems,
	create,
	update,
	remove
}
