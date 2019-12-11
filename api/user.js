const { File, User, Notice, Prob, Auth, Inventory, Sequelize: { Op } } = require('../models')
const auth   = require('../auth')
const crypto = require('crypto')
const mime		= require('mime')
const path		= require('path')
const	fs			= require('fs')
const { hashing } = require('../hashing.js')
const nodemailer	= require('nodemailer')

require('dotenv').config()

const login = async (req, res, next) => {	// id = uid 바꿔야함
	const { id, pw } = req.body
	const user = await User.findOne({ where: { [Op.and]: [{ uid: id }, { password: pw }] } })
	if(!user) return res.status(401).json({ error: '실패' })
	const accessToken   = auth.signToken(user.uid)
	if(user.level === 'chore') {
		const advancedToken = auth.signAdmin(user)
		return res.status(200).json({ accessToken, advancedToken, user })
	}
	return res.status(200).json({ accessToken, user })
}

const join = async (req, res, next) => { // id = uid, pw = password 나중에 바꿔야함 DB에 넣기 쉽게
	const { id, nick, email, pw } = req.body
	try {		// 이미 있는 id or nick
		const exUser = await User.find({ where: { [Op.or]: [{ uid: id }, { nick }], } })
		if(exUser)
			return res.status(401).json({ error: '이미 계정이 있습니다' })
		await User.create({ uid: id, nick, email, password: pw, ip: '127.0.0.1' }) // 유저 생성
		await Inventory.create({ userId: id, isEquip: 1, itemCode: 30000, cCode: 1 })
		await Inventory.create({ userId: id, isEquip: 1, itemCode: 20000, cCode: 2 })
		return res.status(200).json({ result: true })

	} catch (error) {
		console.error(error)
		return res.status(401).json({ error: '실패' })
	}
}

const passwordGenerator = (len) => {
	let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNNOPQRSTUWXYZ1234567890!@#$%^&*()"
	let string = ""
	for(let i = 0; i < len; i++)
		string += chars.charAt(Math.floor(Math.random() * chars.length))
	return string
}

const sendMail = async (req, res, next) => {
	const { uid, email } = req.body
	try {
		const user = await User.find({ where : { uid, email } })
		if(user) {
			let transporter = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: process.env.MAIL_ID,
					pass:	process.env.MAIL_PW
				}
			})
			let newPW = passwordGenerator(12)
			let hashedPW = hashing(crypto.createHash('sha256').update(newPW).digest('hex'))

			await User.update({ password: hashedPW }, { where: { uid } })

			let mailOptions = {
				from: 'PARANYO GAMES',
				to: user.email,
				subject: '비밀번호 변경 메일입니다.',
				text: 'New Password: ' + newPW
			}
		
			transporter.sendMail(mailOptions, (error, info) => {
				if(error) console.error(error)
				else console.log('비밀번호 변경 메일을 보냈습니다 => ' + info.response)
			})
			return res.status(201).json({ result: '성공' })

		} else {
			return res.status(401).json({ error: '일치하는 계정이 없습니다.' })
		}
	} catch(error) {
		console.error(error)
		return res.status(500).json({ error: '뭐야?!' })
	}
}

const getNotice = async (req, res) => {
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

const getAll = async (req, res) => {
	let user = []
	try {
		if(req.user) {
			const authority = await User.find({ attributes: ['level'], where: { uid: req.user.id } })
			if(authority.dataValues.level == 'chore') { // 권한 레벨 chore면 전체 조회
				user = await User.findAll({	paranoid: false, 
					include: [
						{ model: Inventory, required: true, attributes: ['itemCode'], where: { isEquip: 1 } }
					],
				})
			} else {										// 아니면 어드민을 제외한 유저의 닉네임과 아이디 조회
				user = await User.findAll({
					attributes: ['uid', 'nick', 'updatedAt'], where: { level: { [Op.ne]: 'chore' } },
					include: [
						{ model: Inventory, required: true, attributes: ['itemCode'], where: { isEquip: 1 } }
					],
				})
			}
		}
		/*
		*	유저 스코어값 계산. sequleize 익숙해지면 sequelize 사용해서 계산할 것.
		*/

		for(let i = 0; i < user.length; i++) {
			try {
				user[i].dataValues.inventory = user[i].dataValues.inventories.map((i) => {
					return JSON.stringify({ itemId: i.dataValues.itemCode, region: "KMS", version: "323" })
				})
				delete user[i].dataValues.inventories
			} catch(e) {
				continue
			}
			const probs = await Auth.findAll({
				where: { solver: user[i].dataValues.uid, isCorrect: 1 },
				include: [
					{ model: Prob, required: true, attributes: ['score'] },
				],
				order: [[Prob, 'createdAt', 'ASC']]
			})
			try {
				user[i].dataValues.lastSolved = probs[0].dataValues.createdAt
			} catch(error) {
				user[i].dataValues.lastSolved = ''
				user[i].dataValues.score			= 0
				continue
			}
			user[i].dataValues.score = probs.reduce((s, n, i) => {
				return s + parseInt(n.dataValues.prob.dataValues.score)
			}, 0)
		}
		/* 
		*		스코어 내림차순
		*		스코어가 같을 경우엔 더 빨리 제출한 사람순
		*/
		user = user.sort((a, b) => {
			if(b.dataValues.score !== a.dataValues.score)
				 return b.dataValues.score - a.dataValues.score
			else
				return a.dataValues.lastSolved - b.dataValues.lastSolved
		})
		return res.status(201).json(user)
	} catch(e) {
		console.error(e)
		return res.status(401).json({ error: '실패' })
	}

}
const get = async (req, res) => {
	const { uid } = req.params
	let user
	let userId
	let opt = {}
	if(!uid) {
		if(!req.user)
			return res.status(401).json({ error: '실패' })
		else
			userId = req.user.id
	} else {
		userId = uid
		opt = { paranoid: false }
	}
		user = await User.find({ 
			attributes: ['uid', 'nick', 'money', 'level', 'ip', 'email', 'intro'], 
			where: { uid: userId } 
		}, opt)

	/* getUserScore */
	const scores = await Auth.findAll({
		where: { solver: userId, isCorrect: 1 },
		include: [
			{ model: Prob, required: true, attributes: ['score'] }
		],
	})
	user.dataValues.score = scores.reduce((sum, n, i) => {
		return sum + parseInt(n.dataValues.prob.dataValues.score)
	}, 0)

	/* getUserInventory */
	const items = await Inventory.findAll({
		where: { userId, isEquip: 1 }, attributes: ['itemCode', 'cCode']
	})
	user.dataValues.items = items
	return res.status(201).json({ user })
}
/* Need! */
/* 나중에 user.pw 등 랭크에 필요 없는 정보는 제거 후 표출하거나 디비단에서 받아오지 않아야 함*/
/* 일단 유저 이름과 레벨만 띄워주지만 이것도 나중에 점수 등으로 추가 정보를 보여주어야 함 */

const update = async (req, res) => {
	const uid = req.params.uid
	const { pw, nick, email, level, isBan, ip, money, reason, intro } = req.body

	/* req.body 검증할 것!! 나중에 곢!!! */
	try {
		if(isBan !== undefined) {
			if(isBan.toString() == 'false')		// isBan이 false면 밴 풀기
				await User.restore({ where: { uid } })
			else if(isBan.toString() == 'true')
				await User.destroy({ where: { uid } })
		} else if(pw !== undefined && reason !== undefined) {
			/* 비밀번호 변경 로직 */
			const currentPW = pw
			const newPW			= hashing(reason)
			const user = await User.find({ where: { uid, password: currentPW } })
			if(user) {
				await User.update({ password: newPW }, { where: { uid } })
				return res.status(201).json({ result: '성공' })
			} else {
				return res.status(401).json({ result: '현재 비밀번호가 일치하지 않습니다.' })
			}
		} else {
			const user = await User.find({ uid })
			if(!user) return res.status(404).json({ error: '존재하지 않는 유저입니다' })
			await User.update(req.body, { where: { uid } })
		}
		return res.status(201).json({ result: '성공' })
	} catch(e) {
		console.error(e)
		return res.status(401).json({ error: '실패' })
	}
}

const downloadFile = async (req, res, next) => {
	const { fName } = req.params
	try {
		let file		 = '/workspace/wargame/back/public/files/' + fName
		res.setHeader('Content-disposition', 'attachment; filename=' + fName )
    let filestream = fs.createReadStream(file)
    filestream.pipe(res)
	} catch(e) {
		console.error(e)
		next(e)
	}
}


module.exports = {
	login, 
	join,
	get,
	getAll,
	update,
	sendMail,
	getNotice,
	downloadFile,
}
