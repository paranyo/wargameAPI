const { User, Sequelize: { Op } } = require('../models')
const auth   = require('../auth')
const crypto = require('crypto')
const { hashing } = require('../hashing')

const login = async (req, res, next) => {	// id = uid 바꿔야함
	const { id, pw } = req.body
	const user = await User.findOne({ where: { [Op.and]: [{ uid: id }, { password: hashing(pw) }] } })
	if(!user) return res.status(401).json({ error: '실패' })
	const accessToken   = auth.signToken(user.uid)
	if(user.level === 'chore') {
		const advancedToken = auth.signAdmin(user)
		return res.status(200).json({ accessToken, advancedToken, user })
	}
	return res.status(200).json({ accessToken, user })
}

const join = async (req, res, next) => { // id = uid, pw = password 나중에 바꿔야함 DB에 넣기 쉽게
	const { id, nick, pw } = req.body
	try {		// 이미 있는 id or nick
		const exUser = await User.find({ where: { [Op.or]: [{ uid: id }, { nick }], } })
		if(exUser)
			return res.status(401).json({ error: '이미 계정이 있습니다' })
		await User.create({ uid: id, nick, password: hashing(pw), ip: '127.0.0.1' }) // 유저 생성
		return res.status(200).json({ result: true })

	} catch (error) {
		console.error(error)
		return res.status(401).json({ error: '실패' })
	}
}

const getAll = async (req, res) => {
	let user = []
	try {
		if(req.user) {
			const authority = await User.find({ attributes: ['level'], where: { uid: req.user.id } })
			if(authority.dataValues.level == 'chore') { // 권한 레벨 chore면 전체 조회
				user = await User.findAll({ paranoid: false })
			} else {										// 아니면 어드민을 제외한 유저의 닉네임과 아이디 조회
				user = await User.findAll({ attributes: ['uid', 'nick', 'updatedAt'], where: { level: { [Op.ne]: 'chore' } } })
			}
		}
		return res.status(201).json(user) 
	} catch(e) {
		console.error(e)
		return res.status(401).json({ error: '실패' })
	}

}
const get = async (req, res) => {
	const { uid } = req.params
	if(!uid) res.status(401).json({ error: '실패' })
	const user   = await User.find({ attributes: ['uid', 'nick', 'money'], where: { uid } }, { paranoid: false })
	return res.status(201).json({ user })
}
const myInfo = async (req, res) => {

	const user   = await User.find({ attributes: ['uid', 'nick', 'money'], where: { uid: req.user.id } })
	return res.status(201).json({ user })
}
/* Need! */
/* 나중에 user.pw 등 랭크에 필요 없는 정보는 제거 후 표출하거나 디비단에서 받아오지 않아야 함*/
/* 일단 유저 이름과 레벨만 띄워주지만 이것도 나중에 점수 등으로 추가 정보를 보여주어야 함 */
/*
const getRank = async (req, res) => {
	let user = await User.find({ isBan: 0 })
	res.json({ user })
}
*/
const update = async (req, res) => {
	const { uid } = req.params
	const { nick, level, isBan } = req.body
	try {
		if(isBan !== undefined)
			if(isBan.toString() == 'false')		// isBan이 false면 밴 풀기
				User.restore({ where: { uid } })

		const user = await User.find({ uid })
		if(!user) return res.status(404).json({ error: '존재하지 않는 유저입니다' })
		
		await User.update({ uid, nick, level }, { where: { uid } })
		if(isBan !== undefined)
			if(isBan.toString() == 'true')
				User.destroy({ where: { uid } })

		return res.status(201).json({ result: '성공' })
	} catch(e) {
		console.error(e)
		return res.status(401).json({ error: '실패' })
	}
}

module.exports = {
	login, 
	join,
	get,
	getAll,
	update,
	myInfo
	/*getRank,*/
}
