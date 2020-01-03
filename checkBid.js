const { Auction, Bid, User, Inventories, sequelize } = require('./models')
const schedule = require('node-schedule')

module.exports = async (app) => {
	try {
		const targets = await Auction.findAll({ where: { winner: null } }) // 낙찰자가 없는 것
		targets.forEach(async (target) => {
			const endTime = new Date()
			endTime.setSeconds(endTime.getSeconds() + parseInt(target.end))
			if(new Date() > endTime) { // 경매 마감된 경우
				const success = await Bid.find({ where: { aId: target.id }, order: [['cost', 'DESC']] }) 
				if(success) {
					await Auction.update({ winner: success.bidder }, { where: { id: success.aId } })
					await Auction.destroy({ where: { id: success.aId } })
					await User.update({ money: sequelize.literal(`money - ${success.cost}`) }, { where: { id: success.bidder } })
					await Inventory.update({ userId: success.bidder }, { where: { id: target.itemId } })
				} else {	 // 낙찰자 없을 경우
					await Auction.destroy({ where: { id: success.aId } })
					await Inventory.update({ userId: target.owner }, { where: { id: target.itemId } })
				}
				app.get('io').to('/auction').emit('endAuction', { target })
			} else {		// 진행중인 경우
				schedule.scheduleJob(endTime, async () => { // 스케쥴 등록
					const success = await Bid.find({ where: { aId: target.id }, order: [['cost', 'DESC']] }) 
					if(success) {
						await Auction.update({ winner: success.bidder }, { where: { id: success.aId } })
						await Auction.destroy({ where: { id: success.aId } })
						await User.update({ money: sequelize.literal(`money - ${success.cost}`) }, { where: { uid: success.bidder } })
						await User.update({ money: sequelize.literal(`money + ${success.cost}`) }, { where: { uid: target.owner } })
						await Inventory.update({ userId: success.bidder }, { where: { id: target.itemId } })
					} else {	 // 낙찰자 없을 경우
						await Auction.destroy({ where: { id: target.id } })
						await Inventory.update({ userId: target.owner }, { where: { id: target.itemId } })
					}
					app.get('io').to('/auction').emit('endAuction', { target })
				})
			}
		})
	} catch (e) {
		console.error(e)
		next(e)
	}
}
