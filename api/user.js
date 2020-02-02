const { Tag, File, User, Notice, Prob, Auth, Inventory, Sequelize: { Op }, sequelize } = require('../models')
const auth   = require('../auth')
const crypto = require('crypto')
const mime		= require('mime')
const path		= require('path')
const	fs			= require('fs')
const { hashing } = require('../hashing.js')
const nodemailer	= require('nodemailer')

require('dotenv').config()

const login = async (req, res, next) => {	// id = uid 바꿔야함
	let query = 'SELECT uid, deletedAt, level FROM users WHERE uid=:id AND password=:pw'
	let values = { id: req.body.id, pw: req.body.pw }
	const user = await sequelize.query(query, { replacements: values }).spread((result, meta) => {
		return result[0]
	})
	if(user.deletedAt != null) return res.status(401).json({ error: '차단된 계정: ' + user.deletedAt.toISOString().replace('T', ' ').substring(2, 19) + ' ~ 무기한' })
	if(!user) return res.status(401).json({ error: '실패' })
	const accessToken   = auth.signToken(user.uid)
	if(user.level === 'chore') {
		const advancedToken = auth.signAdmin(user)
		const isAdmin	= true
		return res.status(200).json({ accessToken, advancedToken, user, isAdmin })
	}
	return res.status(200).json({ accessToken, user })
}

const join = async (req, res, next) => { // id = uid, pw = password 나중에 바꿔야함 DB에 넣기 쉽게
	const { id, nick, email, pw } = req.body
	let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'No Data'
	ip = ip.split(',')[0]
	try {		// 이미 있는 id or nick
		const exUser = await User.find({ where: { [Op.or]: [{ uid: id }, { nick }], } })
		if(exUser)
			return res.status(401).json({ error: '이미 계정이 있습니다' })
		await User.create({ uid: id, nick, email, password: pw, ip: ip }) // 유저 생성
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

			let mailOptions = {
				from: 'PARANYO GAMES',
				to: user.email,
				subject: '비밀번호 변경 메일입니다.',
				text: 'New Password: ' + newPW
			}
		
			transporter.sendMail(mailOptions, async (error, info) => {
				if(error) next(error)
				else {
					console.log('비밀번호 변경 메일을 보냈습니다 => ' + info.response)
					await User.update({ password: hashedPW }, { where: { uid } })
				}
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

const getRanking = async (req, res) => {
	let user = []
	try {
		let query = 'SELECT u.uid, u.nick, u.intro, SUM(p.score) AS score, MAX(a.createdAt) as lastSolved FROM users AS u LEFT JOIN auths AS a ON u.uid = a.solver LEFT JOIN probs AS p ON p.id=a.pid WHERE a.isCorrect=1'
		if(req.user) {
			const authority = await User.find({ attributes: ['level'], where: { uid: req.user.id } })
			if(authority.dataValues.level != 'chore')
				query += ' AND u.deletedAt IS NULL'
		}
		query += ' GROUP BY u.uid ORDER BY score DESC'
		user = await sequelize.query(query).spread((result, meta) => {
			return result
		}, (err) => { console.error(err); next(err); })
		let userItem = await User.findAll({ paranoid: false, attributes: ['uid'],
			include: [
				{ model: Inventory, required: true, attributes: ['itemCode'], where: { isEquip: 1 } }	
			]
		})

		userItem.map(u => { 
			for(let i = 0; i < user.length; i++) {
				if(user[i].uid == u.dataValues.uid) {
					user[i].inventory = u.dataValues.inventories.map(i => {
						return JSON.stringify({ itemId: i.dataValues.itemCode, region: "KMS", version: "323" })
					})
					break
				}
			}
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

/* 모든 유저의 정보를 가져온다. */
const getUsers = async (req, res, next) => {
	try {
		const authority = await User.find({ attributes: ['level'], where: { uid: req.user.id } })
		if(authority.dataValues.level == 'chore') {
			const users = await User.findAll({ paranoid: false })
			let query = 'SELECT u.uid, SUM(p.score) AS score FROM users AS u LEFT JOIN auths AS a ON u.uid = a.solver LEFT JOIN probs AS p ON p.id=a.pid WHERE a.isCorrect=1 GROUP BY u.uid'
			const scores = await sequelize.query(query).spread((result, meta) => { return result }, (err) => { next(err) })
			users.map(u => { return u.dataValues.score = 0 })
			for(let i = 0; i < users.length; i++) {
				for(let j = 0; j < scores.length; j++) {
					if(scores[j].uid == users[i].dataValues.uid) {
						users[i].dataValues.score = scores[j].score
					}
				}
			}
			return res.status(201).json({ users })
		} else {
			return res.status(403).json({ message: 'Access deny' })
		}
	} catch(err) {
		console.error(err)
		next(err)	
	}
}

const getCorrect = async (req, res, next) => {
	try {
		/*const user = await Auth.findAll({ where: { solver: id, isCorrect: 1 }, attributes: ['id', 'createdAt'],
			include: [
				{ model: Prob, required: true, attributes: ['id', 'title', 'description', 'src', 'score', 'createdAt', 'author', 'tagId', 'fileId'] },
			] 
		})
		return res.status(201).json({ user }) */
		let query = 'SELECT a.id, p.title, p.score, p.id AS pid, t.title AS tag, a.createdAt FROM auths AS a LEFT JOIN probs AS p ON a.pid=p.id LEFT JOIN tags as t ON t.id=p.tagId WHERE a.solver=:solver AND isCorrect=1'
		let values = { solver: req.user.id  }
		await sequelize.query(query, { replacements: values }).spread((result, meta) => {
			return res.status(201).json({ user: result })
		}, (err) => { console.error(err); next(err) })
	} catch (e) {
		console.error(e)
		next(e)
	}
}
/* Need! */
/* 나중에 user.pw 등 랭크에 필요 없는 정보는 제거 후 표출하거나 디비단에서 받아오지 않아야 함*/
/* 일단 유저 이름과 레벨만 띄워주지만 이것도 나중에 점수 등으로 추가 정보를 보여주어야 함 */

const update = async (req, res) => {
	const uid = req.params.uid
	const { email, intro, money, level, isBan } = req.body
	if(intro.length > 32) {
		return res.status(403).json({ message: 'intro는 32글자를 초과할 수 없습니다.' })
	}
	/* req.body 검증할 것!! 나중에 곢!!! */
	try {
		if(isBan !== undefined) {
			if(isBan == false)		// isBan이 false면 밴 풀기
				await User.restore({ where: { uid } })
			else if(isBan == true)
				await User.destroy({ where: { uid } })
		}/*
		if(pw !== undefined && reason !== undefined) {
			// 비밀번호 변경 로직
			const currentPW = pw
			const newPW			= hashing(reason)
			const user = await User.find({ where: { uid, password: currentPW } })
			if(user) {
				await User.update({ password: newPW }, { where: { uid } })
				return res.status(201).json({ result: '성공' })
			} else {
				return res.status(401).json({ result: '현재 비밀번호가 일치하지 않습니다.' })
			}*/
		const user = await User.find({ paranoid: false, where : { uid } })
		if(!user) return res.status(404).json({ error: '존재하지 않는 유저입니다' })
		await User.update(req.body, { paranoid: false, where: { uid } })

		return res.status(201).json({ result: '성공' })
	} catch(e) {
		console.error(e)
		return res.status(401).json({ error: '실패' })
	}
}

const updateSelf = async (req, res, next) => {
	const { curPW, newPW, intro } = req.body
	if(!req.user.id)
		return res.status(403).json({ message: '실패' })
	if(intro.length > 32)
		return res.status(403).json({ message: 'intro의 길이는 최대 32글자입니다.' })
	try {
		const user = await User.findOne({ where: { uid: req.user.id } })
		if(!user)
			return res.status(404).json({ message: '찾을 수 없습니다.' })
		if(curPW !== undefined && newPW !== undefined) {
			const user = await User.findOne({ where: { uid: req.user.id, password: hashing(curPW) } })
			if(!user)
				return res.status(404).json({ message: '비밀번호가 일치하지 않습니다.' })
			await User.update({ password: hashing(newPW) }, { where: { uid: req.user.id } })
		}
		if(intro) {
			await User.update({ intro }, { where: { uid: req.user.id } })
		}
		return res.status(201).json({ result: '성공' })
	} catch (err) {
		console.error(err)
		next(err)
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
	getUsers,
	getRanking,
	getCorrect,
	update,
	updateSelf,
	sendMail,
	getNotice,
	downloadFile,
}
