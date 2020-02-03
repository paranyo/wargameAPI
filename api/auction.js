const { Auction, Bid, User, Inventory, Shop, Item, Sequelize: { Op, Query }, sequelize } = require('../models')
const schedule = require('node-schedule')

const bidding = async (req, res, next) => {
	const { id, cost } = req.body
	const uid	= req.user.id
	if(!id || !uid || !cost)
		return res.status(203).json({ result: false })
	const query = 'SELECT a.id, a.owner, itemId, end, a.createdAt, a.deletedAt, MAX(cost) as cost, a.price FROM auctions AS a LEFT JOIN bids ON bids.aId=a.id WHERE a.id=:id GROUP BY a.id' 
	const values = { id }
	const result = await sequelize.query(query, { replacements: values }).spread((result, meta) => {
		if(result[0].deletedAt !== null) return '종료된 상품은 입찰할 수 없습니다'
		if(result[0].price > cost) return '최소가보다 높게 입찰해야 합니다'
		if(result[0].cost >= cost) return '현재가보다 높게 입찰해야 합니다'
		if(result[0].owner === uid) return '등록자는 입찰할 수 없습니다'
		return false
	}, (err) => { console.error(err); next(err) })
	if(result !== false)
		return res.status(203).json({ result })
	// 경매 종료인데 입찰시
	try {
		await Bid.create({ aId: id, cost, bidder: uid })
		req.app.get('io').to('/auction').emit('bid', { id, cost, bidder: uid,	})
		return res.status(203).json({ result: true })
	} catch(e) {
		console.error(e)
		next(e)
	}
}

const get = async (req, res, next) => {
	try {
		const auction = await Auction.find({ where: { winner: null } })
		let query = 'SELECT a.id, a.price, a.end, a.createdAt, a.owner, a.itemId, i.itemCode, items.name, IC.name as cate, MAX(b.cost) as bid FROM auctions AS a LEFT JOIN inventories AS i ON i.id=a.itemId LEFT JOIN items ON i.itemCode=items.id LEFT JOIN itemCategories as IC ON items.cCode=IC.id LEFT JOIN bids as b ON a.id=b.aId WHERE a.winner IS null AND a.deletedAt IS null GROUP BY a.id'
		await sequelize.query(query).spread((result, meta) => {
			return res.status(203).json(result)
		}, (err) => { console.error(err); next(err) })
	} catch (e) {
		console.error(e)
		next(e)
	}
}

const create = async (req, res, next) => {
	const { price, end, itemId } = req.body
	try {
		const product 		= await Inventory.find({ where: { id: itemId } })
		if(product.dataValues.isEquip == 1) 
			return res.status(203).json({ result: '착용중인 아이템은 등록할 수 없습니다' })
		const auctionItem = await Auction.create({ price, end, owner: req.user.id, itemId })
												await Inventory.update({ userId: null }, { where: { id: auctionItem.itemId } })
		const endTime = new Date()
		endTime.setSeconds(endTime.getSeconds() + parseInt(auctionItem.end)) // endTime을 auctionItem.end분만큼 더함
		schedule.scheduleJob(endTime, async () => { // 스케쥴 실행 시간 설정
			// 경매에서 경매에 대한 정보를 업데이트 한다.
			const success = await Bid.find({ where: { aId: auctionItem.id } }, { order: [['cost', 'DESC']] }) // 경매중 cost가 가장 높은 row 리턴

			if(success) {
				await Auction.update({ winner: success.bidder }, { where: { id: success.aId } })
				await Auction.destroy({ where: { id: success.aId } })
				await User.update({ money: sequelize.literal(`money - ${success.cost}`) }, { where: { uid: success.bidder } }) // User의 money에서 해당 cost만큼 제거함.
				await User.update({ money: sequelize.literal(`money + ${success.cost}`) }, { where: { uid: auctionItem.owner } })
				await Inventory.update({ userId: success.bidder }, { where: { id: auctionItem.itemId } }) // Inventory에서 경매에 승리한 유저의 정보로 아이템의 오너를 바꿈
			} else {
				await Auction.destroy({ where: { id: auctionItem.id } })
				await Inventory.update({ userId: auctionItem.owner }, { where: { id: auctionItem.itemId } })
			}
			req.app.get('io').to('/auction').emit('endAuction', auctionItem)
		})
		req.app.get('io').to('/auction').emit('newAuction', auctionItem)
		return res.status(203).json({ result: '등록하였습니다' })
	} catch (e) {
		console.log('\n\n 에러 발생 \n\n')
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
	bidding,
	get,
	create,
	remove
}
